// app/settings/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/app/components/OnboardingWizard";
import { CyberShell } from "@/app/components/Cyber";
import { useCoach } from "@/hooks/useCoach";

export default function SettingsPage() {
  const router = useRouter();
  const { loading, profile } = useCoach();

  useEffect(() => {
    if (!loading && !profile) router.replace("/onboarding");
  }, [loading, profile, router]);

  if (loading || !profile)
    return (
      <CyberShell>
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p
            className="font-mono text-xs uppercase tracking-[0.35em] text-[color:var(--c2)]"
            style={{ animation: "cp-blink 1.4s infinite" }}
          >
            {"// LOADING PROFILE…"}
          </p>
        </div>
      </CyberShell>
    );

  // The wizard renders its own CyberShell, so onboarding gets the same look.
  return <OnboardingWizard initial={profile} />;
}
