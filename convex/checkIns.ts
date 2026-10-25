// convex/checkIns.ts
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
import { checkInWindow } from "./lib/schedule";

export const listForPlan = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, { planId }): Promise<Doc<"checkIns">[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const rows = await ctx.db
      .query("checkIns")
      .withIndex("by_plan", (q) => q.eq("planId", planId))
      .collect();
    return rows
      .filter((r) => r.userId === user._id)
      .sort((a, b) => a.month - b.month);
  },
});

export const submit = mutation({
  args: {
    planId: v.id("plans"),
    weightKg: v.number(),
    waistCm: v.optional(v.number()),
    energy: v.number(),
    adherence: v.number(),
    notes: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"checkIns">> => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) throw new Error("Plan not found.");
    if (plan.status !== "ready") throw new Error("Your plan isn't ready yet.");

    const isScore = (n: number) => Number.isInteger(n) && n >= 1 && n <= 5;
    if (!(args.weightKg >= 20 && args.weightKg <= 400))
      throw new Error("Weight looks off.");
    if (
      args.waistCm !== undefined &&
      !(args.waistCm >= 30 && args.waistCm <= 250)
    ) {
      throw new Error("Waist measurement looks off.");
    }
    if (!isScore(args.energy) || !isScore(args.adherence))
      throw new Error("Scores must be 1–5.");
    if (args.notes.length > 1000)
      throw new Error("Notes must be under 1000 characters.");

    const existing = await ctx.db
      .query("checkIns")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .collect();
    const slot = checkInWindow(plan.startedAt, existing.length, Date.now());
    if (slot.month === null)
      throw new Error("You've completed all 6 check-ins. 🎉");
    if (!slot.open) throw new Error("Your next check-in isn't open yet.");

    const sorted = existing.sort((a, b) => a.month - b.month);
    const previousKg =
      sorted.length > 0
        ? sorted[sorted.length - 1].weightKg
        : plan.startWeightKg;

    const checkInId = await ctx.db.insert("checkIns", {
      userId: user._id,
      planId: args.planId,
      month: slot.month,
      weightKg: args.weightKg,
      ...(args.waistCm !== undefined ? { waistCm: args.waistCm } : {}),
      energy: args.energy,
      adherence: args.adherence,
      notes: args.notes.trim(),
      changeFromPreviousKg: Math.round((args.weightKg - previousKg) * 10) / 10,
      feedbackStatus: "generating",
      createdAt: Date.now(),
    });

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
    if (profile)
      await ctx.db.patch(profile._id, {
        currentWeightKg: args.weightKg,
        updatedAt: Date.now(),
      });

    await ctx.scheduler.runAfter(0, internal.coach.generateCheckInFeedback, {
      checkInId,
    });
    return checkInId;
  },
});

// ---------- internal ----------

export const getCheckInContext = internalQuery({
  args: { checkInId: v.id("checkIns") },
  handler: async (
    ctx,
    { checkInId },
  ): Promise<{
    checkIn: Doc<"checkIns">;
    plan: Doc<"plans">;
    profile: Doc<"profiles">;
  } | null> => {
    const checkIn = await ctx.db.get(checkInId);
    if (!checkIn) return null;
    const plan = await ctx.db.get(checkIn.planId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", checkIn.userId))
      .first();
    return plan && profile ? { checkIn, plan, profile } : null;
  },
});

export const appendFeedbackChunk = internalMutation({
  args: { checkInId: v.id("checkIns"), textSoFar: v.string() },
  handler: async (ctx, { checkInId, textSoFar }): Promise<void> => {
    await ctx.db.patch(checkInId, { feedback: textSoFar });
  },
});

export const finishFeedback = internalMutation({
  args: { checkInId: v.id("checkIns"), text: v.string(), ok: v.boolean() },
  handler: async (ctx, { checkInId, text, ok }): Promise<void> => {
    await ctx.db.patch(checkInId, {
      feedback: text,
      feedbackStatus: ok ? "ready" : "failed",
    });
  },
});
