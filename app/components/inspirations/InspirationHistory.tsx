// app/components/inspirations/InspirationHistory.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { Frame, SectionHead } from "@/app/components/Cyber";

interface Props {
  items: Doc<"inspirations">[];
  todayId?: Id<"inspirations">;
  onToggleSave: (id: Id<"inspirations">) => void;
}

const MOOD_EMOJI: Record<NonNullable<Doc<"inspirations">["mood"]>, string> = {
  motivated: "🔥",
  okay: "🙂",
  tired: "😴",
  stressed: "😵‍💫",
  discouraged: "😞",
  stuck: "🧱",
};

export function InspirationHistory({ items, todayId, onToggleSave }: Props) {
  const [tab, setTab] = useState<"all" | "saved">("all");
  const visible = items
    .filter((i) => i._id !== todayId && i.message)
    .filter((i) => (tab === "saved" ? i.saved : true));

  return (
    <section>
      <SectionHead code="ARCHIVE" title="Past inspirations" />
      <div className="mb-4 flex gap-2">
        {(["all", "saved"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition-colors ${
              tab === t
                ? "border-[color:var(--c1)] bg-[color:var(--c1)]/15 text-[color:var(--c1)]"
                : "border-[color:var(--cp-line)] text-[color:var(--cp-muted)] hover:border-[color:var(--c2)]"
            }`}
          >
            {t === "all" ? "All" : "★ Saved"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-[color:var(--cp-muted)]">
          {tab === "saved"
            ? "Star a message to keep it here for the days you need it most."
            : "Your past messages will collect here."}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((i, idx) => (
            <motion.div
              key={i._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(idx * 0.05, 0.3) }}
            >
              <Frame>
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--cp-muted)]">
                      {i.dateKey}
                      {" · "}
                      <span className="text-[color:var(--c1)]">
                        {i.kind === "boost"
                          ? `boost ${i.mood ? MOOD_EMOJI[i.mood] : ""}`
                          : "daily"}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => onToggleSave(i._id)}
                      aria-label={i.saved ? "Remove from saved" : "Save"}
                      className="text-[color:var(--c2)] transition-colors hover:text-[color:var(--c1)]"
                    >
                      <Star
                        size={16}
                        fill={i.saved ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                  {i.note && (
                    <p className="text-xs italic text-[color:var(--cp-muted)]">
                      &ldquo;{i.note}&rdquo;
                    </p>
                  )}
                  <p className="whitespace-pre-wrap text-sm text-[color:var(--cp-fg)]">
                    {i.message}
                  </p>
                  {i.mantra && (
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.15em] text-[color:var(--c1)]">
                      {i.mantra}
                    </p>
                  )}
                </div>
              </Frame>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
