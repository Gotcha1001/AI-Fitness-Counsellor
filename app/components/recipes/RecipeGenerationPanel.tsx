// app/components/recipes/RecipeGeneratingPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Check, ChefHat } from "lucide-react";
import { Frame, HudLabel } from "@/app/components/Cyber";

const STEPS = [
  "Reading your plan and daily targets",
  "Picking ingredients from your food list",
  "Balancing calories and macros per serving",
  "Writing quick, clear steps",
] as const;

// A step lights up once EITHER enough text has streamed in (progressChars from
// Convex) OR enough seconds have passed. Tweak if your sets come out longer/shorter.
const STEP_CHARS = [0, 600, 1800, 3200];
const STEP_SECONDS = [0, 6, 14, 24];
const EXPECTED_CHARS = 4500; // roughly a full set of 4 recipes
const EXPECTED_SECONDS = 40;

interface Props {
  progressChars: number;
}

/**
 * Inline "your coach is cooking" card. Mount it with `key={recipeSet._id}` so the
 * timer restarts whenever a new set starts generating.
 */
export function RecipeGeneratingPanel({ progressChars }: Props) {
  const reduce = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  let active = 0;
  STEPS.forEach((_, i) => {
    if (progressChars >= STEP_CHARS[i] || elapsed >= STEP_SECONDS[i])
      active = i;
  });

  const pct = Math.round(
    Math.min(
      95,
      Math.max(progressChars / EXPECTED_CHARS, elapsed / EXPECTED_SECONDS) *
        100,
    ),
  );

  return (
    <Frame className="cp-glow">
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden px-6 py-10 sm:px-10"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, color-mix(in oklab,var(--c1) 30%,transparent), transparent 60%)",
          }}
        />
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center border border-[color:var(--c1)]/50 bg-[color:var(--c1)]/10 text-[color:var(--c1)]"
              style={
                reduce ? undefined : { animation: "cp-blink 1.4s infinite" }
              }
            >
              <ChefHat size={22} />
            </span>
            <div>
              <HudLabel>{"// COACH IS COOKING"}</HudLabel>
              <p className="mt-1 text-lg font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
                Writing recipes for your plan…
              </p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {STEPS.map((label, i) => {
              const done = i < active;
              const current = i === active;
              return (
                <li
                  key={label}
                  className={`flex items-center gap-3 text-sm ${
                    done || current
                      ? "text-[color:var(--cp-fg)]"
                      : "text-[color:var(--cp-faint)]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[10px] ${
                      done
                        ? "border-[color:var(--c1)] bg-[color:var(--c1)]/20 text-[color:var(--c1)]"
                        : current
                          ? "border-[color:var(--c2)] text-[color:var(--c2)]"
                          : "border-[color:var(--cp-line)]"
                    }`}
                    style={
                      current && !reduce
                        ? { animation: "cp-blink 1.4s infinite" }
                        : undefined
                    }
                  >
                    {done ? <Check size={12} /> : i + 1}
                  </span>
                  {label}
                </li>
              );
            })}
          </ul>

          <div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Recipe generation progress"
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
              Usually under a minute. You can leave this page and come back.
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}
