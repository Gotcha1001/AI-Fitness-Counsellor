// convex/profiles.ts
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser } from "./lib/auth";
import { validateProfile } from "./lib/nutrition";
import { profileInputValidator } from "./lib/validators";

export const getMine = query({
  args: {},
  handler: async (ctx): Promise<Doc<"profiles"> | null> => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
  },
});

export const upsert = mutation({
  args: { input: profileInputValidator },
  handler: async (ctx, { input }): Promise<Id<"profiles">> => {
    const user = await requireUser(ctx);
    validateProfile(input);
    const now = Date.now();

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...input, updatedAt: now });
      return existing._id;
    }
    return await ctx.db.insert("profiles", {
      ...input,
      userId: user._id,
      startWeightKg: input.currentWeightKg,
      createdAt: now,
      updatedAt: now,
    });
  },
});
