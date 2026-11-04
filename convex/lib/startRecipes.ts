// convex/lib/startRecipes.ts — shared by plans.finishPlan and recipes.ts.
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/** Creates a "generating" recipe set for this plan and schedules the AI action. */
export async function startRecipeSet(
  ctx: MutationCtx,
  userId: Id<"users">,
  planId: Id<"plans">,
): Promise<Id<"recipeSets">> {
  const id = await ctx.db.insert("recipeSets", {
    userId,
    planId,
    status: "generating",
    progressChars: 0,
    createdAt: Date.now(),
  });
  await ctx.scheduler.runAfter(0, internal.recipesAi.generate, {
    recipeSetId: id,
  });
  return id;
}
