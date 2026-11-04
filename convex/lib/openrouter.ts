// // convex/lib/openrouter.ts — streaming helper reused by plan + check-in + recipe generation.

// interface OpenRouterUsage {
//   prompt_tokens?: number;
//   completion_tokens?: number;
//   total_tokens?: number;
//   completion_tokens_details?: { reasoning_tokens?: number };
// }

// interface OpenRouterStreamChunk {
//   id?: string;
//   model?: string;
//   provider?: string;
//   choices?: {
//     delta?: { content?: string; reasoning?: string };
//     finish_reason?: string | null;
//     native_finish_reason?: string | null;
//     error?: { message?: string; code?: number };
//   }[];
//   usage?: OpenRouterUsage;
//   error?: { message?: string; code?: number };
// }

// /** Default model. Override per call with `opts.model`, or globally with the OPENROUTER_MODEL env var. */
// export const MODEL =
//   process.env.OPENROUTER_MODEL ??
//   "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

// export type ReasoningEffort = "low" | "medium" | "high";

// export interface StreamOptions {
//   /** Tags log lines, e.g. "recipes". */
//   label?: string;
//   /** Override the model for this call. */
//   model?: string;
//   /**
//    * How hard reasoning models should think. "low" keeps them from burning the whole
//    * token budget on thinking. Ignored by non-reasoning models.
//    */
//   reasoningEffort?: ReasoningEffort;
//   /** Abort the request if it runs longer than this. Default 4 minutes. */
//   timeoutMs?: number;
// }

// /** Thrown when the model hit max_tokens, so callers can retry with a bigger budget. */
// export class TruncatedOutputError extends Error {
//   constructor(
//     message: string,
//     public readonly partialText: string,
//     public readonly reasoningTokens: number | undefined,
//   ) {
//     super(message);
//     this.name = "TruncatedOutputError";
//   }
// }

// function isStreamChunk(x: unknown): x is OpenRouterStreamChunk {
//   return typeof x === "object" && x !== null;
// }

// /**
//  * Streams a completion. `onText` receives the full text so far on every delta
//  * (throttle inside the callback). Resolves with the final trimmed text; throws on failure.
//  *
//  * Backwards compatible: the 4th argument may be a plain string (treated as the log label)
//  * or an options object.
//  */
// export async function streamCompletion(
//   prompt: string,
//   onText: (fullText: string) => Promise<void>,
//   maxTokens: number,
//   options: string | StreamOptions = {},
// ): Promise<string> {
//   const apiKey = process.env.OPENROUTER_API_KEY;
//   if (!apiKey) {
//     throw new Error(
//       "OPENROUTER_API_KEY is missing. Run `npx convex env set OPENROUTER_API_KEY <key>`.",
//     );
//   }

//   const opts: StreamOptions =
//     typeof options === "string" ? { label: options } : options;
//   const model = opts.model ?? MODEL;
//   const effort: ReasoningEffort = opts.reasoningEffort ?? "low";
//   const timeoutMs = opts.timeoutMs ?? 4 * 60 * 1000;
//   const tag = `[openrouter:${opts.label ?? "stream"}]`;
//   const startedAt = Date.now();

//   console.log(`${tag} request`, {
//     model,
//     promptChars: prompt.length,
//     maxTokens,
//     reasoningEffort: effort,
//   });

//   const controller = new AbortController();
//   const timer = setTimeout(() => controller.abort(), timeoutMs);

