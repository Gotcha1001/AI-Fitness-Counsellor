// hooks/useMealPlan.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

/** Keep in sync with STUCK_MS in convex/mealPlans.ts. */
const STUCK_MS = 10 * 60_000;

interface MealPlanData {
  loading: boolean;
  /** The meal plan for the CURRENT 6-month plan, or null while it is being created. */
  mealPlan: Doc<"mealPlans"> | null;
  /** True when a run has been "generating" for longer than the server treats as dead. */
  stuck: boolean;
}

/**
 * Pass the user's latest plan. Once it is ready, makes sure a meal plan exists for it
 * (ensureForPlan is idempotent on the server) and returns the live row.
 */
export function useMealPlan(plan: Doc<"plans"> | null): MealPlanData {
  const planReady = plan?.status === "ready";
  const latest = useQuery(api.mealPlans.getActive);
  const ensure = useMutation(api.mealPlans.ensureForPlan);
  const started = useRef(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!planReady || latest === undefined || started.current) return;
    started.current = true;
    ensure({}).catch((e: unknown) =>
      console.error("[mealPlan] ensureForPlan failed", e),
    );
  }, [planReady, latest, ensure]);

  // Re-check "stuck" every 30s without needing a data change.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // A meal plan written for an older 6-month plan must not be shown for the new one.
  const mealPlan = latest && plan && latest.planId === plan._id ? latest : null;
  const stuck =
    mealPlan?.status === "generating" && now - mealPlan.updatedAt > STUCK_MS;

  return { loading: latest === undefined, mealPlan, stuck: !!stuck };
}
