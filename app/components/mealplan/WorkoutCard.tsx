// app/components/mealplan/WorkoutCard.tsx
"use client";

import { Dumbbell, Moon } from "lucide-react";
import type { DayWorkout } from "@/convex/lib/validators";
import { Frame, HudLabel } from "@/app/components/Cyber";

export function WorkoutCard({ workout }: { workout: DayWorkout }) {
  const rest = workout.minutes <= 0;
  return (
    <Frame className={rest ? "" : "cp-glow-c"}>
      <section
        aria-label={rest ? "Rest day" : "Workout"}
        className="flex gap-4 p-5"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center border ${
            rest
              ? "border-[color:var(--cp-line)] text-[color:var(--cp-faint)]"
              : "border-[color:var(--c1)]/50 bg-[color:var(--c1)]/10 text-[color:var(--c1)]"
          }`}
        >
          {rest ? (
            <Moon size={20} aria-hidden />
          ) : (
            <Dumbbell size={20} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <HudLabel>{rest ? "// RECOVERY" : "// WORKOUT"}</HudLabel>
              <h3 className="mt-1.5 text-lg font-black uppercase leading-tight tracking-tight text-[color:var(--cp-fg)]">
                {workout.title}
              </h3>
            </div>
            {!rest && (
              <span className="font-mono text-xs text-[color:var(--c1)]">
                {workout.minutes} min
              </span>
            )}
          </div>
          {workout.details && (
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--cp-muted)]">
              {workout.details}
            </p>
          )}
        </div>
      </section>
    </Frame>
  );
}
