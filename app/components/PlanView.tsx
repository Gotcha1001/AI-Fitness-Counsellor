// app/components/PlanView.tsx

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import type { PlanContent, UnitSystem } from "@/convex/lib/validators";
import { currentMonth } from "@/convex/lib/schedule";
import { formatWeight } from "@/lib/units";
import { Frame, HudLabel, SectionHead } from "@/app/components/Cyber";

interface PlanViewProps {
  plan: Doc<"plans">;
  unit: UnitSystem;
  onRetry: () => void;
  retrying: boolean;
}

function Pills({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  const color = tone === "good" ? "var(--c1)" : "var(--c3)";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="border px-3 py-1 font-mono text-[11px] uppercase tracking-wider"
          style={{
            color,
            borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
            background: `color-mix(in oklab, ${color} 10%, transparent)`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function Overview({
  content,
  startWeightKg,
  unit,
}: {
  content: PlanContent;
  startWeightKg: number;
  unit: UnitSystem;
}) {
  const goalKg = content.months[5].targetWeightKg;
  const stats: [string, string][] = [
    ["Calories", `${content.dailyCalories}`],
    ["Protein", `${content.proteinG}g`],
    ["Carbs", `${content.carbsG}g`],
    ["Fat", `${content.fatG}g`],
    [
      "6-mo target",
      `${formatWeight(startWeightKg, unit)} → ${formatWeight(goalKg, unit)}`,
    ],
  ];

  return (
    <div className="space-y-5">
      <Frame className="cp-glow">
        <div className="space-y-5 p-6">
          <HudLabel>{"// 01 · BRIEFING"}</HudLabel>
          <p className="text-sm leading-relaxed text-[color:var(--cp-muted)]">
            {content.summary}
          </p>
          <div className="grid grid-cols-2 gap-3 text-center md:grid-cols-5">
            {stats.map(([label, value]) => (
              <div
                key={label}
                className="border border-[color:var(--cp-line)] bg-[var(--cp-tint)] p-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--cp-faint)]">
                  {label}
                </p>
                <p className="mt-1 text-sm font-black text-[color:var(--c1)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Frame>

      <div className="grid gap-5 md:grid-cols-2">
        <Frame>
          <div className="space-y-4 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c1)]">
              ✅ Eat more of
            </p>
            <Pills items={content.foodsToEat} tone="good" />
          </div>
        </Frame>
        <Frame>
          <div className="space-y-4 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c3)]">
              🚫 Stay away from
            </p>
            <Pills items={content.foodsToAvoid} tone="bad" />
          </div>
        </Frame>
      </div>

      {content.dailyHabits.length > 0 && (
        <Frame>
          <div className="space-y-4 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c2)]">
              Daily habits
            </p>
            <ul className="space-y-2 text-sm text-[color:var(--cp-muted)]">
              {content.dailyHabits.map((h) => (
                <li key={h} className="flex gap-3">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-[color:var(--c1)]" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        </Frame>
      )}
    </div>
  );
}

export function PlanView({ plan, unit, onRetry, retrying }: PlanViewProps) {
  const [now] = useState(() => Date.now());
  const [selected, setSelected] = useState<number | null>(null);

  if (plan.status === "generating") {
    return (
      <Frame className="cp-glow">
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--c1)]" />
          <HudLabel>{"// COMPILING PLAN"}</HudLabel>
          <p className="font-bold text-[color:var(--cp-fg)]">
            Your coach is building your 6-month plan…
          </p>
          <p className="text-sm text-[color:var(--cp-muted)]">
            This usually takes under a minute.{" "}
            {plan.progressChars > 0 &&
              `Written so far: ${plan.progressChars.toLocaleString()} characters.`}
          </p>
        </div>
      </Frame>
    );
  }

  if (plan.status === "failed" || !plan.content) {
    return (
      <Frame>
        <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-[color:var(--c3)]">
            {"// ERROR · PLAN FAILED"}
          </p>
          <p className="font-bold text-[color:var(--cp-fg)]">
            We couldn&apos;t finish your plan
          </p>
          <p className="text-sm text-[color:var(--cp-muted)]">
            {plan.errorMessage ?? "Something went wrong."}
          </p>
          <span className="cp-glow mt-2 inline-block">
            <button
              onClick={onRetry}
              disabled={retrying}
              className="cp-btn inline-flex items-center px-8 py-3 text-sm"
            >
              {retrying ? "Retrying…" : "Try again"}
            </button>
          </span>
        </div>
      </Frame>
    );
  }

  const content = plan.content;
  const thisMonth = currentMonth(plan.startedAt, now);
  const active = selected ?? thisMonth;
  const m = content.months.find((x) => x.month === active) ?? content.months[0];
  const weeklyMinutes = m.workouts.reduce((sum, w) => sum + w.minutes, 0);

  return (
    <div className="space-y-10">
      <Overview
        content={content}
        startWeightKg={plan.startWeightKg}
        unit={unit}
      />

      <section>
        <SectionHead code="02 · TIMELINE" title="Month by month" />

        <div
          role="tablist"
          aria-label="Plan months"
          className="mb-5 flex flex-wrap gap-2"
        >
          {content.months.map((x) => (
            <button
              key={x.month}
              role="tab"
              type="button"
              aria-selected={x.month === active}
              onClick={() => setSelected(x.month)}
              className="cp-tab"
            >
              Month {x.month}
              {x.month === thisMonth ? " •" : ""}
            </button>
          ))}
        </div>

        <Frame className="cp-glow-c">
          <div role="tabpanel" className="space-y-4 p-6">
            <div>
              <HudLabel>{`// MONTH ${String(m.month).padStart(2, "0")}`}</HudLabel>
              <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
                {m.focus || `Month ${m.month}`}
              </h3>
              <p className="mt-1 font-mono text-xs tracking-wide text-[color:var(--cp-muted)]">
                {m.workouts.length} sessions · {weeklyMinutes} min/week (~
                {(weeklyMinutes / 60).toFixed(1)} h) · target{" "}
                <span className="text-[color:var(--c1)]">
                  {formatWeight(m.targetWeightKg, unit)}
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {m.workouts.map((w, i) => (
                <div
                  key={`${w.day}-${i}`}
                  className="border border-[color:var(--cp-line)] border-l-2 bg-[var(--cp-tint)] p-3"
                  style={{ borderLeftColor: "var(--c1)" }}
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-bold text-[color:var(--cp-fg)]">
                      <span className="font-mono text-[color:var(--c2)]">
                        {w.day}
                      </span>{" "}
                      · {w.title}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-[color:var(--c1)]">
                      {w.minutes} min
                    </span>
                  </div>
                  {w.details && (
                    <p className="mt-1 text-sm text-[color:var(--cp-muted)]">
                      {w.details}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {m.nutritionNotes && (
              <p className="border-t border-[color:var(--cp-line)] pt-4 text-sm text-[color:var(--cp-muted)]">
                🍽️{" "}
                <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[color:var(--c2)]">
                  Nutrition:
                </span>{" "}
                {m.nutritionNotes}
              </p>
            )}
          </div>
        </Frame>
      </section>
    </div>
  );
}
