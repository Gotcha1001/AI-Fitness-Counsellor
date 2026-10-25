// app/components/PlanView.tsx
"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import type { PlanContent, UnitSystem } from "@/convex/lib/validators";
import { currentMonth } from "@/convex/lib/schedule";
import { formatWeight } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlanViewProps {
  plan: Doc<"plans">;
  unit: UnitSystem;
  onRetry: () => void;
  retrying: boolean;
}

function Pills({ items, tone }: { items: string[]; tone: "good" | "bad" }) {
  const cls =
    tone === "good"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-3 py-1 text-xs font-medium ${cls}`}
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
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-200">{content.summary}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
            {[
              ["Calories", `${content.dailyCalories}`],
              ["Protein", `${content.proteinG}g`],
              ["Carbs", `${content.carbsG}g`],
              ["Fat", `${content.fatG}g`],
              [
                "6-mo target",
                `${formatWeight(startWeightKg, unit)} → ${formatWeight(goalKg, unit)}`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-gray-200 dark:border-gray-800 p-3"
              >
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  {label}
                </p>
                <p className="text-sm font-bold text-black dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-600 dark:text-emerald-400">
              ✅ Eat more of
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Pills items={content.foodsToEat} tone="good" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              🚫 Stay away from
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Pills items={content.foodsToAvoid} tone="bad" />
          </CardContent>
        </Card>
      </div>

      {content.dailyHabits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily habits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              {content.dailyHabits.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function PlanView({ plan, unit, onRetry, retrying }: PlanViewProps) {
  const [now] = useState(() => Date.now());

  if (plan.status === "generating") {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          <p className="font-semibold text-black dark:text-white">
            Your coach is building your 6-month plan…
          </p>
          <p className="text-sm text-gray-500">
            This usually takes under a minute.{" "}
            {plan.progressChars > 0 &&
              `Written so far: ${plan.progressChars.toLocaleString()} characters.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (plan.status === "failed" || !plan.content) {
    return (
      <Card>
        <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
          <p className="font-semibold text-black dark:text-white">
            We couldn&apos;t finish your plan
          </p>
          <p className="text-sm text-gray-500">
            {plan.errorMessage ?? "Something went wrong."}
          </p>
          <Button
            onClick={onRetry}
            disabled={retrying}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const content = plan.content;
  const thisMonth = currentMonth(plan.startedAt, now);

  return (
    <div className="space-y-6">
      <Overview
        content={content}
        startWeightKg={plan.startWeightKg}
        unit={unit}
      />

      <Tabs defaultValue={String(thisMonth)}>
        <TabsList className="flex-wrap h-auto">
          {content.months.map((m) => (
            <TabsTrigger key={m.month} value={String(m.month)}>
              Month {m.month}
              {m.month === thisMonth ? " •" : ""}
            </TabsTrigger>
          ))}
        </TabsList>
        {content.months.map((m) => {
          const weeklyMinutes = m.workouts.reduce(
            (sum, w) => sum + w.minutes,
            0,
          );
          return (
            <TabsContent
              key={m.month}
              value={String(m.month)}
              className="space-y-3"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{m.focus || `Month ${m.month}`}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {m.workouts.length} sessions · {weeklyMinutes} min/week (~
                    {(weeklyMinutes / 60).toFixed(1)} h) · target{" "}
                    {formatWeight(m.targetWeightKg, unit)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {m.workouts.map((w, i) => (
                    <div
                      key={`${w.day}-${i}`}
                      className="rounded-xl border border-gray-200 dark:border-gray-800 p-3"
                    >
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold text-black dark:text-white">
                          {w.day} · {w.title}
                        </p>
                        <span className="text-xs text-gray-500 shrink-0">
                          {w.minutes} min
                        </span>
                      </div>
                      {w.details && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {w.details}
                        </p>
                      )}
                    </div>
                  ))}
                  {m.nutritionNotes && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      🍽️ <span className="font-semibold">Nutrition:</span>{" "}
                      {m.nutritionNotes}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
