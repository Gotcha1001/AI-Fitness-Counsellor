// app/components/mealplan/MealPlanView.tsx
"use client";

import { useMemo, useState } from "react";
import { CalendarDays, LayoutGrid, RotateCw, Sparkles } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { MEAL_PLAN_WEEKS } from "@/convex/lib/schedule";
import { Frame, HudLabel } from "@/app/components/Cyber";
import { elapsedWeeks, weekdayName, weekSummary } from "@/lib/mealPlan";
import { DayView, type DayTargets } from "./DayView";
import { MealPlanGeneratingPanel } from "./MealPlanGeneratingPanel";

type ViewMode = "day" | "month";

interface Props {
  mealPlan: Doc<"mealPlans">;
  /** Daily calorie / protein targets from the 6-month plan (null if unavailable). */
  targets: DayTargets | null;
  /** True when a run has been "generating" for longer than the server treats as dead. */
  stuck: boolean;
  busy: boolean;
  onRegenerate: () => void;
  onRetry: (id: Doc<"mealPlans">["_id"]) => void;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[color:var(--cp-line)] bg-[color:var(--cp-tint)] p-3 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[color:var(--cp-faint)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[color:var(--c1)]">{value}</p>
    </div>
  );
}

export function MealPlanView({
  mealPlan,
  targets,
  stuck,
  busy,
  onRegenerate,
  onRetry,
}: Props) {
  const weeks = useMemo(() => mealPlan.weeks ?? [], [mealPlan.weeks]);

  // "Today" is fixed for the visit; the plan's first week starts the day it was written.
  const [now] = useState(() => Date.now());
  const todayName = weekdayName(new Date(now));
  const rawWeek = elapsedWeeks(mealPlan.createdAt, now);
  const monthFinished = rawWeek >= MEAL_PLAN_WEEKS;

  const [mode, setMode] = useState<ViewMode>("day");
  const [weekIdx, setWeekIdx] = useState(() =>
    Math.max(0, Math.min(rawWeek, weeks.length - 1)),
  );
  const [dayName, setDayName] = useState(todayName);

  const generating = mealPlan.status === "generating";
  const failed = mealPlan.status === "failed";
  const needsRetry = failed || stuck;

  const safeWeekIdx = Math.min(weekIdx, Math.max(weeks.length - 1, 0));
  const week = weeks[safeWeekIdx];
  const day = week
    ? (week.days.find((d) => d.day === dayName) ?? week.days[0])
    : null;
  const summary = useMemo(() => (week ? weekSummary(week.days) : null), [week]);

  function jumpTo(wIdx: number, name: string) {
    setWeekIdx(wIdx);
    setDayName(name);
    setMode("day");
  }

  return (
    <div className="space-y-6">
      {/* Status banners: shown above any weeks that already finished */}
      {generating && !stuck && (
        <MealPlanGeneratingPanel weeksDone={weeks.length} />
      )}

      {needsRetry && (
        <Frame>
          <div className="space-y-4 p-6 sm:p-8" role="alert">
            <HudLabel>
              {stuck
                ? "// THIS TOOK TOO LONG"
                : "// COULDN'T FINISH YOUR MEAL PLAN"}
            </HudLabel>
            <p className="text-sm leading-relaxed text-[color:var(--cp-muted)]">
              {failed
                ? (mealPlan.errorMessage ??
                  "Your coach couldn't write your meal plan just now. Please try again.")
                : "Writing your meal plan stalled. Weeks that already finished are kept, so we'll pick up where it stopped."}
              {weeks.length > 0 &&
                ` ${weeks.length} of ${MEAL_PLAN_WEEKS} weeks are ready below.`}
            </p>
            <button
              type="button"
              onClick={() => onRetry(mealPlan._id)}
              disabled={busy}
              className="inline-flex items-center gap-2 border border-[color:var(--c2)]/50 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c2)] transition-colors hover:bg-[color:var(--c2)]/10 disabled:opacity-40"
            >
              <RotateCw size={13} /> {busy ? "Retrying…" : "Try again"}
            </button>
          </div>
        </Frame>
      )}

      {weeks.length > 0 && week && day && summary && (
        <>
          {/* View mode + week tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Choose a week"
            >
              {Array.from({ length: MEAL_PLAN_WEEKS }, (_, i) => {
                const ready = i < weeks.length;
                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={mode === "day" && i === safeWeekIdx}
                    disabled={!ready}
                    className="cp-tab disabled:opacity-35"
                    onClick={() => {
                      setWeekIdx(i);
                      setMode("day");
                    }}
                  >
                    Week {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2" role="group" aria-label="Plan view">
              <button
                type="button"
                className="cp-tab inline-flex items-center gap-2"
                aria-pressed={mode === "day"}
                onClick={() => setMode("day")}
              >
                <CalendarDays size={13} aria-hidden /> Daily
              </button>
              <button
                type="button"
                className="cp-tab inline-flex items-center gap-2"
                aria-pressed={mode === "month"}
                onClick={() => setMode("month")}
              >
                <LayoutGrid size={13} aria-hidden /> Month
              </button>
            </div>
          </div>

          {monthFinished && !generating && (
            <p className="border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-4 py-3 text-sm text-[color:var(--cp-muted)]">
              This month&apos;s plan has run its course. Write a fresh month
              below to keep going.
            </p>
          )}

          {mode === "day" ? (
            <>
              {/* Week summary */}
              <Frame>
                <div className="space-y-4 p-5">
                  <div>
                    <HudLabel>{`// WEEK ${week.week} OF ${MEAL_PLAN_WEEKS}`}</HudLabel>
                    <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--cp-muted)]">
                      {week.focus}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Stat label="Avg kcal / day" value={`${summary.avgKcal}`} />
                    <Stat
                      label="Avg protein"
                      value={`${summary.avgProteinG} g`}
                    />
                    <Stat
                      label="Training days"
                      value={`${summary.trainingDays}`}
                    />
                    <Stat
                      label="Training time"
                      value={`${summary.trainingMinutes} min`}
                    />
                  </div>
                </div>
              </Frame>

              {/* Day picker */}
              <div
                className="grid grid-cols-7 gap-1.5 sm:gap-2"
                role="tablist"
                aria-label="Choose a day"
              >
                {week.days.map((d) => {
                  const training = d.workout.minutes > 0;
                  const isToday =
                    !monthFinished &&
                    safeWeekIdx === rawWeek &&
                    d.day === todayName;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      role="tab"
                      aria-selected={d.day === day.day}
                      onClick={() => setDayName(d.day)}
                      className="cp-tab flex flex-col items-center gap-1 !px-1 !py-2"
                    >
                      <span>{d.day.slice(0, 3)}</span>
                      <span className="text-[9px] font-normal tracking-normal opacity-80">
                        {d.totalCalories}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          training
                            ? "bg-[color:var(--c1)]"
                            : "bg-[color:var(--cp-line)]"
                        }`}
                        title={training ? "Training day" : "Rest day"}
                      />
                      {isToday && <span className="sr-only">(today)</span>}
                    </button>
                  );
                })}
              </div>

              <div role="tabpanel">
                <DayView
                  day={day}
                  targets={targets}
                  isToday={
                    !monthFinished &&
                    safeWeekIdx === rawWeek &&
                    day.day === todayName
                  }
                />
              </div>
            </>
          ) : (
            <Frame>
              <div className="space-y-4 p-5">
                <div>
                  <HudLabel>{"// MONTH AT A GLANCE"}</HudLabel>
                  <p className="mt-1.5 text-sm text-[color:var(--cp-muted)]">
                    Tap any day to see exactly what to eat and how to train.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <div className="min-w-[640px] space-y-2">
                    {weeks.map((w, wi) => (
                      <div
                        key={w.week}
                        className="grid grid-cols-[3.5rem_repeat(7,1fr)] gap-1.5"
                      >
                        <div className="flex items-center font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--cp-faint)]">
                          Wk {w.week}
                        </div>
                        {w.days.map((d) => {
                          const training = d.workout.minutes > 0;
                          const isToday =
                            !monthFinished &&
                            wi === rawWeek &&
                            d.day === todayName;
                          return (
                            <button
                              key={d.day}
                              type="button"
                              onClick={() => jumpTo(wi, d.day)}
                              className="cp-opt flex min-w-0 flex-col gap-0.5 !p-2"
                              aria-pressed={isToday}
                              aria-label={`Week ${w.week}, ${d.day}: ${d.totalCalories} kcal, ${d.workout.title}`}
                            >
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[color:var(--c2)]">
                                {d.day.slice(0, 3)}
                              </span>
                              <span className="font-mono text-xs font-bold text-[color:var(--cp-fg)]">
                                {d.totalCalories}
                              </span>
                              <span
                                className={`truncate text-[10px] ${
                                  training
                                    ? "text-[color:var(--c1)]"
                                    : "text-[color:var(--cp-faint)]"
                                }`}
                              >
                                {training ? d.workout.title : "Rest"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                    {weeks.length < MEAL_PLAN_WEEKS &&
                      Array.from(
                        { length: MEAL_PLAN_WEEKS - weeks.length },
                        (_, i) => (
                          <div
                            key={`pending-${i}`}
                            className="border border-dashed border-[color:var(--cp-line)] px-3 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--cp-faint)]"
                          >
                            Week {weeks.length + i + 1} · not written yet
                          </div>
                        ),
                      )}
                  </div>
                </div>
              </div>
            </Frame>
          )}
        </>
      )}

      {/* Footer: disclaimer + regenerate */}
      {mealPlan.status === "ready" && (
        <div className="flex flex-col gap-4 border-t border-[color:var(--cp-line)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs leading-relaxed text-[color:var(--cp-faint)]">
            Written by AI from your plan, allergies and food list. Weigh meat,
            fish, rice, pasta and potatoes cooked. Always double-check foods
            against your allergies. General guidance, not medical advice.
          </p>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-2 bg-[color:var(--c1)] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black transition-opacity disabled:opacity-40"
          >
            <Sparkles size={14} /> {busy ? "Starting…" : "Write me a new month"}
          </button>
        </div>
      )}
    </div>
  );
}
