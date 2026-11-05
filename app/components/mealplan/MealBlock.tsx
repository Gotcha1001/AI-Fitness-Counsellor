// app/components/mealplan/MealBlock.tsx
"use client";

import { Flame } from "lucide-react";
import type { PlannedMeal } from "@/convex/lib/validators";
import { Frame, HudLabel } from "@/app/components/Cyber";
import { SLOT_LABEL, type MealSlot } from "@/lib/mealPlan";

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

/** One meal: every food with its exact portion, then calories and macros. */
export function MealBlock({
  slot,
  meal,
}: {
  slot: MealSlot;
  meal: PlannedMeal;
}) {
  return (
    <Frame className="h-full">
      <section
        aria-label={SLOT_LABEL[slot]}
        className="flex h-full flex-col gap-4 p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <HudLabel>{`// ${SLOT_LABEL[slot].toUpperCase()}`}</HudLabel>
            <h3 className="mt-1.5 text-lg font-black uppercase leading-tight tracking-tight text-[color:var(--cp-fg)]">
              {meal.name}
            </h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-xs text-[color:var(--c1)]">
            <Flame size={13} aria-hidden /> {meal.calories} kcal
          </span>
        </div>

        <ul className="divide-y divide-[color:var(--cp-line)] border-y border-[color:var(--cp-line)]">
          {meal.items.map((item, i) => (
            <li
              key={`${item.food}-${i}`}
              className="flex items-baseline justify-between gap-4 py-2 text-sm"
            >
              <span className="text-[color:var(--cp-fg)]">{item.food}</span>
              <span className="shrink-0 text-right font-mono text-xs font-bold text-[color:var(--c1)]">
                {item.portion}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex gap-2">
          <Macro label="Protein" value={meal.proteinG} />
          <Macro label="Carbs" value={meal.carbsG} />
          <Macro label="Fat" value={meal.fatG} />
        </div>
      </section>
    </Frame>
  );
}
