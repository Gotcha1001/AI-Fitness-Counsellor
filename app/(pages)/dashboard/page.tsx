// app/dashboard/page.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { WeightChart, type ChartPoint } from "@/app/components/WeightChart";
import {
  CyberShell,
  Frame,
  HudLabel,
  SectionHead,
} from "@/app/components/Cyber";
import { useCoach } from "@/hooks/useCoach";
import { checkInWindow, currentMonth } from "@/convex/lib/schedule";
import { formatDelta, formatWeight } from "@/lib/units";

function Stat({
  label,
  value,
  sub,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      <Frame className="h-full">
        <div className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--c2)]">
            {label}
          </p>
          <p className="mt-1 text-2xl font-black text-[color:var(--cp-fg)]">
            {value}
          </p>
          {sub && <p className="text-xs text-[color:var(--cp-faint)]">{sub}</p>}
        </div>
      </Frame>
    </motion.div>
  );
}

/** A framed status row: message on the left, action on the right. */
function Banner({
  children,
  action,
  glow = false,
}: {
  children: ReactNode;
  action?: ReactNode;
  glow?: boolean;
}) {
  return (
    <Frame className={glow ? "cp-glow" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div>{children}</div>
        {action}
      </div>
    </Frame>
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
    return (
      <CyberShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p
            className="font-mono text-xs uppercase tracking-[0.35em] text-[color:var(--c2)]"
            style={{ animation: "cp-blink 1.4s infinite" }}
          >
            {"// LOADING DASHBOARD…"}
          </p>
        </div>
      </CyberShell>
    );

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
    <CyberShell>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10 lg:py-14">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-left"
        >
          <div className="mb-4 inline-flex items-center gap-2 border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c2)]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--c1)]"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            DASHBOARD//ONLINE
          </div>
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            <span
              className="cp-glitch text-[color:var(--c1)]"
              data-text="WELCOME"
            >
              Welcome
            </span>{" "}
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text="BACK"
            >
              back
            </span>{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-[color:var(--cp-muted)]">
            {readyPlan
              ? `You're in month ${month} of 6.`
              : "Let's get your plan sorted."}
          </p>
          <div
            className="mt-4 h-px w-32"
            style={{
              background: "linear-gradient(90deg,var(--c1),transparent)",
            }}
          />
        </motion.header>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat
            label="Started"
            value={formatWeight(profile.startWeightKg, unit)}
            delay={0}
          />
          <Stat
            label="Now"
            value={formatWeight(profile.currentWeightKg, unit)}
            delay={0.07}
          />
          <Stat label="Change" value={formatDelta(change, unit)} delay={0.14} />
          <Stat
            label="Month target"
            value={
              monthTarget !== undefined ? formatWeight(monthTarget, unit) : "—"
            }
            delay={0.21}
          />
        </div>

        {!plan && (
          <Banner
            action={
              <span className="cp-glow inline-block">
                <Link
                  href="/plan"
                  className="cp-btn inline-flex items-center gap-2 px-6 py-3 text-sm"
                >
                  Generate plan <ArrowRight className="h-4 w-4" />
                </Link>
              </span>
            }
          >
            <HudLabel>{"// NO PLAN"}</HudLabel>
            <p className="mt-1 text-sm text-[color:var(--cp-muted)]">
              You don&apos;t have a plan yet.
            </p>
          </Banner>
        )}

        {plan && plan.status !== "ready" && (
          <Banner
            action={
              <Link
                href="/plan"
                className="cp-btn-ghost inline-flex items-center px-6 py-3 text-sm"
              >
                View
              </Link>
            }
          >
            <HudLabel>
              {plan.status === "generating" ? "// COMPILING" : "// ERROR"}
            </HudLabel>
            <p className="mt-1 text-sm text-[color:var(--cp-muted)]">
              {plan.status === "generating"
                ? "Your coach is still writing your plan…"
                : "Plan generation failed."}
            </p>
          </Banner>
        )}

        {slot && (
          <Banner
            glow={slot.open}
            action={
              slot.open ? (
                <span className="cp-glow inline-block">
                  <Link
                    href="/check-in"
                    className="cp-btn inline-flex items-center gap-2 px-6 py-3 text-sm"
                  >
                    Check in <ArrowRight className="h-4 w-4" />
                  </Link>
                </span>
              ) : undefined
            }
          >
            <HudLabel>
              {slot.open ? "// CHECK-IN READY" : "// NEXT CHECK-IN"}
            </HudLabel>
            <p className="mt-1 font-bold text-[color:var(--cp-fg)]">
              {slot.month === null
                ? "🎉 You completed all 6 check-ins!"
                : `Month ${slot.month} check-in`}
            </p>
            {slot.dueAt !== null && (
              <p className="text-sm text-[color:var(--cp-muted)]">
                {slot.open
                  ? "Ready now"
                  : `Opens ${new Date(slot.dueAt).toLocaleDateString()}`}
              </p>
            )}
          </Banner>
        )}

        <section className="pt-2">
          <SectionHead code="PROGRESS" title="Weight progress" />
          <Frame className="cp-glow-c">
            <div className="p-5">
              <WeightChart points={points} unit={unit} />
            </div>
          </Frame>
        </section>
      </div>
    </CyberShell>
  );
}
