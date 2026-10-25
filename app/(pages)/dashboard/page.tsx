// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeightChart, type ChartPoint } from "@/app/components/WeightChart";
import { useCoach } from "@/hooks/useCoach";
import { checkInWindow, currentMonth } from "@/convex/lib/schedule";
import { formatDelta, formatWeight } from "@/lib/units";

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-[11px] uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="text-2xl font-black text-black dark:text-white">
          {value}
        </p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { loading, profile, plan, checkIns } = useCoach();
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !profile) router.replace("/onboarding");
  }, [loading, profile, router]);

  if (loading || !profile)
    return <p className="text-sm text-gray-500">Loading your dashboard…</p>;

  const unit = profile.unitSystem;
  const readyPlan =
    plan && plan.status === "ready" && plan.content ? plan : null;
  const change = profile.currentWeightKg - profile.startWeightKg;
  const month = readyPlan ? currentMonth(readyPlan.startedAt, now) : null;
  const monthTarget =
    readyPlan?.content?.months[(month ?? 1) - 1]?.targetWeightKg;
  const slot = readyPlan
    ? checkInWindow(readyPlan.startedAt, checkIns.length, now)
    : null;

  const points: ChartPoint[] = [
    { label: "Start", kg: profile.startWeightKg },
    ...checkIns.map((c) => ({ label: `M${c.month}`, kg: c.weightKg })),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-black dark:text-white">
          Welcome back 👋
        </h1>
        <p className="text-sm text-gray-500">
          {readyPlan
            ? `You're in month ${month} of 6.`
            : "Let's get your plan sorted."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Started"
          value={formatWeight(profile.startWeightKg, unit)}
        />
        <Stat label="Now" value={formatWeight(profile.currentWeightKg, unit)} />
        <Stat label="Change" value={formatDelta(change, unit)} />
        <Stat
          label="Month target"
          value={
            monthTarget !== undefined ? formatWeight(monthTarget, unit) : "—"
          }
        />
      </div>

      {!plan && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You don&apos;t have a plan yet.
            </p>
            <Link href="/plan">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Generate plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      {plan && plan.status !== "ready" && (
        <Card>
          <CardContent className="pt-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {plan.status === "generating"
                ? "Your coach is still writing your plan…"
                : "Plan generation failed."}
            </p>
            <Link href="/plan">
              <Button variant="outline">View</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {slot && (
        <Card>
          <CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-black dark:text-white">
                {slot.month === null
                  ? "🎉 You completed all 6 check-ins!"
                  : `Month ${slot.month} check-in`}
              </p>
              {slot.dueAt !== null && (
                <p className="text-sm text-gray-500">
                  {slot.open
                    ? "Ready now"
                    : `Opens ${new Date(slot.dueAt).toLocaleDateString()}`}
                </p>
              )}
            </div>
            {slot.open && (
              <Link href="/check-in">
                <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Check in →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weight progress</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart points={points} unit={unit} />
        </CardContent>
      </Card>
    </div>
  );
}
