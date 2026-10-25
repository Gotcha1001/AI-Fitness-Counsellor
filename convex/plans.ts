// convex/plans.ts
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
import { planContentValidator } from "./lib/validators";

/** Latest plan for the signed-in user (generating, ready or failed). */
export const getActive = query({
  args: {},
  handler: async (ctx): Promise<Doc<"plans"> | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

/** Creates a "generating" plan row and schedules the AI action. */
export const requestPlan = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"plans">> => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (!profile)
      throw new Error("Finish onboarding before generating a plan.");

    const latest = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
    // Don't double-fire; allow retry if a run got stuck for > 5 minutes.
    if (
      latest?.status === "generating" &&
      Date.now() - latest.createdAt < 5 * 60_000
    ) {
      return latest._id;
    }

    const now = Date.now();
    const planId = await ctx.db.insert("plans", {
      userId: user._id,
      status: "generating",
      progressChars: 0,
      goal: profile.goal,
      startWeightKg: profile.currentWeightKg,
      startedAt: now,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.coach.generatePlan, { planId });
    return planId;
  },
});

// ---------- internal (called only from convex/coach.ts) ----------

export const getPlanContext = internalQuery({
  args: { planId: v.id("plans") },
  handler: async (
    ctx,
    { planId },
  ): Promise<{ plan: Doc<"plans">; profile: Doc<"profiles"> } | null> => {
    const plan = await ctx.db.get(planId);
    if (!plan) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", plan.userId))
      .first();
    return profile ? { plan, profile } : null;
  },
});

export const setProgress = internalMutation({
  args: { planId: v.id("plans"), progressChars: v.number() },
  handler: async (ctx, { planId, progressChars }): Promise<void> => {
    await ctx.db.patch(planId, { progressChars });
  },
});

export const finishPlan = internalMutation({
  args: { planId: v.id("plans"), content: planContentValidator },
  handler: async (ctx, { planId, content }): Promise<void> => {
    await ctx.db.patch(planId, {
      status: "ready",
      content,
      errorMessage: undefined,
    });
  },
});

export const failPlan = internalMutation({
  args: { planId: v.id("plans"), errorMessage: v.string() },
  handler: async (ctx, { planId, errorMessage }): Promise<void> => {
    await ctx.db.patch(planId, { status: "failed", errorMessage });
  },
});
