// convex/inspirations.ts
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import { moodValidator } from "./lib/validators";

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const STUCK_MS = 5 * 60_000; // a "generating" row older than this is considered dead
const MAX_BOOSTS_PER_DAY = 5; // protects the free model + stops spam
const MAX_NOTE_CHARS = 300;

/** Client sends its local date; we only sanity-check it (±2 days covers every timezone). */
function assertDateKey(dateKey: string): void {
  const t = Date.parse(`${dateKey}T12:00:00Z`);
  if (
    !DATE_KEY.test(dateKey) ||
    Number.isNaN(t) ||
    Math.abs(t - Date.now()) > 2 * DAY_MS
  ) {
    throw new Error("Invalid date.");
  }
}

function previousKey(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ───────────────────────── queries ─────────────────────────

/** Today's daily inspiration (null until it has been created). */
export const getToday = query({
  args: { dateKey: v.string() },
  handler: async (ctx, { dateKey }): Promise<Doc<"inspirations"> | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const rows = await ctx.db
      .query("inspirations")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("dateKey", dateKey),
      )
      .collect();
    return rows.find((r) => r.kind === "daily") ?? null;
  },
});

/** Newest first: daily + boosts, for the history list. */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }): Promise<Doc<"inspirations">[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    return await ctx.db
      .query("inspirations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(Math.min(Math.max(limit ?? 30, 1), 60));
  },
});

/** Consecutive days (ending today, or yesterday if today isn't opened yet) the user showed up. */
export const getStreak = query({
  args: { dateKey: v.string() },
  handler: async (ctx, { dateKey }): Promise<number> => {
    const user = await getCurrentUser(ctx);
    if (!user) return 0;
    const rows = await ctx.db
      .query("inspirations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(400);
    const days = new Set(
      rows.filter((r) => r.kind === "daily").map((r) => r.dateKey),
    );
    let cursor = days.has(dateKey) ? dateKey : previousKey(dateKey);
    let streak = 0;
    while (days.has(cursor)) {
      streak++;
      cursor = previousKey(cursor);
    }
    return streak;
  },
});

// ───────────────────────── mutations ─────────────────────────

/** Idempotent: creates today's daily row (once) and schedules the AI. Safe to call on every page load. */
export const ensureToday = mutation({
  args: { dateKey: v.string() },
  handler: async (ctx, { dateKey }): Promise<Id<"inspirations">> => {
    const user = await requireUser(ctx);
    assertDateKey(dateKey);
    const now = Date.now();
    const rows = await ctx.db
      .query("inspirations")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("dateKey", dateKey),
      )
      .collect();
    const existing = rows.find((r) => r.kind === "daily");
    if (existing) {
      // Recover a run that died mid-stream. "failed" waits for an explicit retry.
      if (
        existing.status === "generating" &&
        now - existing.createdAt > STUCK_MS
      ) {
        await ctx.db.patch(existing._id, {
          createdAt: now,
          message: undefined,
        });
        await ctx.scheduler.runAfter(0, internal.inspirationsAi.generate, {
          inspirationId: existing._id,
        });
      }
      return existing._id;
    }
    const id = await ctx.db.insert("inspirations", {
      userId: user._id,
      dateKey,
      kind: "daily",
      status: "generating",
      saved: false,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.inspirationsAi.generate, {
      inspirationId: id,
    });
    return id;
  },
});

/** "I need a boost": a message written for how the user feels right now. */
export const requestBoost = mutation({
  args: {
    dateKey: v.string(),
    mood: moodValidator,
    note: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { dateKey, mood, note },
  ): Promise<Id<"inspirations">> => {
    const user = await requireUser(ctx);
    assertDateKey(dateKey);
    const cleanNote = note?.trim() ?? "";
    if (cleanNote.length > MAX_NOTE_CHARS) {
      throw new Error(`Keep it under ${MAX_NOTE_CHARS} characters.`);
    }
    const today = await ctx.db
      .query("inspirations")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("dateKey", dateKey),
      )
      .collect();
    if (today.filter((r) => r.kind === "boost").length >= MAX_BOOSTS_PER_DAY) {
      throw new Error(
        "That's plenty of boosts for today. Come back tomorrow 💪",
      );
    }
    const id = await ctx.db.insert("inspirations", {
      userId: user._id,
      dateKey,
      kind: "boost",
      mood,
      ...(cleanNote ? { note: cleanNote } : {}),
      status: "generating",
      saved: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.inspirationsAi.generate, {
      inspirationId: id,
    });
    return id;
  },
});

/** Retry a failed (or stuck) generation. */
export const retry = mutation({
  args: { inspirationId: v.id("inspirations") },
  handler: async (ctx, { inspirationId }): Promise<void> => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(inspirationId);
    if (!row || row.userId !== user._id) throw new Error("Not found.");
    const now = Date.now();
    const stuck = row.status === "generating" && now - row.createdAt > STUCK_MS;
    if (row.status !== "failed" && !stuck) return;
    await ctx.db.patch(inspirationId, {
      status: "generating",
      message: undefined,
      mantra: undefined,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.inspirationsAi.generate, {
      inspirationId,
    });
  },
});

export const toggleSaved = mutation({
  args: { inspirationId: v.id("inspirations") },
  handler: async (ctx, { inspirationId }): Promise<void> => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(inspirationId);
    if (!row || row.userId !== user._id) throw new Error("Not found.");
    await ctx.db.patch(inspirationId, { saved: !row.saved });
  },
});

