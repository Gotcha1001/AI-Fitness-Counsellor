// app/plan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { PlanView } from "@/app/components/PlanView";
import { PlanGeneratingModal } from "@/app/components/PlanGeneratingModal";
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
    return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Full-screen "coach is thinking" modal while the plan is being written */}
      <PlanGeneratingModal
        open={plan?.status === "generating"}
        progressChars={plan?.progressChars ?? 0}
        sessionKey={plan?._id}
      />
      <h1 className="text-2xl font-black text-black dark:text-white">
        My 6-month plan
      </h1>
      {plan ? (
        <PlanView
          plan={plan}
          unit={profile.unitSystem}
          onRetry={retry}
          retrying={retrying}
        />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            You haven&apos;t generated a plan yet.
          </p>
          <button
            onClick={retry}
            disabled={retrying}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            {retrying ? "Starting…" : "Generate my plan"}
          </button>
        </div>
      )}
    </div>
  );
}
