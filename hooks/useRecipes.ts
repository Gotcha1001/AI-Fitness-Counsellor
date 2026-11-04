// hooks/useRecipes.ts
"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface RecipesData {
  loading: boolean;
  recipeSet: Doc<"recipeSets"> | null;
}

/** `planReady`: pass true once the user's plan has finished generating. */
export function useRecipes(planReady: boolean): RecipesData {
  const recipeSet = useQuery(api.recipes.getActive);
  const ensure = useMutation(api.recipes.ensureForPlan);
  const started = useRef(false);

  // Make sure a set exists for the current plan (idempotent on the server).
  useEffect(() => {
    if (!planReady || recipeSet === undefined || started.current) return;
    started.current = true;
    ensure({}).catch((e: unknown) =>
      console.error("[recipes] ensureForPlan failed", e),
    );
  }, [planReady, recipeSet, ensure]);

  return { loading: recipeSet === undefined, recipeSet: recipeSet ?? null };
}