//   try {
//     const response = await fetch(
//       "https://openrouter.ai/api/v1/chat/completions",
//       {
//         method: "POST",
//         signal: controller.signal,
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${apiKey}`,
//         },
//         body: JSON.stringify({
//           model,
//           messages: [{ role: "user", content: prompt }],
//           max_tokens: maxTokens,
//           stream: true,
//           // NOTE: `exclude: true` only hides reasoning from the response; the model still
//           // spends tokens on it. `effort` is what actually limits the thinking.
//           reasoning: { effort },
//         }),
//       },
//     );

//     console.log(`${tag} response`, {
//       status: response.status,
//       ok: response.ok,
//       contentType: response.headers.get("content-type"),
//       ttfbMs: Date.now() - startedAt,
//       rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
//       retryAfter: response.headers.get("retry-after"),
//     });

//     if (!response.ok || !response.body) {
//       const raw = await response.text().catch(() => "");
//       console.error(`${tag} HTTP error`, {
//         status: response.status,
//         body: raw.slice(0, 1000),
//       });
//       throw new Error(`OpenRouter ${response.status}: ${raw.slice(0, 300)}`);
//     }

//     const reader = response.body.getReader();
//     const decoder = new TextDecoder();
//     let buffer = "";
//     let fullText = "";

//     // Diagnostics
//     let chunkCount = 0;
//     let contentChars = 0;
//     let reasoningChars = 0;
//     let unparsableFrames = 0;
//     let sseComments = 0;
//     let streamErrors = 0;
//     let finishReason: string | null = null;
//     let nativeFinishReason: string | null = null;
//     let usage: OpenRouterUsage | undefined;
//     let servedModel: string | undefined;
//     let provider: string | undefined;
//     let firstContentAt: number | null = null;
//     const nonSseSamples: string[] = [];

//     const handleFrame = async (frame: string): Promise<void> => {
//       const line = frame.trim();
//       if (!line) return;

//       // SSE comments like ": OPENROUTER PROCESSING" are keep-alives.
//       if (line.startsWith(":")) {
//         sseComments++;
//         return;
//       }
//       if (!line.startsWith("data:")) {
//         if (nonSseSamples.length < 3) nonSseSamples.push(line.slice(0, 300));
//         return;
//       }

//       const payload = line.slice("data:".length).trim();
//       if (payload === "[DONE]") return;

//       let chunk: unknown;
//       try {
//         chunk = JSON.parse(payload);
//       } catch {
//         unparsableFrames++;
//         if (unparsableFrames <= 3) {
//           console.warn(`${tag} unparsable frame`, payload.slice(0, 200));
//         }
//         return;
//       }
//       if (!isStreamChunk(chunk)) return;
//       chunkCount++;

//       if (chunk.model) servedModel = chunk.model;
//       if (chunk.provider) provider = chunk.provider;
//       if (chunk.usage) usage = chunk.usage;

//       if (chunk.error) {
//         streamErrors++;
//         console.error(`${tag} stream error`, JSON.stringify(chunk.error));
//         return;
//       }

//       const choice = chunk.choices?.[0];
//       if (choice?.error) {
//         streamErrors++;
//         console.error(`${tag} choice error`, JSON.stringify(choice.error));
//       }
//       if (choice?.finish_reason) finishReason = choice.finish_reason;
//       if (choice?.native_finish_reason) {
//         nativeFinishReason = choice.native_finish_reason;
//       }

//       const reasoningDelta = choice?.delta?.reasoning;
//       if (reasoningDelta) reasoningChars += reasoningDelta.length;

//       const delta = choice?.delta?.content;
//       if (delta) {
//         if (firstContentAt === null) firstContentAt = Date.now();
//         contentChars += delta.length;
//         fullText += delta;
//         await onText(fullText);
//       }
//     };

//     try {
//       while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         buffer += decoder.decode(value, { stream: true });
//         const frames = buffer.split("\n\n");
//         buffer = frames.pop() ?? "";
//         for (const frame of frames) await handleFrame(frame);
//       }
//       // Flush the decoder and any final frame that had no trailing blank line.
//       buffer += decoder.decode();
//       if (buffer.trim()) await handleFrame(buffer);
//     } catch (e: unknown) {
//       const aborted = controller.signal.aborted;
//       console.error(`${tag} stream read failed`, {
//         error: e instanceof Error ? e.message : String(e),
//         timedOut: aborted,
//         contentCharsSoFar: contentChars,
//         elapsedMs: Date.now() - startedAt,
//       });
//       throw aborted
//         ? new Error(`OpenRouter request timed out after ${timeoutMs} ms`)
//         : e;
//     }

//     const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens;
//     const summary = {
//       elapsedMs: Date.now() - startedAt,
//       msToFirstContent: firstContentAt ? firstContentAt - startedAt : null,
//       servedModel,
//       provider,
//       chunks: chunkCount,
//       contentChars,
//       reasoningChars,
//       finishReason,
//       nativeFinishReason,
//       promptTokens: usage?.prompt_tokens,
//       completionTokens: usage?.completion_tokens,
//       reasoningTokens,
//       maxTokens,
//       sseComments,
//       unparsableFrames,
//       streamErrors,
//       nonSseSamples,
//     };

//     const truncated = finishReason === "length";
//     if (
//       truncated ||
//       contentChars === 0 ||
//       streamErrors > 0 ||
//       unparsableFrames > 0
//     ) {
//       console.error(`${tag} PROBLEM`, summary);
//     } else {
//       console.log(`${tag} done`, summary);
//     }

//     if (truncated) {
//       const why =
//         contentChars === 0
//           ? "all tokens were spent on reasoning"
//           : "the output was cut off";
//       console.error(`${tag} hit max_tokens (${maxTokens}): ${why}.`);
//       throw new TruncatedOutputError(
//         `Model hit max_tokens (${maxTokens}); ${why}.`,
//         fullText.trim(),
//         reasoningTokens,
//       );
//     }

//     return fullText.trim();
//   } finally {
//     clearTimeout(timer);
//   }
// }
// convex/lib/openrouter.ts — streaming helper reused by plan + check-in + recipe + inspiration generation.
//
// Tries models IN ORDER until one produces text:
//   1. OpenRouter models (free ones by default)
//   2. Gemini models (backup)        <- set AI_PRIMARY=gemini to flip the order
//
// A model that is gone (404), rate limited (429), down (5xx), times out, errors
// mid-stream, or returns nothing simply hands over to the next one.
// If a model hits max_tokens we throw TruncatedOutputError straight away so the
// caller can retry with a bigger budget (same behaviour as before).
//
// Env vars (all optional except at least one key):
//   OPENROUTER_API_KEY     npx convex env set OPENROUTER_API_KEY <key>
//   GEMINI_API_KEY         npx convex env set GEMINI_API_KEY <key>
//   OPENROUTER_MODELS      comma list, e.g. "slugA,slugB"   (OPENROUTER_MODEL = single id, still works)
//   GEMINI_MODELS          comma list, e.g. "gemini-3.8-flash,gemini-2.5-flash" (GEMINI_MODEL = single id)
//   AI_PRIMARY             "gemini" to try Gemini before OpenRouter

// convex/lib/openrouter.ts — streaming helper reused by plan + check-in + recipe + inspiration generation.
//
// Tries models IN ORDER until one produces text:
//   1. OpenRouter models (free ones by default)
//   2. Gemini models (backup)        <- set AI_PRIMARY=gemini to flip the order
//
// A model that is gone (404/410/"not a valid model ID"), rate limited (429), down (5xx),
// times out, errors mid-stream, or returns nothing simply hands over to the next one.
// If a model hits max_tokens we throw TruncatedOutputError straight away so the
// caller can retry with a bigger budget.
//
// Env vars (all optional except at least one key):
//   OPENROUTER_API_KEY     npx convex env set OPENROUTER_API_KEY <key>
//   GEMINI_API_KEY         npx convex env set GEMINI_API_KEY <key>
//   OPENROUTER_MODELS      comma list of REAL OpenRouter ids, tried BEFORE the built-in defaults
//                          e.g. "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free,openrouter/free"
//                          (OPENROUTER_MODEL = single id, still works)
//   GEMINI_MODELS          comma list of REAL Gemini ids, tried BEFORE the built-in defaults
//                          e.g. "gemini-3.7-flash,gemini-3.6-flash"  (GEMINI_MODEL = single id)
//   AI_PRIMARY             "gemini" to try Gemini before OpenRouter
//
// Safety nets added after the "slugA / slugB" outage:
//   - Env lists are ADDED TO the defaults (they no longer replace them), so one bad env
//     value can never leave you with zero working models.
//   - Placeholder / malformed ids ("slugA", "<model-id>", "your-model" ...) are dropped
//     with a loud warning instead of being sent to the API.
//   - A 400 "not a valid model ID" counts as "model gone", not a generic error.
//   - Models that are known-gone are skipped for 10 minutes across calls (warm isolate).
//
// To see which free ids are live today:  https://openrouter.ai/models?q=free
// Gemini ids and shutdown dates:         https://ai.google.dev/gemini-api/docs/deprecations

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Tried in order (after anything in OPENROUTER_MODELS). Free slugs churn constantly -
 * "openrouter/free" is OpenRouter's own router that picks a currently-live free model,
 * so it is the safety net at the end.
 */
const DEFAULT_OPENROUTER_MODELS: readonly string[] = [
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-4-31b-it:free",
  "openrouter/free",
];

/** gemini-2.5-flash is retired and gemini-3.8-flash does not exist - both removed. */
const DEFAULT_GEMINI_MODELS: readonly string[] = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
];

const MAX_OPENROUTER_MODELS = 5;
const MAX_GEMINI_MODELS = 4;
const DEFAULT_ATTEMPT_TIMEOUT_MS = 2.5 * 60 * 1000; // ONE model
const DEFAULT_TOTAL_TIMEOUT_MS = 7 * 60 * 1000; // all models together (Convex actions allow 10 min)
const MIN_ATTEMPT_WINDOW_MS = 5_000; // don't start a call with less time left
const DEAD_MODEL_TTL_MS = 10 * 60 * 1000; // how long a "gone" model is skipped

export type ReasoningEffort = "low" | "medium" | "high";

export interface StreamOptions {
  /** Tags log lines, e.g. "recipes". */
  label?: string;
  /** Try this OpenRouter model FIRST for this call (the rest of the list is still the backup). */
  model?: string;
  /**
   * How hard reasoning models should think. "low" keeps them from burning the whole
   * token budget on thinking. Ignored by non-reasoning models.
   */
  reasoningEffort?: ReasoningEffort;
  /** Abort ONE model's request if it runs longer than this. Default 2.5 minutes. */
  timeoutMs?: number;
  /** Give up on the whole fallback chain after this long. Default 7 minutes. */
  totalTimeoutMs?: number;
}

/** Thrown when the model hit max_tokens, so callers can retry with a bigger budget. */
export class TruncatedOutputError extends Error {
  constructor(
    message: string,
    public readonly partialText: string,
    public readonly reasoningTokens: number | undefined,
  ) {
    super(message);
    this.name = "TruncatedOutputError";
  }
}

type Provider = "openrouter" | "gemini";

interface Attempt {
  provider: Provider;
  model: string;
}

type FailKind = "auth" | "gone" | "rate_limited" | "timeout" | "error";

/** One model failed in a way that means "try the next one". */
class AttemptError extends Error {
  constructor(
    message: string,
    public readonly kind: FailKind,
  ) {
    super(message);
    this.name = "AttemptError";
  }
}

/* ------------------------------- helpers ------------------------------- */

interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  completion_tokens_details?: { reasoning_tokens?: number };
}

interface OpenRouterStreamChunk {
  id?: string;
  model?: string;
  provider?: string;
  choices?: {
    delta?: { content?: string; reasoning?: string };
    finish_reason?: string | null;
    native_finish_reason?: string | null;
    error?: { message?: string; code?: number };
  }[];
  usage?: OpenRouterUsage;
  error?: { message?: string; code?: number };
}

interface GeminiStreamChunk {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
  };
  error?: { message?: string; code?: number };
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function parseList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, "")) // tolerate quoted env values
    .filter(Boolean);
}

/** Things people paste in as stand-ins and forget to replace. */
const PLACEHOLDER_RE =
  /^(slug[a-z0-9_-]*|model[-_ ]?id|your[-_ ].*|<.*>|\[.*\]|example.*|todo|tbd|changeme|none|null|undefined|x{2,})$/i;

/** OpenRouter ids look like "vendor/model-name" or "vendor/model-name:free". */
function isValidOpenRouterId(id: string): boolean {
  if (PLACEHOLDER_RE.test(id)) return false;
  return /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._:-]*$/i.test(id);
}

/** Gemini ids look like "gemini-3.7-flash". */
function isValidGeminiId(id: string): boolean {
  if (PLACEHOLDER_RE.test(id)) return false;
  return /^(gemini|gemma)-[a-z0-9][a-z0-9._-]*$/i.test(id);
}

const warnedBadIds = new Set<string>();

function cleanList(
  provider: Provider,
  ids: string[],
  isValid: (id: string) => boolean,
): string[] {
  const out: string[] = [];
  for (const id of ids) {
    if (isValid(id)) {
      out.push(id);
    } else if (!warnedBadIds.has(`${provider}:${id}`)) {
      warnedBadIds.add(`${provider}:${id}`);
      console.error(
        `[ai] IGNORING invalid ${provider} model id "${id}" (placeholder or malformed). ` +
          `Fix it with: npx convex env set ${
            provider === "openrouter" ? "OPENROUTER_MODELS" : "GEMINI_MODELS"
          } "<real-id>,<real-id>"  (or unset it to use the defaults).`,
      );
    }
  }
  return out;
}

/* Models that answered "gone" recently - skipped across calls while this isolate is warm. */
const deadCache = new Map<string, number>();

function markDead(id: string): void {
  deadCache.set(id, Date.now());
}

function isDeadCached(id: string): boolean {
  const at = deadCache.get(id);
  if (at === undefined) return false;
  if (Date.now() - at > DEAD_MODEL_TTL_MS) {
    deadCache.delete(id);
    return false;
  }
  return true;
}

function getOpenRouterModels(first?: string): string[] {
  const fromEnv = [
    ...parseList(process.env.OPENROUTER_MODELS),
    ...parseList(process.env.OPENROUTER_MODEL),
  ];
  // Env ids go first, defaults are ALWAYS appended as backup.
  const merged = [
    ...(first ? [first] : []),
    ...fromEnv,
    ...DEFAULT_OPENROUTER_MODELS,
  ];
  const unique = Array.from(new Set(merged));
  return cleanList("openrouter", unique, isValidOpenRouterId).slice(
    0,
    MAX_OPENROUTER_MODELS,
  );
}

function getGeminiModels(): string[] {
  const fromEnv = [
    ...parseList(process.env.GEMINI_MODELS),
    ...parseList(process.env.GEMINI_MODEL),
  ];
  const merged = [...fromEnv, ...DEFAULT_GEMINI_MODELS];
  const unique = Array.from(new Set(merged));
  return cleanList("gemini", unique, isValidGeminiId).slice(
    0,
    MAX_GEMINI_MODELS,
  );
}

/** Default (first) OpenRouter model. Kept as an export for backwards compatibility. */
export const MODEL = getOpenRouterModels()[0] ?? DEFAULT_OPENROUTER_MODELS[0];

function buildAttempts(
  hasOpenRouter: boolean,
  hasGemini: boolean,
  firstModel?: string,
): Attempt[] {
  const openrouter: Attempt[] = hasOpenRouter
    ? getOpenRouterModels(firstModel).map((model) => ({
        provider: "openrouter" as const,
        model,
      }))
    : [];
  const gemini: Attempt[] = hasGemini
    ? getGeminiModels().map((model) => ({
        provider: "gemini" as const,
        model,
      }))
    : [];
  const geminiFirst =
    (process.env.AI_PRIMARY ?? "").trim().toLowerCase() === "gemini";
  const all = geminiFirst
    ? [...gemini, ...openrouter]
    : [...openrouter, ...gemini];

  // Skip recently-dead models, but never end up with nothing to try.
  const alive = all.filter((a) => !isDeadCached(`${a.provider}:${a.model}`));
  return alive.length > 0 ? alive : all;
}

/**
 * Reads a Server-Sent-Events body and hands every complete frame to `onFrame`.
 * Frames are separated by a blank line; \r\n is normalised to \n first.
 */
async function readSseFrames(
  body: ReadableStream<Uint8Array>,
  onFrame: (frame: string) => Promise<void>,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) await onFrame(frame);
  }
  // Flush the decoder and any final frame that had no trailing blank line.
  buffer += decoder.decode().replace(/\r\n/g, "\n");
  if (buffer.trim()) await onFrame(buffer);
}

/** Extracts the `data:` payload from one SSE frame (handles multi-line data). */
function frameData(frame: string): string | null {
  const lines = frame.split("\n");
  const data: string[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("data:")) data.push(line.slice("data:".length).trim());
  }
  return data.length > 0 ? data.join("\n") : null;
}

/* ------------------------------ OpenRouter ----------------------------- */

/** HTTP 400s that really mean "this model id doesn't exist / can't be used". */
const OPENROUTER_BAD_MODEL_RE =
  /not a valid model|invalid model|unknown model|no endpoints found|model .*(not found|not available|does not exist)/i;

async function streamOpenRouter(
  apiKey: string,
  model: string,
  prompt: string,
  onText: (fullText: string) => Promise<void>,
  maxTokens: number,
  effort: ReasoningEffort,
  timeoutMs: number,
  label: string,
): Promise<string> {
  const tag = `[openrouter:${label}]`;
  const startedAt = Date.now();
  console.log(`${tag} request`, {
    model,
    promptChars: prompt.length,
    maxTokens,
    reasoningEffort: effort,
    timeoutSec: Math.round(timeoutMs / 1000),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: maxTokens,
          stream: true,
          // `exclude: true` would only HIDE reasoning; `effort` is what limits the thinking.
          reasoning: { effort },
        }),
      });
    } catch (e: unknown) {
      throw new AttemptError(
        controller.signal.aborted
          ? `${model}: no response within ${Math.round(timeoutMs / 1000)}s`
          : `${model}: network error ${e instanceof Error ? e.message : String(e)}`,
        controller.signal.aborted ? "timeout" : "error",
      );
    }

    console.log(`${tag} response`, {
      model,
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      ttfbMs: Date.now() - startedAt,
      rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
      retryAfter: response.headers.get("retry-after"),
    });

    if (!response.ok || !response.body) {
      const raw = await response.text().catch(() => "");
      console.error(`${tag} HTTP error`, {
        model,
        status: response.status,
        body: raw.slice(0, 1000),
      });
      if (response.status === 404 && /use this slug instead/i.test(raw)) {
        console.error(
          `${tag} the free slug "${model}" was retired. Update it with: npx convex env set OPENROUTER_MODELS "<slug>,<slug>" (the message above names the paid slug if you want it).`,
        );
      }
      const message = `OpenRouter ${response.status} (${model}): ${raw.slice(0, 300)}`;
      if (response.status === 401) throw new AttemptError(message, "auth");
      if (
        response.status === 404 ||
        response.status === 403 ||
        response.status === 410
      ) {
        throw new AttemptError(message, "gone");
      }
      if (response.status === 400 && OPENROUTER_BAD_MODEL_RE.test(raw)) {
        console.error(
          `${tag} "${model}" is not a valid OpenRouter model id - check OPENROUTER_MODELS.`,
        );
        throw new AttemptError(message, "gone");
      }
      if (response.status === 429 || response.status === 402) {
        throw new AttemptError(message, "rate_limited");
      }
      throw new AttemptError(message, "error");
    }

    // Diagnostics
    let fullText = "";
    let chunkCount = 0;
    let contentChars = 0;
    let reasoningChars = 0;
    let unparsableFrames = 0;
    let sseComments = 0;
    let streamErrors = 0;
    let lastStreamErrorCode: number | undefined;
    let finishReason: string | null = null;
    let nativeFinishReason: string | null = null;
    let usage: OpenRouterUsage | undefined;
    let servedModel: string | undefined;
    let provider: string | undefined;
    let firstContentAt: number | null = null;
    const nonSseSamples: string[] = [];

    const handleFrame = async (frame: string): Promise<void> => {
      const line = frame.trim();
      if (!line) return;

      // SSE comments like ": OPENROUTER PROCESSING" are keep-alives.
      if (line.startsWith(":")) {
        sseComments++;
        return;
      }
      const payload = frameData(frame);
      if (payload === null) {
        if (nonSseSamples.length < 3) nonSseSamples.push(line.slice(0, 300));
        return;
      }
      if (payload === "[DONE]") return;

      let chunk: unknown;
      try {
        chunk = JSON.parse(payload);
      } catch {
        unparsableFrames++;
        if (unparsableFrames <= 3) {
          console.warn(`${tag} unparsable frame`, payload.slice(0, 200));
        }
        return;
      }
      if (!isObject(chunk)) return;
      const c = chunk as OpenRouterStreamChunk;
      chunkCount++;

      if (c.model) servedModel = c.model;
      if (c.provider) provider = c.provider;
      if (c.usage) usage = c.usage;

      if (c.error) {
        streamErrors++;
        lastStreamErrorCode = c.error.code;
        console.error(`${tag} stream error`, JSON.stringify(c.error));
        return;
      }

      const choice = c.choices?.[0];
      if (choice?.error) {
        streamErrors++;
        lastStreamErrorCode = choice.error.code;
        console.error(`${tag} choice error`, JSON.stringify(choice.error));
      }
      if (choice?.finish_reason) finishReason = choice.finish_reason;
      if (choice?.native_finish_reason) {
        nativeFinishReason = choice.native_finish_reason;
      }

      const reasoningDelta = choice?.delta?.reasoning;
      if (reasoningDelta) reasoningChars += reasoningDelta.length;

      const delta = choice?.delta?.content;
      if (delta) {
        if (firstContentAt === null) firstContentAt = Date.now();
        contentChars += delta.length;
        fullText += delta;
        await onText(fullText);
      }
    };

    try {
      await readSseFrames(response.body, handleFrame);
    } catch (e: unknown) {
      if (e instanceof AttemptError || e instanceof TruncatedOutputError) {
        throw e;
      }
      const aborted = controller.signal.aborted;
      console.error(`${tag} stream read failed`, {
        model,
        error: e instanceof Error ? e.message : String(e),
        timedOut: aborted,
        contentCharsSoFar: contentChars,
        elapsedMs: Date.now() - startedAt,
      });
      throw new AttemptError(
        aborted
          ? `${model}: timed out after ${Math.round(timeoutMs / 1000)}s`
          : `${model}: stream failed (${e instanceof Error ? e.message : String(e)})`,
        aborted ? "timeout" : "error",
      );
    }

    const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens;
    const summary = {
      model,
      elapsedMs: Date.now() - startedAt,
      msToFirstContent: firstContentAt ? firstContentAt - startedAt : null,
      servedModel,
      provider,
      chunks: chunkCount,
      contentChars,
      reasoningChars,
      finishReason,
      nativeFinishReason,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      reasoningTokens,
      maxTokens,
      sseComments,
      unparsableFrames,
      streamErrors,
      nonSseSamples,
    };

    const truncated = finishReason === "length";
    if (
      truncated ||
      contentChars === 0 ||
      streamErrors > 0 ||
      unparsableFrames > 0
    ) {
      console.error(`${tag} PROBLEM`, summary);
    } else {
      console.log(`${tag} done`, summary);
    }

    if (truncated) {
      const why =
        contentChars === 0
          ? "all tokens were spent on reasoning"
          : "the output was cut off";
      console.error(`${tag} hit max_tokens (${maxTokens}): ${why}.`);
      throw new TruncatedOutputError(
        `Model hit max_tokens (${maxTokens}); ${why}.`,
        fullText.trim(),
        reasoningTokens,
      );
    }

    if (contentChars === 0) {
      throw new AttemptError(
        `${model}: returned no content${streamErrors > 0 ? " (stream error)" : ""}`,
        lastStreamErrorCode === 429 ? "rate_limited" : "error",
      );
    }

    return fullText.trim();
  } finally {
    clearTimeout(timer);
  }
}

/* -------------------------------- Gemini ------------------------------- */

/** HTTP 400s that really mean "this model id doesn't exist / isn't supported". */
const GEMINI_BAD_MODEL_RE =
  /model.*(not found|not supported|is not valid|invalid|unknown|no longer available)|is not found for API version|unsupported model/i;

async function streamGemini(
  apiKey: string,
  model: string,
  prompt: string,
  onText: (fullText: string) => Promise<void>,
  maxTokens: number,
  timeoutMs: number,
  label: string,
): Promise<string> {
  const tag = `[gemini:${label}]`;
  const startedAt = Date.now();
  console.log(`${tag} request`, {
    model,
    promptChars: prompt.length,
    maxTokens,
    timeoutSec: Math.round(timeoutMs / 1000),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response: Response;
    try {
      response = await fetch(
        `${GEMINI_URL}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            // maxOutputTokens also covers "thinking" tokens on newer Gemini models.
            generationConfig: { maxOutputTokens: maxTokens },
          }),
        },
      );
    } catch (e: unknown) {
      throw new AttemptError(
        controller.signal.aborted
          ? `${model}: no response within ${Math.round(timeoutMs / 1000)}s`
          : `${model}: network error ${e instanceof Error ? e.message : String(e)}`,
        controller.signal.aborted ? "timeout" : "error",
      );
    }

    console.log(`${tag} response`, {
      model,
      status: response.status,
      ok: response.ok,
      ttfbMs: Date.now() - startedAt,
    });

    if (!response.ok || !response.body) {
      const raw = await response.text().catch(() => "");
      console.error(`${tag} HTTP error`, {
        model,
        status: response.status,
        body: raw.slice(0, 1000),
      });
      const message = `Gemini ${response.status} (${model}): ${raw.slice(0, 300)}`;
      if (
        response.status === 401 ||
        response.status === 403 ||
        (response.status === 400 && /API_KEY|API key/i.test(raw))
      ) {
        throw new AttemptError(message, "auth");
      }
      if (
        response.status === 404 ||
        (response.status === 400 && GEMINI_BAD_MODEL_RE.test(raw))
      ) {
        console.error(
          `${tag} model "${model}" not found. Fix with: npx convex env set GEMINI_MODELS "<model-id>,<model-id>"`,
        );
        throw new AttemptError(message, "gone");
      }
      if (response.status === 429)
        throw new AttemptError(message, "rate_limited");
      throw new AttemptError(message, "error");
    }

    let fullText = "";
    let chunkCount = 0;
    let unparsableFrames = 0;
    let finishReason: string | undefined;
    let blockReason: string | undefined;
    let usage: GeminiStreamChunk["usageMetadata"];
    let streamErrorCode: number | undefined;
    let firstContentAt: number | null = null;

    const handleFrame = async (frame: string): Promise<void> => {
      const payload = frameData(frame);
      if (payload === null || payload === "[DONE]") return;

      let chunk: unknown;
      try {
        chunk = JSON.parse(payload);
      } catch {
        unparsableFrames++;
        if (unparsableFrames <= 3) {
          console.warn(`${tag} unparsable frame`, payload.slice(0, 200));
        }
        return;
      }
      if (!isObject(chunk)) return;
      const c = chunk as GeminiStreamChunk;
      chunkCount++;

      if (c.error) {
        streamErrorCode = c.error.code;
        console.error(`${tag} stream error`, JSON.stringify(c.error));
        return;
      }
      if (c.promptFeedback?.blockReason) {
        blockReason = c.promptFeedback.blockReason;
      }
      if (c.usageMetadata) usage = c.usageMetadata;

      const candidate = c.candidates?.[0];
      if (candidate?.finishReason) finishReason = candidate.finishReason;

      // Skip "thought" parts (thinking summaries); keep real answer text only.
      const delta = (candidate?.content?.parts ?? [])
        .filter((p) => !p.thought)
        .map((p) => p.text ?? "")
        .join("");
      if (delta) {
        if (firstContentAt === null) firstContentAt = Date.now();
        fullText += delta;
        await onText(fullText);
      }
    };

    try {
      await readSseFrames(response.body, handleFrame);
    } catch (e: unknown) {
      if (e instanceof AttemptError || e instanceof TruncatedOutputError) {
        throw e;
      }
      const aborted = controller.signal.aborted;
      console.error(`${tag} stream read failed`, {
        model,
        error: e instanceof Error ? e.message : String(e),
        timedOut: aborted,
        contentCharsSoFar: fullText.length,
        elapsedMs: Date.now() - startedAt,
      });
      throw new AttemptError(
        aborted
          ? `${model}: timed out after ${Math.round(timeoutMs / 1000)}s`
          : `${model}: stream failed (${e instanceof Error ? e.message : String(e)})`,
        aborted ? "timeout" : "error",
      );
    }

    const summary = {
      model,
      elapsedMs: Date.now() - startedAt,
      msToFirstContent: firstContentAt ? firstContentAt - startedAt : null,
      chunks: chunkCount,
      contentChars: fullText.length,
      finishReason,
      blockReason,
      promptTokens: usage?.promptTokenCount,
      completionTokens: usage?.candidatesTokenCount,
      reasoningTokens: usage?.thoughtsTokenCount,
      maxTokens,
      unparsableFrames,
      streamErrorCode,
    };

    const truncated = finishReason === "MAX_TOKENS";
    if (
      truncated ||
      fullText.length === 0 ||
      blockReason ||
      unparsableFrames > 0
    ) {
      console.error(`${tag} PROBLEM`, summary);
    } else {
      console.log(`${tag} done`, summary);
    }

    if (truncated) {
      const why =
        fullText.length === 0
          ? "all tokens were spent on thinking"
          : "the output was cut off";
      throw new TruncatedOutputError(
        `Model hit max_tokens (${maxTokens}); ${why}.`,
        fullText.trim(),
        usage?.thoughtsTokenCount,
      );
    }

    if (fullText.length === 0) {
      throw new AttemptError(
        `${model}: returned no content${blockReason ? ` (blocked: ${blockReason})` : ""}`,
        streamErrorCode === 429 ? "rate_limited" : "error",
      );
    }

    return fullText.trim();
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------- public API ---------------------------- */

