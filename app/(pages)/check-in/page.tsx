// app/check-in/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CheckInForm } from "@/app/components/CheckInForm";
import { useCoach } from "@/hooks/useCoach";
import { EARLY_MS, checkInWindow } from "@/convex/lib/schedule";
import { formatDelta, formatWeight } from "@/lib/units";

export default function CheckInPage() {
  const router = useRouter();
  const { loading, profile, plan, checkIns } = useCoach();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !profile) router.replace("/onboarding");
  }, [loading, profile, router]);

  if (loading || !profile)
    return <p className="text-sm text-gray-500">Loading…</p>;

  const unit = profile.unitSystem;
  const readyPlan = plan && plan.status === "ready" ? plan : null;
  const slot = readyPlan
    ? checkInWindow(readyPlan.startedAt, checkIns.length, now)
    : null;
  const history = [...checkIns].reverse();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-black text-black dark:text-white">
        Monthly check-in
      </h1>

      {!readyPlan || !slot ? (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600 dark:text-gray-300">
            Your check-ins unlock once your 6-month plan is ready.
          </CardContent>
        </Card>
      ) : slot.month === null ? (
        <Card>
          <CardContent className="pt-6">
            🎉 You&apos;ve completed all 6 monthly check-ins. Amazing work!
          </CardContent>
        </Card>
      ) : slot.open ? (
        <Card>
          <CardContent className="pt-6">
            <CheckInForm
              planId={readyPlan._id}
              month={slot.month}
              unit={unit}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600 dark:text-gray-300">
            Month {slot.month} check-in opens on{" "}
            <span className="font-semibold">
              {new Date((slot.dueAt ?? now) - EARLY_MS).toLocaleDateString()}
            </span>
            .
          </CardContent>
        </Card>
      )}

      {history.map((c) => (
        <Card key={c._id}>
          <CardContent className="pt-6 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-bold text-black dark:text-white">
                Month {c.month}
              </p>
              <p className="text-sm text-gray-500">
                {formatWeight(c.weightKg, unit)} (
                {formatDelta(c.changeFromPreviousKg, unit)} vs last) · energy{" "}
                {c.energy}/5 · adherence {c.adherence}/5
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                🧠 Coach says
              </p>
              <p className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                {c.feedback ??
                  (c.feedbackStatus === "generating"
                    ? "Your coach is writing…"
                    : "")}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
