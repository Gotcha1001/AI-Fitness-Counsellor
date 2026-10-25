// convex/lib/openrouter.ts — streaming helper reused by plan + check-in generation.
interface OpenRouterStreamChunk {
  choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
  error?: { message?: string; code?: number };
}

export const MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

function isStreamChunk(x: unknown): x is OpenRouterStreamChunk {
  return typeof x === "object" && x !== null;
}

/**
 * Streams a completion. `onText` receives the full text so far on every delta
 * (throttle inside the callback). Resolves with the final trimmed text; throws on failure.
 */
export async function streamCompletion(
  prompt: string,
  onText: (fullText: string) => Promise<void>,
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is missing. Run `npx convex env set OPENROUTER_API_KEY <key>`.",
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        stream: true,
      }),
    },
  );

  if (!response.ok || !response.body) {
    const raw = await response.text().catch(() => "");
    throw new Error(`OpenRouter ${response.status}: ${raw.slice(0, 300)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice("data:".length).trim();
      if (payload === "[DONE]") continue;
      let chunk: unknown;
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }
      if (!isStreamChunk(chunk)) continue;
      if (chunk.error) {
        console.error(
          "[openrouter] stream error:",
          JSON.stringify(chunk.error),
        );
        continue;
      }
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullText += delta;
        await onText(fullText);
      }
    }
  }
  return fullText.trim();
}
