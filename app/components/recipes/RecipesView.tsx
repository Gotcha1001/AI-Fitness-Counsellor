// app/components/recipes/RecipesView.tsx
"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCw, Sparkles } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import type { MealType } from "@/convex/lib/validators";
import { Frame, HudLabel } from "@/app/components/Cyber";
import { RecipeCard } from "@/app/components/recipes/RecipeCard";
import { RecipeGeneratingPanel } from "./RecipeGenerationPanel";

type Filter = "all" | MealType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

interface Props {
  recipeSet: Doc<"recipeSets">;
  busy: boolean;
  onRegenerate: () => void;
  onRetry: (id: Doc<"recipeSets">["_id"]) => void;
}

export function RecipesView({ recipeSet, busy, onRegenerate, onRetry }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const recipes = useMemo(() => recipeSet.recipes ?? [], [recipeSet.recipes]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: recipes.length,
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };
    for (const r of recipes) c[r.mealType] += 1;
    return c;
  }, [recipes]);

  const visible =
    filter === "all" ? recipes : recipes.filter((r) => r.mealType === filter);

  if (recipeSet.status === "generating") {
    return (
      <RecipeGeneratingPanel
        key={recipeSet._id}
        progressChars={recipeSet.progressChars}
      />
    );
  }

  if (recipeSet.status === "failed") {
    return (
      <Frame>
        <div className="space-y-4 p-6 sm:p-8" role="alert">
          <HudLabel>{"// COULDN'T WRITE RECIPES"}</HudLabel>
          <p className="text-sm leading-relaxed text-[color:var(--cp-muted)]">
            {recipeSet.errorMessage ??
              "Your coach couldn't write recipes just now. Please try again."}
          </p>
          <button
            type="button"
            onClick={() => onRetry(recipeSet._id)}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-[color:var(--c2)]/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c2)] transition-colors hover:bg-[color:var(--c2)]/10 disabled:opacity-40"
          >
            <RotateCw size={13} /> {busy ? "Retrying…" : "Try again"}
          </button>
        </div>
      </Frame>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Filter recipes by meal"
      >
        {FILTERS.filter((f) => f.value === "all" || counts[f.value] > 0).map(
          (f) => (
            <button
              key={f.value}
              type="button"
              className="cp-tab"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label} · {counts[f.value]}
            </button>
          ),
        )}
      </div>

      {visible.length === 0 ? (
        <Frame>
          <p className="p-6 text-sm text-[color:var(--cp-muted)]">
            No recipes in this category yet.
          </p>
        </Frame>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {visible.map((recipe, i) => (
            <RecipeCard
              key={`${recipe.mealType}-${recipe.title}`}
              recipe={recipe}
              index={i}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-4 border-t border-[color:var(--cp-line)] pt-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="max-w-md text-xs leading-relaxed text-[color:var(--cp-faint)]">
          Written by AI from your plan, allergies and food list. Always
          double-check ingredients against your allergies. General guidance, not
          medical advice.
        </p>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-2 bg-[color:var(--c1)] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black transition-opacity disabled:opacity-40"
        >
          <Sparkles size={14} /> {busy ? "Starting…" : "Give me new ideas"}
        </button>
      </motion.div>
    </div>
  );
}