/**
 * Streams a completion. `onText` receives the full text so far on every delta
 * (throttle inside the callback). Resolves with the final trimmed text; throws on failure.
 *
 * If a model fails (gone / rate limited / down / timeout / empty) the next model in the
 * list is tried automatically, ending with Gemini. `onText` always receives the FULL text
 * of the model currently answering, so a restart simply replaces what was shown.
 *
 * Backwards compatible: the 4th argument may be a plain string (treated as the log label)
 * or an options object.
 */
export async function streamCompletion(
  prompt: string,
  onText: (fullText: string) => Promise<void>,
  maxTokens: number,
  options: string | StreamOptions = {},
): Promise<string> {
  const openrouterKey = process.env.OPENROUTER_API_KEY || undefined;
  const geminiKey = process.env.GEMINI_API_KEY || undefined;
  if (!openrouterKey && !geminiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is missing. Run `npx convex env set OPENROUTER_API_KEY <key>` (and/or `npx convex env set GEMINI_API_KEY <key>`).",
    );
  }

  const opts: StreamOptions =
    typeof options === "string" ? { label: options } : options;
  const effort: ReasoningEffort = opts.reasoningEffort ?? "low";
  const perAttemptMs = opts.timeoutMs ?? DEFAULT_ATTEMPT_TIMEOUT_MS;
  const totalMs = opts.totalTimeoutMs ?? DEFAULT_TOTAL_TIMEOUT_MS;
  const label = opts.label ?? "stream";
  const startedAt = Date.now();
  const deadline = startedAt + totalMs;

  const attempts = buildAttempts(
    Boolean(openrouterKey),
    Boolean(geminiKey),
    opts.model,
  );
  console.log(`[ai:${label}] attempts in order`, attempts);

  if (attempts.length === 0) {
    throw new Error(
      "No usable AI models configured. Check OPENROUTER_MODELS / GEMINI_MODELS in the Convex env (placeholders like slugA are ignored).",
    );
  }

  const failures: string[] = [];
  const deadProviders = new Set<Provider>(); // provider whose key was rejected
  const deadModels = new Set<string>();

  for (const attempt of attempts) {
    const id = `${attempt.provider}:${attempt.model}`;
    if (deadProviders.has(attempt.provider) || deadModels.has(id)) continue;

    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_WINDOW_MS) {
      failures.push("out of time");
      console.error(`[ai:${label}] out of time budget`);
      break;
    }
    const timeoutMs = Math.min(perAttemptMs, remaining);

    try {
      if (attempt.provider === "openrouter") {
        return await streamOpenRouter(
          openrouterKey ?? "",
          attempt.model,
          prompt,
          onText,
          maxTokens,
          effort,
          timeoutMs,
          label,
        );
      }
      return await streamGemini(
        geminiKey ?? "",
        attempt.model,
        prompt,
        onText,
        maxTokens,
        timeoutMs,
        label,
      );
    } catch (e: unknown) {
      // Out of tokens: not a "bad model" - let the caller retry with a bigger budget.
      if (e instanceof TruncatedOutputError) throw e;
      if (e instanceof AttemptError) {
        failures.push(`${id} -> ${e.kind}`);
        if (e.kind === "auth") {
          deadProviders.add(attempt.provider);
          console.error(
            `[ai:${label}] ${attempt.provider} key was rejected - skipping that provider`,
          );
        } else if (e.kind === "gone") {
          deadModels.add(id);
          markDead(id);
        }
        console.warn(`[ai:${label}] ${id} failed (${e.kind}), trying next`, {
          message: e.message.slice(0, 300),
        });
        continue;
      }
      // Anything unexpected (e.g. the onText callback threw): don't hide it.
      throw e;
    }
  }

  console.error(`[ai:${label}] ALL MODELS FAILED`, { failures });
  const allAuth =
    failures.length > 0 && failures.every((f) => f.endsWith("-> auth"));
  throw new Error(
    allAuth
      ? "AI keys were rejected. Check OPENROUTER_API_KEY and GEMINI_API_KEY in the Convex env."
      : `All AI models failed: ${failures.join(" | ")}`,
  );
}
