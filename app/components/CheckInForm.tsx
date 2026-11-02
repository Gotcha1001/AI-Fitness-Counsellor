// app/components/CheckInForm.tsx
"use client";

import { useState, type ReactNode } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { UnitSystem } from "@/convex/lib/validators";
import { lbToKg } from "@/lib/units";
import { HudLabel } from "@/app/components/Cyber";

interface CheckInFormProps {
  planId: Id<"plans">;
  month: number;
  unit: UnitSystem;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--c2)]"
    >
      {children}
    </label>
  );
}

function ScoreRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-2">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className="cp-opt flex h-11 w-11 items-center justify-center !p-0 font-mono text-sm font-bold text-[color:var(--cp-muted)] aria-pressed:text-[color:var(--c1)]"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckInForm({ planId, month, unit }: CheckInFormProps) {
  const submit = useMutation(api.checkIns.submit);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [energy, setEnergy] = useState(3);
  const [adherence, setAdherence] = useState(3);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const w = Number(weight);
    if (!Number.isFinite(w) || w <= 0) {
      toast.error("Enter your current weight.");
      return;
    }
    const waistNum = waist.trim() === "" ? undefined : Number(waist);
    if (waistNum !== undefined && !Number.isFinite(waistNum)) {
      toast.error("Waist must be a number.");
      return;
    }
    setSaving(true);
    try {
      await submit({
        planId,
        weightKg: unit === "metric" ? w : lbToKg(w),
        ...(waistNum !== undefined ? { waistCm: waistNum } : {}),
        energy,
        adherence,
        notes,
      });
      toast.success("Check-in saved — your coach is writing feedback…");
      setWeight("");
      setWaist("");
      setNotes("");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Couldn't save your check-in.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <HudLabel>{`// MONTH ${month}`}</HudLabel>
        <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-[color:var(--cp-fg)]">
          Month {month} check-in
        </h3>
        <div
          className="mt-3 h-px w-24"
          style={{ background: "linear-gradient(90deg,var(--c1),transparent)" }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel htmlFor="weight">
            Current weight ({unit === "metric" ? "kg" : "lb"})
          </FieldLabel>
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            className="cp-input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <FieldLabel htmlFor="waist">Waist in cm (optional)</FieldLabel>
          <input
            id="waist"
            type="number"
            inputMode="decimal"
            className="cp-input"
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
          />
        </div>
      </div>

      <ScoreRow
        label="Energy this month (1 = drained, 5 = great)"
        value={energy}
        onChange={setEnergy}
      />
      <ScoreRow
        label="How well did you stick to the plan? (1–5)"
        value={adherence}
        onChange={setAdherence}
      />

      <div className="space-y-2">
        <FieldLabel htmlFor="notes">
          Anything your coach should know?
        </FieldLabel>
        <textarea
          id="notes"
          rows={3}
          maxLength={1000}
          className="cp-input resize-none"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Wins, struggles, injuries, travel, cravings…"
        />
      </div>

      <span className="cp-glow inline-block">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="cp-btn px-8 py-3 text-sm"
        >
          {saving ? "Saving…" : "Submit check-in"}
        </button>
      </span>
    </div>
  );
}