// ───────────────────────── internal (called only from inspirationsAi.ts) ─────────────────────────

export const getContext = internalQuery({
  args: { inspirationId: v.id("inspirations") },
  handler: async (
    ctx,
    { inspirationId },
  ): Promise<{
    inspiration: Doc<"inspirations">;
    profile: Doc<"profiles"> | null;
    plan: Doc<"plans"> | null;
    lastCheckIn: Doc<"checkIns"> | null;
    recentMessages: string[];
    streak: number;
  } | null> => {
    const inspiration = await ctx.db.get(inspirationId);
    if (!inspiration) return null;
    const userId = inspiration.userId;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    const checkIns = plan
      ? await ctx.db
          .query("checkIns")
          .withIndex("by_plan", (q) => q.eq("planId", plan._id))
          .collect()
      : [];
    const lastCheckIn = checkIns.sort((a, b) => b.month - a.month)[0] ?? null;
    const recent = await ctx.db
      .query("inspirations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(30);
    const recentMessages = recent
      .filter(
        (r) => r._id !== inspirationId && r.status === "ready" && r.message,
      )
      .slice(0, 6)
      .map((r) => (r.message ?? "").slice(0, 90));
    const days = new Set(
      recent.filter((r) => r.kind === "daily").map((r) => r.dateKey),
    );
    let cursor = inspiration.dateKey;
    let streak = 0;
    while (days.has(cursor)) {
      streak++;
      cursor = previousKey(cursor);
    }
    return {
      inspiration,
      profile,
      plan: plan?.status === "ready" ? plan : null,
      lastCheckIn,
      recentMessages,
      streak,
    };
  },
});

export const appendChunk = internalMutation({
  args: { inspirationId: v.id("inspirations"), textSoFar: v.string() },
  handler: async (ctx, { inspirationId, textSoFar }): Promise<void> => {
    await ctx.db.patch(inspirationId, { message: textSoFar });
  },
});

export const finish = internalMutation({
  args: {
    inspirationId: v.id("inspirations"),
    message: v.string(),
    mantra: v.optional(v.string()),
    planMonth: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { inspirationId, message, mantra, planMonth },
  ): Promise<void> => {
    await ctx.db.patch(inspirationId, {
      status: "ready",
      message,
      mantra,
      planMonth,
    });
  },
});

/** Stores a safe fallback message AND marks failed, so the UI can show text + a Retry button. */
export const fail = internalMutation({
  args: { inspirationId: v.id("inspirations"), fallback: v.string() },
  handler: async (ctx, { inspirationId, fallback }): Promise<void> => {
    await ctx.db.patch(inspirationId, { status: "failed", message: fallback });
  },
});
