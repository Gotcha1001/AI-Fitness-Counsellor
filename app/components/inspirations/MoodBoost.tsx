// app/components/inspirations/MoodBoost.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Mood } from "@/convex/lib/validators";
import { Frame, SectionHead } from "@/app/components/Cyber";

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: "motivated", emoji: "🔥", label: "Fired up" },
  { value: "okay", emoji: "🙂", label: "Okay" },
  { value: "tired", emoji: "😴", label: "Tired" },
  { value: "stressed", emoji: "😵‍💫", label: "Stressed" },
  { value: "discouraged", emoji: "😞", label: "Discouraged" },
  { value: "stuck", emoji: "🧱", label: "Stuck" },
];

const MAX_NOTE = 300;

export function MoodBoost({ dateKey }: { dateKey: string }) {
  const requestBoost = useMutation(api.inspirations.requestBoost);
  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!mood || busy) return;
    setBusy(true);
    try {
      await requestBoost({ dateKey, mood, note: note.trim() || undefined });
      setNote("");
      setMood(null);
      toast.success("Your coach is writing you a boost ✨");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <SectionHead code="BOOST" title="Need a boost right now?" />
      <Frame>
        <div className="space-y-4 p-5 sm:p-6">
          <p className="text-sm text-[color:var(--cp-muted)]">
            Tell your coach how you feel and get a message written for this
            exact moment.
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="How are you feeling?"
          >
            {MOODS.map((m) => {
              const active = mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMood(m.value)}
                  className={`border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${
                    active
                      ? "border-[color:var(--c1)] bg-[color:var(--c1)]/15 text-[color:var(--c1)]"
                      : "border-[color:var(--cp-line)] text-[color:var(--cp-muted)] hover:border-[color:var(--c2)]"
                  }`}
                >
                  <span className="mr-1.5">{m.emoji}</span>
                  {m.label}
                </button>
              );
            })}
          </div>
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
              rows={2}
              placeholder="Anything on your mind? (optional)"
              className="w-full resize-none border border-[color:var(--cp-line)] bg-transparent p-3 text-sm text-[color:var(--cp-fg)] outline-none focus:border-[color:var(--c2)]"
            />
            <p className="mt-1 text-right font-mono text-[10px] text-[color:var(--cp-faint)]">
              {note.length}/{MAX_NOTE}
            </p>
          </div>
          <button
            type="button"
            disabled={!mood || busy}
            onClick={submit}
            className="inline-flex items-center gap-2 bg-[color:var(--c1)] px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-black transition-opacity disabled:opacity-40"
          >
            <Sparkles size={14} /> {busy ? "Sending…" : "Give me a boost"}
          </button>
        </div>
      </Frame>
    </section>
  );
}
