// app/(pages)/meal-plan/page.tsx  →  route: /meal-plan
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CyberShell, Frame, HudLabel } from "@/app/components/Cyber";
import { MealPlanView } from "@/app/components/mealplan/MealPlanView";
import { MealPlanGeneratingPanel } from "@/app/components/mealplan/MealPlanGeneratingPanel";
import { useCoach } from "@/hooks/useCoach";
import { useMealPlan } from "@/hooks/useMealPlan";
import { TOTAL_MONTHS } from "@/convex/lib/schedule";

export default function MealPlanPage() {
  const router = useRouter();
  const { loading: coachLoading, profile, plan } = useCoach();
  const planReady = plan?.status === "ready";
  const { loading, mealPlan, stuck } = useMealPlan(plan);
  const regenerate = useMutation(api.mealPlans.regenerate);
  const retry = useMutation(api.mealPlans.retry);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!coachLoading && !profile) router.replace("/onboarding");
  }, [coachLoading, profile, router]);

  const targets = useMemo(
    () =>
      plan?.content
        ? {
            calories: plan.content.dailyCalories,
            proteinG: plan.content.proteinG,
          }
        : null,
    [plan?.content],
  );

  async function onRegenerate() {
    setBusy(true);
    try {
      await regenerate({});
      toast.success("Your coach is writing a new month 🥗");
    } catch (e: unknown) {
      // The server's messages are user-friendly (daily limit, plan not ready…).
      toast.error(
        e instanceof Error ? e.message : "Couldn't start a new meal plan.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onRetry(mealPlanId: Id<"mealPlans">) {
    setBusy(true);
    try {
      await retry({ mealPlanId });
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't retry. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (coachLoading || loading || !profile) {
    return (
      <CyberShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p
            className="font-mono text-xs uppercase tracking-[0.35em] text-[color:var(--c2)]"
            style={{ animation: "cp-blink 1.4s infinite" }}
          >
            {"// LOADING MEAL PLAN…"}
          </p>
        </div>
      </CyberShell>
    );
  }

  const content = plan?.content;

  return (
    <CyberShell>
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-10 lg:py-14">
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
            NUTRITION//MEAL PLAN
            {mealPlan && ` · MONTH ${mealPlan.planMonth} OF ${TOTAL_MONTHS}`}
          </div>
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="cp-glitch text-[color:var(--c1)]" data-text="MY">
              My
            </span>{" "}
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text="MEAL PLAN"
            >
              meal plan
            </span>
          </h1>
          <div
            className="mt-4 h-px w-32"
            style={{
              background: "linear-gradient(90deg,var(--c1),transparent)",
            }}
          />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--cp-muted)]">
            Exactly what to eat each day, with portions, plus your workout for
            the week.
            {content && (
              <>
                {" "}
                Built around{" "}
                <span className="font-mono text-[color:var(--c1)]">
                  {content.dailyCalories} kcal
                </span>{" "}
                a day · {content.proteinG} g protein · {content.carbsG} g carbs
                · {content.fatG} g fat.
              </>
            )}
          </p>
        </motion.header>

        {!planReady ? (
          <PlanFirstCard planStatus={plan?.status ?? null} />
        ) : mealPlan ? (
          <MealPlanView
            // Remount when a new month is written so the tabs reset cleanly.
            key={mealPlan._id}
            mealPlan={mealPlan}
            targets={targets}
            stuck={stuck}
            busy={busy}
            onRegenerate={onRegenerate}
            onRetry={onRetry}
          />
        ) : (
          // Plan is ready but useMealPlan's ensureForPlan hasn't created the row yet.
          <MealPlanGeneratingPanel weeksDone={0} />
        )}
      </div>
    </CyberShell>
  );
}

function PlanFirstCard({
  planStatus,
}: {
  planStatus: "generating" | "ready" | "failed" | null;
}) {
  const message =
    planStatus === "generating"
      ? "Your plan is still being written. Your meal plan starts the moment it's ready."
      : planStatus === "failed"
        ? "Your plan didn't finish generating. Fix that first and your meal plan will follow."
        : "Your meal plan is built from your 6-month plan, so let's create that first.";

  return (
    <Frame className="cp-glow">
      <div className="px-6 py-10 text-center">
        <HudLabel>{"// PLAN NEEDED"}</HudLabel>
        <p className="mx-auto mt-3 max-w-md text-sm text-[color:var(--cp-muted)]">
          {message}
        </p>
        <div className="mt-6">
          <span className="cp-glow inline-block">
            <Link
              href="/plan"
              className="cp-btn inline-flex items-center gap-2 px-8 py-4 text-sm"
            >
              {planStatus === "generating" ? "Watch my plan" : "Go to my plan"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </span>
        </div>
      </div>
    </Frame>
  );
}
