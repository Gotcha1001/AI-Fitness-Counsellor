// app/components/CheckInForm.tsx
"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { UnitSystem } from "@/convex/lib/validators";
import { lbToKg } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CheckInFormProps {
  planId: Id<"plans">;
  month: number;
  unit: UnitSystem;
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
      <Label>{label}</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 w-10 rounded-full border text-sm font-semibold transition ${
              value === n
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-emerald-500"
            }`}
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
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-black dark:text-white">
        Month {month} check-in
      </h3>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="weight">
            Current weight ({unit === "metric" ? "kg" : "lb"})
          </Label>
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="waist">Waist in cm (optional)</Label>
          <Input
            id="waist"
            type="number"
            inputMode="decimal"
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
        <Label htmlFor="notes">Anything your coach should know?</Label>
        <Textarea
          id="notes"
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Wins, struggles, injuries, travel, cravings…"
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={saving}
        className="bg-emerald-600 hover:bg-emerald-500 text-white"
      >
        {saving ? "Saving…" : "Submit check-in"}
      </Button>
    </div>
  );
}
