// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  goalValidator,
  planContentValidator,
  profileFields,
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
});
