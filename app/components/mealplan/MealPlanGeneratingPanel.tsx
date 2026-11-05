// app/components/mealplan/MealPlanGeneratingPanel.tsx
"use client";

import { useReducedMotion } from "framer-motion";
import { Check, Salad } from "lucide-react";
import { Frame, HudLabel } from "@/app/components/Cyber";
import { MEAL_PLAN_WEEKS } from "@/convex/lib/schedule";

interface Props {
  /** Weeks already saved (0..MEAL_PLAN_WEEKS). Progress is real: one step per saved week. */
  weeksDone: number;
}

export function MealPlanGeneratingPanel({ weeksDone }: Props) {
  const reduce = useReducedMotion();
  const writing = Math.min(weeksDone + 1, MEAL_PLAN_WEEKS);
  const pct = Math.round(
    Math.min(95, ((weeksDone + 0.35) / MEAL_PLAN_WEEKS) * 100),
  );

  return (
    <Frame className="cp-glow">
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden px-6 py-8 sm:px-10"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab,var(--c1) 30%,transparent), transparent 60%)",
          }}
        />
        <div className="relative space-y-5">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center border border-[color:var(--c1)]/50 bg-[color:var(--c1)]/10 text-[color:var(--c1)]"
              style={
                reduce ? undefined : { animation: "cp-blink 1.4s infinite" }
              }
            >
              <Salad size={22} aria-hidden />
            </span>
            <div>
              <HudLabel>{"// COACH IS PLANNING"}</HudLabel>
              <p className="mt-1 text-lg font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
                {weeksDone >= MEAL_PLAN_WEEKS
                  ? "Finishing up…"
                  : `Writing week ${writing} of ${MEAL_PLAN_WEEKS}…`}
              </p>
            </div>
          </div>

          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: MEAL_PLAN_WEEKS }, (_, i) => {
              const done = i < weeksDone;
              const current = i === weeksDone;
              return (
                <li
                  key={i}
                  className={`flex items-center gap-2 border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] ${
                    done
                      ? "border-[color:var(--c1)] bg-[color:var(--c1)]/10 text-[color:var(--c1)]"
                      : current
                        ? "border-[color:var(--c2)] text-[color:var(--c2)]"
                        : "border-[color:var(--cp-line)] text-[color:var(--cp-faint)]"
                  }`}
                  style={
                    current && !reduce
                      ? { animation: "cp-blink 1.4s infinite" }
                      : undefined
                  }
                >
                  {done && <Check size={12} aria-hidden />}
                  Week {i + 1}
                </li>
              );
            })}
          </ol>

          <div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Meal plan progress"
              className="h-1.5 w-full bg-[color:var(--cp-tint)]"
            >
              <div
                className="h-full transition-[width] duration-700"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg,var(--c1),var(--c2))",
                }}
              />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--cp-faint)]">
              Each week takes about a minute. Finished weeks are saved, and you
              can leave this page and come back.
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}
