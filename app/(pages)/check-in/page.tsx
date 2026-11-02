// app/check-in/page.tsx
"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import {
  CyberShell,
  Frame,
  HudLabel,
  SectionHead,
} from "@/app/components/Cyber";
import { useCoach } from "@/hooks/useCoach";
import { EARLY_MS, checkInWindow } from "@/convex/lib/schedule";
import { formatDelta, formatWeight } from "@/lib/units";
import { CheckInForm } from "@/app/components/CheckInForm";

/** Framed status panel: HUD label on top, content below. */
function Panel({
  code,
  children,
  glow = false,
}: {
  code: string;
  children: ReactNode;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Frame className={glow ? "cp-glow" : ""}>
        <div className="p-5 sm:p-6">
          <HudLabel>{`// ${code}`}</HudLabel>
          <div className="mt-2 text-sm text-[color:var(--cp-muted)]">
            {children}
          </div>
        </div>
      </Frame>
    </motion.div>
  );
}

export default function CheckInPage() {
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
            {"// LOADING CHECK-IN…"}
          </p>
        </div>
      </CyberShell>
    );

  const unit = profile.unitSystem;
  const readyPlan = plan && plan.status === "ready" ? plan : null;
  const slot = readyPlan
    ? checkInWindow(readyPlan.startedAt, checkIns.length, now)
    : null;
  const history = [...checkIns].reverse();

  return (
    <CyberShell>
      <div className="mx-auto max-w-4xl space-y-6 px-6 py-10 lg:py-14">
        {/* Header */}
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
            CHECK-IN//MONTHLY
          </div>
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            <span
              className="cp-glitch text-[color:var(--c1)]"
              data-text="MONTHLY"
            >
              Monthly
            </span>{" "}
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text="CHECK-IN"
            >
              check-in
            </span>
          </h1>
          <div
            className="mt-4 h-px w-32"
            style={{
              background: "linear-gradient(90deg,var(--c1),transparent)",
            }}
          />
        </motion.header>

        {/* Current slot */}
        {!readyPlan || !slot ? (
          <Panel code="LOCKED">
            Your check-ins unlock once your 6-month plan is ready.
          </Panel>
        ) : slot.month === null ? (
          <Panel code="COMPLETE" glow>
            <span className="font-bold text-[color:var(--cp-fg)]">
              🎉 You&apos;ve completed all 6 monthly check-ins. Amazing work!
            </span>
          </Panel>
        ) : slot.open ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Frame className="cp-glow">
              <div className="p-5 sm:p-6">
                <CheckInForm
                  planId={readyPlan._id}
                  month={slot.month}
                  unit={unit}
                />
              </div>
            </Frame>
          </motion.div>
        ) : (
          <Panel code="NEXT CHECK-IN">
            Month {slot.month} check-in opens on{" "}
            <span className="font-bold text-[color:var(--c1)]">
              {new Date((slot.dueAt ?? now) - EARLY_MS).toLocaleDateString()}
            </span>
            .
          </Panel>
        )}

        {/* History */}
        {history.length > 0 && (
          <section className="pt-2">
            <SectionHead code="LOG" title="Past check-ins" />
            <div className="space-y-4">
              {history.map((c, i) => (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: Math.min(i * 0.07, 0.35),
                  }}
                >
                  <Frame>
                    <div className="space-y-4 p-5 sm:p-6">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-lg font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
                          Month {c.month}
                        </p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-[color:var(--cp-muted)]">
                          {formatWeight(c.weightKg, unit)} (
                          {formatDelta(c.changeFromPreviousKg, unit)} vs last)
                          {" · "}energy{" "}
                          <span className="text-[color:var(--c1)]">
                            {c.energy}/5
                          </span>
                          {" · "}adherence{" "}
                          <span className="text-[color:var(--c1)]">
                            {c.adherence}/5
                          </span>
                        </p>
                      </div>
                      <div
                        className="border-l-2 bg-[color:var(--c1)]/5 p-4"
                        style={{ borderColor: "var(--c1)" }}
                      >
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--c1)]">
                          {"// 🧠 COACH SAYS"}
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-[color:var(--cp-fg)]">
                          {c.feedback ??
                            (c.feedbackStatus === "generating" ? (
                              <span
                                className="font-mono text-xs uppercase tracking-[0.25em] text-[color:var(--c2)]"
                                style={{ animation: "cp-blink 1.4s infinite" }}
                              >
                                Your coach is writing…
                              </span>
                            ) : (
                              ""
                            ))}
                        </p>
                      </div>
                    </div>
                  </Frame>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>
    </CyberShell>
  );
}
