// app/components/recipes/RecipeCard.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Clock, Flame, Users } from "lucide-react";
import type { Recipe } from "@/convex/lib/validators";
import { Frame, HudLabel } from "@/app/components/Cyber";

const MEAL_LABEL: Record<Recipe["mealType"], string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 border border-[color:var(--cp-line)] bg-[color:var(--cp-tint)] px-2 py-1.5 text-center">
      <p className="font-mono text-sm font-bold text-[color:var(--cp-fg)]">
        {value} g
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--cp-faint)]">
        {label}
      </p>
    </div>
  );
}

export function RecipeCard({
  recipe,
  index,
}: {
  recipe: Recipe;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const totalMin = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="h-full"
    >
      <Frame className="h-full">
        <div className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c2)]">
              {MEAL_LABEL[recipe.mealType]}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[color:var(--c1)]">
              <Flame size={13} /> {recipe.caloriesPerServing} kcal
            </span>
          </div>

          <div>
            <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-[color:var(--cp-fg)]">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--cp-muted)]">
                {recipe.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[color:var(--cp-faint)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} /> {totalMin} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={13} /> {recipe.servings} serving
              {recipe.servings === 1 ? "" : "s"}
            </span>
          </div>

          <div className="flex gap-2">
            <Macro label="Protein" value={recipe.proteinG} />
            <Macro label="Carbs" value={recipe.carbsG} />
            <Macro label="Fat" value={recipe.fatG} />
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-auto inline-flex items-center justify-between gap-2 border border-[color:var(--c2)]/50 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c2)] transition-colors hover:bg-[color:var(--c2)]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[color:var(--c1)]"
          >
            {open ? "Hide recipe" : "Show ingredients & steps"}
            <ChevronDown
              size={15}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="space-y-5 border-t border-[color:var(--cp-line)] pt-4">
              <div>
                <HudLabel>{"// INGREDIENTS"}</HudLabel>
                <ul className="mt-2 space-y-1.5 text-sm text-[color:var(--cp-fg)]">
                  {recipe.ingredients.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: "var(--c1)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <HudLabel>{"// STEPS"}</HudLabel>
                <ol className="mt-2 space-y-2 text-sm text-[color:var(--cp-fg)]">
                  {recipe.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-mono text-xs font-bold text-[color:var(--c1)]">
                        {i + 1}.
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {recipe.tip && (
                <div
                  className="border-l-2 bg-[color:var(--c1)]/5 p-3 text-sm text-[color:var(--cp-fg)]"
                  style={{ borderColor: "var(--c1)" }}
                >
                  {recipe.tip}
                </div>
              )}
            </div>
          )}
        </div>
      </Frame>
    </motion.div>
  );
}
