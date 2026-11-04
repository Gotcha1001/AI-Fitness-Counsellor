// convex/recipes.ts
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
import { recipeValidator } from "./lib/validators";
import { startRecipeSet } from "./lib/startRecipes";

const STUCK_MS = 5 * 60_000; // a "generating" row older than this is considered dead
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_SETS_PER_DAY = 5; // protects the free model + stops spam

// ───────────────────────── queries ─────────────────────────

/** Latest recipe set for the signed-in user (generating, ready or failed). */
export const getActive = query({
  args: {},
  handler: async (ctx): Promise<Doc<"recipeSets"> | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("recipeSets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

// ───────────────────────── mutations ─────────────────────────

/**
 * Idempotent, safe to call on every page load. Normally finishPlan already created the set;
 * this covers users who onboarded before recipes existed and recovers a run that died mid-way.
 * A "failed" set waits for an explicit retry.
 */
export const ensureForPlan = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"recipeSets"> | null> => {
    const user = await requireUser(ctx);
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (!plan || plan.status !== "ready") return null;

    const latest = await ctx.db
      .query("recipeSets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (latest && latest.planId === plan._id) {
      const now = Date.now();
      if (latest.status === "generating" && now - latest.createdAt > STUCK_MS) {
        await ctx.db.patch(latest._id, { createdAt: now, progressChars: 0 });
        await ctx.scheduler.runAfter(0, internal.recipesAi.generate, {
          recipeSetId: latest._id,
        });
      }
      return latest._id;
    }
    return await startRecipeSet(ctx, user._id, plan._id);
  },
});

/** "Give me new ideas": a fresh set for the current plan (the AI avoids repeating old titles). */
export const regenerate = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"recipeSets">> => {
    const user = await requireUser(ctx);
    const plan = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    if (!plan || plan.status !== "ready") {
      throw new Error(
        "Your plan needs to be ready before we can write recipes.",
      );
    }
    const now = Date.now();
    const recent = await ctx.db
      .query("recipeSets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_SETS_PER_DAY + 1);

    const latest = recent[0];
    // Don't double-fire while one is being written.
    if (latest?.status === "generating" && now - latest.createdAt < STUCK_MS) {
      return latest._id;
    }
    if (
      recent.filter((r) => now - r.createdAt < DAY_MS).length >=
      MAX_SETS_PER_DAY
    ) {
      throw new Error(
        "That's plenty of new recipes for today. Come back tomorrow 🥗",
      );
    }
    return await startRecipeSet(ctx, user._id, plan._id);
  },
});

/** Retry a failed (or stuck) generation. */
export const retry = mutation({
  args: { recipeSetId: v.id("recipeSets") },
  handler: async (ctx, { recipeSetId }): Promise<void> => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(recipeSetId);
    if (!row || row.userId !== user._id) throw new Error("Not found.");
    const now = Date.now();
    const stuck = row.status === "generating" && now - row.createdAt > STUCK_MS;
    if (row.status !== "failed" && !stuck) return;
    await ctx.db.patch(recipeSetId, {
      status: "generating",
      progressChars: 0,
      errorMessage: undefined,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.recipesAi.generate, {
      recipeSetId,
    });
  },
});

// ───────────────────────── internal (called only from recipesAi.ts) ─────────────────────────

export const getContext = internalQuery({
  args: { recipeSetId: v.id("recipeSets") },
  handler: async (
    ctx,
    { recipeSetId },
  ): Promise<{
    set: Doc<"recipeSets">;
    plan: Doc<"plans">;
    profile: Doc<"profiles">;
    previousTitles: string[];
  } | null> => {
    const set = await ctx.db.get(recipeSetId);
    if (!set) return null;
    const plan = await ctx.db.get(set.planId);
    if (!plan) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", set.userId))
      .first();
    if (!profile) return null;
    const recent = await ctx.db
      .query("recipeSets")
      .withIndex("by_user", (q) => q.eq("userId", set.userId))
      .order("desc")
      .take(4);
    const previousTitles = recent
      .filter((r) => r._id !== recipeSetId && r.status === "ready")
      .flatMap((r) => (r.recipes ?? []).map((x) => x.title))
      .slice(0, 12);
    return { set, plan, profile, previousTitles };
  },
});

export const setProgress = internalMutation({
  args: { recipeSetId: v.id("recipeSets"), progressChars: v.number() },
  handler: async (ctx, { recipeSetId, progressChars }): Promise<void> => {
    await ctx.db.patch(recipeSetId, { progressChars });
  },
});

export const finish = internalMutation({
  args: { recipeSetId: v.id("recipeSets"), recipes: v.array(recipeValidator) },
  handler: async (ctx, { recipeSetId, recipes }): Promise<void> => {
    await ctx.db.patch(recipeSetId, {
      status: "ready",
      recipes,
      errorMessage: undefined,
    });
  },
});

export const fail = internalMutation({
  args: { recipeSetId: v.id("recipeSets"), errorMessage: v.string() },
  handler: async (ctx, { recipeSetId, errorMessage }): Promise<void> => {
    await ctx.db.patch(recipeSetId, { status: "failed", errorMessage });
  },
});
