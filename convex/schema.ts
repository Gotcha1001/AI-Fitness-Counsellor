// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  goalValidator,
  inspirationKindValidator,
  mealWeekValidator,
  moodValidator,
  planContentValidator,
  profileFields,
  recipeValidator,
  statusValidator,
} from "./lib/validators";

export default defineSchema({
  // Already in your starter — unchanged.
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
    // Look & feel chosen on the Appearance page (accent, rain, text size).
    appearance: v.optional(
      v.object({
        accent: v.string(),
        rainMode: v.string(),
        rainDensity: v.number(),
        rainSpeed: v.number(),
        rainSize: v.number(),
        rainOpacity: v.number(),
        glow: v.boolean(),
        uiSize: v.string(),
      }),
    ),
  }).index("by_clerk_id", ["clerkId"]),

  // One profile per user: body stats, goal, training + eating habits.
  profiles: defineTable({
    userId: v.id("users"),
    startWeightKg: v.number(), // frozen at first onboarding, used for total progress
    ...profileFields,
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // The AI-generated 6-month plan. Latest row per user is the active one.
  plans: defineTable({
    userId: v.id("users"),
    status: statusValidator,
    progressChars: v.number(), // streamed length, drives the "coach is writing" UI
    goal: goalValidator,
    startWeightKg: v.number(),
    startedAt: v.number(), // month boundaries / check-in due dates count from here
    content: v.optional(planContentValidator),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  // Monthly check-ins (max 6 per plan) with streamed AI coach feedback.
  checkIns: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    month: v.number(), // 1..6
    weightKg: v.number(),
    waistCm: v.optional(v.number()),
    energy: v.number(), // 1..5
    adherence: v.number(), // 1..5
    notes: v.string(),
    changeFromPreviousKg: v.number(),
    feedback: v.optional(v.string()),
    feedbackStatus: statusValidator,
    createdAt: v.number(),
  })
    .index("by_plan", ["planId"])
    .index("by_user", ["userId"]),
  // 1) Add to the import list in convex/schema.ts:
  //    import { inspirationKindValidator, moodValidator, ... } from "./lib/validators";
  //
  // 2) Add this table inside defineSchema({ ... }) after `checkIns`:

  // AI encouragement: one "daily" row per user per local day + on-demand "boost" rows.
  inspirations: defineTable({
    userId: v.id("users"),
    dateKey: v.string(), // user's LOCAL date, "YYYY-MM-DD"
    kind: inspirationKindValidator,
    mood: v.optional(moodValidator), // boosts only
    note: v.optional(v.string()), // boosts only, what they typed (max 300 chars)
    status: statusValidator, // generating | ready | failed
    message: v.optional(v.string()), // streamed in while generating
    mantra: v.optional(v.string()), // short one-liner to remember
    planMonth: v.optional(v.number()), // 1..6 at time of writing
    saved: v.boolean(), // user starred it
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "dateKey"]),
  // AI-written recipes for a plan. Latest row per user is the active one.
  recipeSets: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    status: statusValidator, // generating | ready | failed
    progressChars: v.number(), // streamed length, drives the "coach is cooking" UI
    recipes: v.optional(v.array(recipeValidator)),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_plan", ["planId"]),

  // AI-written meal + workout plan for ONE month (4 weeks), generated a week at a time.
  // Latest row per user is the active one.
  mealPlans: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    planMonth: v.number(), // 1..6: which month of the 6-month plan this covers
    status: statusValidator, // generating | ready | failed
    weeks: v.optional(v.array(mealWeekValidator)), // grows 1 -> 4 while generating
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(), // bumped after every finished week (stuck detection)
  })
    .index("by_user", ["userId"])
    .index("by_plan", ["planId"]),
});
