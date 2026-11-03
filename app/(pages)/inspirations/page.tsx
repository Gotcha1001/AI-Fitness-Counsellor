// app/(pages)/inspirations/page.tsx  →  route: /inspirations
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { CyberShell } from "@/app/components/Cyber";
import { useCoach } from "@/hooks/useCoach";
import { useInspirations } from "@/hooks/useInspirations";
import { DailyInspirationCard } from "@/app/components/inspirations/DailyInspirationCard";
import { MoodBoost } from "@/app/components/inspirations/MoodBoost";
import { InspirationHistory } from "@/app/components/inspirations/InspirationHistory";

export default function InspirationsPage() {
  const router = useRouter();
  const { loading: coachLoading, profile } = useCoach();
  const { loading, dateKey, today, recent, streak } = useInspirations();
  const retry = useMutation(api.inspirations.retry);
  const toggleSaved = useMutation(api.inspirations.toggleSaved);

  useEffect(() => {
    if (!coachLoading && !profile) router.replace("/onboarding");
  }, [coachLoading, profile, router]);

  const onRetry = (id: Parameters<typeof retry>[0]["inspirationId"]) =>
    retry({ inspirationId: id }).catch(() =>
      toast.error("Couldn't retry. Please try again."),
    );
  const onToggleSave = (
    id: Parameters<typeof toggleSaved>[0]["inspirationId"],
  ) =>
    toggleSaved({ inspirationId: id }).catch(() =>
      toast.error("Couldn't save. Please try again."),
    );

  if (coachLoading || loading || !profile) {
    return (
      <CyberShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p
            className="font-mono text-xs uppercase tracking-[0.35em] text-[color:var(--c2)]"
            style={{ animation: "cp-blink 1.4s infinite" }}
          >
            {"// LOADING INSPIRATIONS…"}
          </p>
        </div>
      </CyberShell>
    );
  }

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
            MOTIVATION//DAILY
          </div>
          <h1 className="text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl lg:text-6xl">
            <span
              className="cp-glitch text-[color:var(--c1)]"
              data-text="INSPIRATIONS"
            >
              Inspirations
            </span>
          </h1>
          <div
            className="mt-4 h-px w-32"
            style={{
              background: "linear-gradient(90deg,var(--c1),transparent)",
            }}
          />
        </motion.header>

        <DailyInspirationCard
          inspiration={today}
          streak={streak}
          onRetry={onRetry}
          onToggleSave={onToggleSave}
        />
        <MoodBoost dateKey={dateKey} />
        <InspirationHistory
          items={recent}
          todayId={today?._id}
          onToggleSave={onToggleSave}
        />
      </div>
    </CyberShell>
  );
}
