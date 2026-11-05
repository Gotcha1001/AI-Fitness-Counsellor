// app/components/mealplan/DayView.tsx
"use client";

import type { MealDay } from "@/convex/lib/validators";
import { Frame, HudLabel } from "@/app/components/Cyber";
import { dayMacros, mealsForDay } from "@/lib/mealPlan";
import { MealBlock } from "./MealBlock";
import { WorkoutCard } from "./WorkoutCard";

export interface DayTargets {
  calories: number;
  proteinG: number;
}

interface Props {
  day: MealDay;
  targets: DayTargets | null;
  isToday: boolean;
}

/** One day: totals vs target, every meal with portions, then the workout. */
export function DayView({ day, targets, isToday }: Props) {
  const totals = dayMacros(day);
  const pct = targets
    ? Math.min(100, Math.round((day.totalCalories / targets.calories) * 100))
    : 0;

  return (
    <div className="space-y-5">
      <Frame>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <HudLabel>{isToday ? "// TODAY" : "// DAY TOTAL"}</HudLabel>
              <h2 className="mt-1.5 text-2xl font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
                {day.day}
              </h2>
            </div>
            <p className="font-mono text-sm text-[color:var(--cp-muted)]">
              <span className="text-lg font-black text-[color:var(--c1)]">
                {day.totalCalories}
              </span>
              {targets ? ` / ${targets.calories}` : ""} kcal
            </p>
          </div>
          {targets && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Calories compared with your daily target"
              className="h-1.5 w-full bg-[color:var(--cp-tint)]"
            >
              <div
                className="h-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,var(--c1),var(--c2))",
                }}
              />
            </div>
          )}
          <p className="font-mono text-xs text-[color:var(--cp-faint)]">
            {totals.proteinG} g protein · {totals.carbsG} g carbs ·{" "}
            {totals.fatG} g fat
            {targets ? ` (target ${targets.proteinG} g protein)` : ""}
          </p>
        </div>
      </Frame>

      <div className="grid gap-5 md:grid-cols-2">
        {mealsForDay(day).map(({ slot, meal }) => (
          <MealBlock key={slot} slot={slot} meal={meal} />
        ))}
      </div>

      <WorkoutCard workout={day.workout} />
    </div>
  );
}
