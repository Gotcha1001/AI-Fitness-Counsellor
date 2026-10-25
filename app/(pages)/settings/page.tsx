// app/settings/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/app/components/OnboardingWizard";
import { useCoach } from "@/hooks/useCoach";

export default function SettingsPage() {
  const router = useRouter();
  const { loading, profile } = useCoach();

  useEffect(() => {
    if (!loading && !profile) router.replace("/onboarding");
  }, [loading, profile, router]);

  if (loading || !profile)
    return <p className="text-sm text-gray-500">Loading…</p>;
  return <OnboardingWizard initial={profile} />;
}
