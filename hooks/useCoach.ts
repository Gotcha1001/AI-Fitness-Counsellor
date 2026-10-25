// hooks/useCoach.ts
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";

interface CoachData {
  loading: boolean;
  profile: Doc<"profiles"> | null;
  plan: Doc<"plans"> | null;
  checkIns: Doc<"checkIns">[];
}

export function useCoach(): CoachData {
  const profile = useQuery(api.profiles.getMine);
  const plan = useQuery(api.plans.getActive);
  const checkIns = useQuery(
    api.checkIns.listForPlan,
    plan ? { planId: plan._id } : "skip",
  );

  const loading =
    profile === undefined ||
    plan === undefined ||
    (plan !== null && checkIns === undefined);

  return {
    loading,
    profile: profile ?? null,
    plan: plan ?? null,
    checkIns: checkIns ?? [],
  };
}
