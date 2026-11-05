// convex/mealPlans.ts
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import { mealWeekValidator } from "./lib/validators";
import { MEAL_PLAN_WEEKS, currentMonth } from "./lib/schedule";

const STUCK_MS = 10 * 60_000; // no new week for this long = the run died
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PLANS_PER_DAY = 3; // protects the free model + stops spam

async function latestReadyPlan(
  ctx: MutationCtx,
  userId: Id<"users">,
): Promise<Doc<"plans"> | null> {
  const plan = await ctx.db
    .query("plans")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .first();
  return plan && plan.status === "ready" ? plan : null;
}

/** Creates a "generating" meal plan and schedules week 1 (each week schedules the next). */
async function startMealPlan(
  ctx: MutationCtx,
  userId: Id<"users">,
  plan: Doc<"plans">,
): Promise<Id<"mealPlans">> {
  const now = Date.now();
  const id = await ctx.db.insert("mealPlans", {
    userId,
    planId: plan._id,
    planMonth: currentMonth(plan.startedAt, now),
    status: "generating",
    createdAt: now,
    updatedAt: now,
  });
  await ctx.scheduler.runAfter(0, internal.mealPlansAi.generateNextWeek, {
    mealPlanId: id,
  });
  return id;
}

// ───────────────────────── queries ─────────────────────────

/** Latest meal plan for the signed-in user (generating, ready or failed). */
export const getActive = query({
  args: {},
  handler: async (ctx): Promise<Doc<"mealPlans"> | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

// ───────────────────────── mutations ─────────────────────────

/**
 * Idempotent, safe to call on every page load. Creates the first meal plan for the
 * user's plan, and restarts a run that died mid-way. A "failed" plan waits for an
 * explicit retry.
 */
export const ensureForPlan = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"mealPlans"> | null> => {
    const user = await requireUser(ctx);
    const plan = await latestReadyPlan(ctx, user._id);
    if (!plan) return null;

    const latest = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    if (latest && latest.planId === plan._id) {
      const now = Date.now();
      if (latest.status === "generating" && now - latest.updatedAt > STUCK_MS) {
        await ctx.db.patch(latest._id, { updatedAt: now });
        await ctx.scheduler.runAfter(0, internal.mealPlansAi.generateNextWeek, {
          mealPlanId: latest._id,
        });
      }
      return latest._id;
    }
    return await startMealPlan(ctx, user._id, plan);
  },
});

/** "Write me a new month": a fresh plan for the current month (avoids repeating old meals). */
export const regenerate = mutation({
  args: {},
  handler: async (ctx): Promise<Id<"mealPlans">> => {
    const user = await requireUser(ctx);
    const plan = await latestReadyPlan(ctx, user._id);
    if (!plan) {
      throw new Error(
        "Your plan needs to be ready before we can write your meal plan.",
      );
    }
    const now = Date.now();
    const recent = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_PLANS_PER_DAY + 1);
    const latest = recent[0];
    // Don't double-fire while one is being written.
    if (latest?.status === "generating" && now - latest.updatedAt < STUCK_MS) {
      return latest._id;
    }
    if (
      recent.filter((r) => now - r.createdAt < DAY_MS).length >=
      MAX_PLANS_PER_DAY
    ) {
      throw new Error(
        "That's plenty of new meal plans for today. Come back tomorrow 🥗",
      );
    }
    return await startMealPlan(ctx, user._id, plan);
  },
});

/** Retry a failed (or stuck) plan. Weeks that already finished are kept. */
export const retry = mutation({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, { mealPlanId }): Promise<void> => {
    const user = await requireUser(ctx);
    const row = await ctx.db.get(mealPlanId);
    if (!row || row.userId !== user._id) throw new Error("Not found.");
    const now = Date.now();
    const stuck = row.status === "generating" && now - row.updatedAt > STUCK_MS;
    if (row.status !== "failed" && !stuck) return;
    await ctx.db.patch(mealPlanId, {
      status: "generating",
      errorMessage: undefined,
      updatedAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.mealPlansAi.generateNextWeek, {
      mealPlanId,
    });
  },
});

// ───────────────────────── internal (called only from mealPlansAi.ts) ─────────────────────────

export const getContext = internalQuery({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (
    ctx,
    { mealPlanId },
  ): Promise<{
    mealPlan: Doc<"mealPlans">;
    plan: Doc<"plans">;
    profile: Doc<"profiles">;
    previousMeals: string[];
  } | null> => {
    const mealPlan = await ctx.db.get(mealPlanId);
    if (!mealPlan) return null;
    const plan = await ctx.db.get(mealPlan.planId);
    if (!plan) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", mealPlan.userId))
      .first();
    if (!profile) return null;

    // Meal names from the last finished plan, so "write me a new month" feels new.
    const recent = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", mealPlan.userId))
      .order("desc")
      .take(3);
    const previousMeals = recent
      .filter((r) => r._id !== mealPlanId && r.status === "ready")
      .flatMap((r) =>
        (r.weeks ?? []).flatMap((w) =>
          w.days.flatMap((d) => [
            d.breakfast.name,
            d.lunch.name,
            d.dinner.name,
          ]),
        ),
      )
      .slice(0, 30);
    return { mealPlan, plan, profile, previousMeals };
  },
});

/**
 * Saves one finished week, then either schedules the next week or marks the plan ready.
 * Ignores duplicates (a week that was already saved), so a double-run can't corrupt data.
 */
export const appendWeek = internalMutation({
  args: { mealPlanId: v.id("mealPlans"), week: mealWeekValidator },
  handler: async (ctx, { mealPlanId, week }): Promise<void> => {
    const row = await ctx.db.get(mealPlanId);
    if (!row || row.status !== "generating") return;
    const weeks = row.weeks ?? [];
    if (weeks.length !== week.week - 1) return; // already saved / out of order

    const next = [...weeks, week];
    const done = next.length >= MEAL_PLAN_WEEKS;
    await ctx.db.patch(mealPlanId, {
      weeks: next,
      status: done ? "ready" : "generating",
      errorMessage: undefined,
      updatedAt: Date.now(),
    });
    if (!done) {
      await ctx.scheduler.runAfter(0, internal.mealPlansAi.generateNextWeek, {
        mealPlanId,
      });
    }
  },
});

export const fail = internalMutation({
  args: { mealPlanId: v.id("mealPlans"), errorMessage: v.string() },
  handler: async (ctx, { mealPlanId, errorMessage }): Promise<void> => {
    await ctx.db.patch(mealPlanId, {
      status: "failed",
      errorMessage,
      updatedAt: Date.now(),
    });
  },
});
