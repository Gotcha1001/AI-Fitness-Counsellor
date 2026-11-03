// app/components/inspirations/DailyInspirationCard.tsx
"use client";

import { motion } from "framer-motion";
import { Flame, RotateCw, Star } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";
import { Frame, HudLabel } from "@/app/components/Cyber";

interface Props {
  inspiration: Doc<"inspirations"> | null;
  streak: number;
  onRetry: (id: Doc<"inspirations">["_id"]) => void;
  onToggleSave: (id: Doc<"inspirations">["_id"]) => void;
}

export function DailyInspirationCard({
  inspiration,
  streak,
  onRetry,
  onToggleSave,
}: Props) {
  const writing =
    !inspiration ||
    (inspiration.status === "generating" && !inspiration.message);
  const failed = inspiration?.status === "failed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Frame className="cp-glow">
        <div className="space-y-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <HudLabel>{"// TODAY'S INSPIRATION"}</HudLabel>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 border border-[color:var(--c1)]/40 bg-[color:var(--c1)]/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c1)]"
                title="Days in a row you've shown up"
              >
                <Flame size={13} /> {streak} day{streak === 1 ? "" : "s"}
              </span>
              {inspiration && inspiration.status !== "generating" && (
                <button
                  type="button"
                  onClick={() => onToggleSave(inspiration._id)}
                  aria-label={
                    inspiration.saved
                      ? "Remove from saved"
                      : "Save this inspiration"
                  }
                  className="text-[color:var(--c2)] transition-colors hover:text-[color:var(--c1)]"
                >
                  <Star
                    size={18}
                    fill={inspiration.saved ? "currentColor" : "none"}
                  />
                </button>
              )}
            </div>
          </div>

          {writing ? (
            <p
              className="font-mono text-xs uppercase tracking-[0.25em] text-[color:var(--c2)]"
              style={{ animation: "cp-blink 1.4s infinite" }}
            >
              Your coach is writing today&apos;s message…
            </p>
          ) : (
            <p className="whitespace-pre-wrap text-base leading-relaxed text-[color:var(--cp-fg)] sm:text-lg">
              {inspiration?.message}
            </p>
          )}

          {inspiration?.status === "ready" && inspiration.mantra && (
            <div
              className="border-l-2 bg-[color:var(--c1)]/5 p-4"
              style={{ borderColor: "var(--c1)" }}
            >
              <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--c1)]">
                {"// MANTRA"}
              </p>
              <p className="text-lg font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
                {inspiration.mantra}
              </p>
            </div>
          )}

          {failed && inspiration && (
            <button
              type="button"
              onClick={() => onRetry(inspiration._id)}
              className="inline-flex items-center gap-2 border border-[color:var(--c2)]/50 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c2)] transition-colors hover:bg-[color:var(--c2)]/10"
            >
              <RotateCw size={13} /> Couldn&apos;t reach your coach. Try again
            </button>
          )}
        </div>
      </Frame>
    </motion.div>
  );
}
