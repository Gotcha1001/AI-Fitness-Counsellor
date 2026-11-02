// app/plan/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { PlanView } from "@/app/components/PlanView";
import { PlanGeneratingModal } from "@/app/components/PlanGeneratingModal";
import { CyberShell, Frame, HudLabel } from "@/app/components/Cyber";
import { useCoach } from "@/hooks/useCoach";

export default function PlanPage() {
  const router = useRouter();
  const requestPlan = useMutation(api.plans.requestPlan);
  const { loading, profile, plan } = useCoach();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!loading && !profile) router.replace("/onboarding");
  }, [loading, profile, router]);

  async function retry() {
    setRetrying(true);
    try {
      await requestPlan({});
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't restart plan generation.",
      );
    } finally {
      setRetrying(false);
    }
  }

  if (loading || !profile)
    return (
      <CyberShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p
            className="font-mono text-xs uppercase tracking-[0.35em] text-[color:var(--c2)]"
            style={{ animation: "cp-blink 1.4s infinite" }}
          >
            {"// LOADING PROTOCOL…"}
          </p>
        </div>
      </CyberShell>
    );

  return (
    <CyberShell>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10 lg:py-14">
        {/* Full-screen "coach is thinking" modal while the plan is being written */}
        <PlanGeneratingModal
          open={plan?.status === "generating"}
          progressChars={plan?.progressChars ?? 0}
          sessionKey={plan?._id}
        />

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
            PLAN//ACTIVE · 6 MONTHS
          </div>
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="cp-glitch text-[color:var(--c1)]" data-text="MY">
              My
            </span>{" "}
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text="6-MONTH PLAN"
            >
              6-month plan
            </span>
          </h1>
          <div
            className="mt-4 h-px w-32"
            style={{
              background: "linear-gradient(90deg,var(--c1),transparent)",
            }}
          />
        </motion.header>

        {plan ? (
          <PlanView
            plan={plan}
            unit={profile.unitSystem}
            onRetry={retry}
            retrying={retrying}
          />
        ) : (
          <Frame className="cp-glow">
            <div className="relative overflow-hidden px-6 py-12 text-center">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 50% 0%, color-mix(in oklab,var(--c1) 35%,transparent), transparent 60%)",
                }}
              />
              <div className="relative">
                <HudLabel>{"// NO PLAN FOUND"}</HudLabel>
                <p className="mt-3 text-sm text-[color:var(--cp-muted)]">
                  You haven&apos;t generated a plan yet.
                </p>
                <div className="mt-6">
                  <span className="cp-glow inline-block">
                    <button
                      onClick={retry}
                      disabled={retrying}
                      className="cp-btn inline-flex items-center gap-2 px-8 py-4 text-sm"
                    >
                      {retrying ? "Starting…" : "Generate my plan"}
                      {!retrying && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </Frame>
        )}
      </div>
    </CyberShell>
  );
}
