// app/components/OnboardingWizard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type {
  ActivityLevel,
  DietPreference,
  Equipment,
  Experience,
  Goal,
  ProfileInput,
  Sex,
  UnitSystem,
} from "@/convex/lib/validators";
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/units";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FormState {
  unit: UnitSystem;
  age: string;
  sex: Sex;
  height: string; // cm
  feet: string;
  inches: string;
  weight: string; // kg or lb depending on unit
  targetWeight: string;
  goal: Goal;
  activityLevel: ActivityLevel;
  experience: Experience;
  equipment: Equipment;
  daysPerWeek: number;
  minutesPerSession: number;
  dietPreference: DietPreference;
  mealsPerDay: number;
  eatingHabits: string;
  typicalDay: string;
  allergies: string;
  injuries: string;
}

const round1 = (n: number) => String(Math.round(n * 10) / 10);

function initialState(p?: Doc<"profiles">): FormState {
  if (!p) {
    return {
      unit: "metric",
      age: "",
      sex: "male",
      height: "",
      feet: "",
      inches: "",
      weight: "",
      targetWeight: "",
      goal: "lose_fat",
      activityLevel: "light",
      experience: "beginner",
      equipment: "none",
      daysPerWeek: 3,
      minutesPerSession: 45,
      dietPreference: "no_preference",
      mealsPerDay: 3,
      eatingHabits: "",
      typicalDay: "",
      allergies: "",
      injuries: "",
    };
  }
  const imperial = p.unitSystem === "imperial";
  const ftIn = cmToFtIn(p.heightCm);
  return {
    unit: p.unitSystem,
    age: String(p.age),
    sex: p.sex,
    height: round1(p.heightCm),
    feet: String(ftIn.feet),
    inches: String(ftIn.inches),
    weight: round1(imperial ? kgToLb(p.currentWeightKg) : p.currentWeightKg),
    targetWeight:
      p.targetWeightKg === undefined
        ? ""
        : round1(imperial ? kgToLb(p.targetWeightKg) : p.targetWeightKg),
    goal: p.goal,
    activityLevel: p.activityLevel,
    experience: p.experience,
    equipment: p.equipment,
    daysPerWeek: p.daysPerWeek,
    minutesPerSession: p.minutesPerSession,
    dietPreference: p.dietPreference,
    mealsPerDay: p.mealsPerDay,
    eatingHabits: p.eatingHabits,
    typicalDay: p.typicalDay,
    allergies: p.allergies,
    injuries: p.injuries,
  };
}

type ParseResult =
  | { ok: true; input: ProfileInput }
  | { ok: false; error: string };

function toInput(f: FormState): ParseResult {
  const age = Number(f.age);
  const heightCm =
    f.unit === "metric"
      ? Number(f.height)
      : ftInToCm(Number(f.feet), Number(f.inches || 0));
  const w = Number(f.weight);
  const weightKg = f.unit === "metric" ? w : lbToKg(w);
  if (!f.age || !Number.isFinite(age))
    return { ok: false, error: "Enter your age." };
  if (!Number.isFinite(heightCm) || heightCm <= 0)
    return { ok: false, error: "Enter your height." };
  if (!f.weight || !Number.isFinite(weightKg) || weightKg <= 0)
    return { ok: false, error: "Enter your current weight." };

  let targetKg: number | undefined;
  if (f.targetWeight.trim() !== "") {
    const t = Number(f.targetWeight);
    if (!Number.isFinite(t) || t <= 0)
      return { ok: false, error: "Target weight must be a number." };
    targetKg = f.unit === "metric" ? t : lbToKg(t);
  }
  return {
    ok: true,
    input: {
      unitSystem: f.unit,
      age,
      sex: f.sex,
      heightCm: Math.round(heightCm * 10) / 10,
      currentWeightKg: Math.round(weightKg * 10) / 10,
      ...(targetKg !== undefined
        ? { targetWeightKg: Math.round(targetKg * 10) / 10 }
        : {}),
      goal: f.goal,
      activityLevel: f.activityLevel,
      experience: f.experience,
      equipment: f.equipment,
      daysPerWeek: f.daysPerWeek,
      minutesPerSession: f.minutesPerSession,
      dietPreference: f.dietPreference,
      mealsPerDay: f.mealsPerDay,
      eatingHabits: f.eatingHabits.trim(),
      typicalDay: f.typicalDay.trim(),
      allergies: f.allergies.trim(),
      injuries: f.injuries.trim(),
    },
  };
}

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

function OptionGrid<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-xl border p-3 text-left transition ${
            value === o.value
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
              : "border-gray-200 dark:border-gray-800 hover:border-emerald-400"
          }`}
        >
          <p className="text-sm font-semibold text-black dark:text-white">
            {o.label}
          </p>
          {o.hint && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{o.hint}</p>
          )}
        </button>
      ))}
    </div>
  );
}

function NumberChips({
  value,
  options,
  onChange,
  suffix,
}: {
  value: number;
  options: number[];
  onChange: (n: number) => void;
  suffix: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded-full border px-4 py-1.5 text-sm ${
            value === n
              ? "bg-emerald-600 border-emerald-600 text-white"
              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200"
          }`}
        >
          {n}
          {suffix}
        </button>
      ))}
    </div>
  );
}

const STEP_TITLES = [
  "About you",
  "Your goal",
  "Training",
  "Eating habits",
] as const;

export function OnboardingWizard({ initial }: { initial?: Doc<"profiles"> }) {
  const router = useRouter();
  const upsert = useMutation(api.profiles.upsert);
  const requestPlan = useMutation(api.plans.requestPlan);
  const editing = initial !== undefined;

  const [form, setForm] = useState<FormState>(() => initialState(initial));
  const [step, setStep] = useState(0);
  const [regenerate, setRegenerate] = useState(true);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    const parsed = toInput(form);
    if (!parsed.ok) {
      toast.error(parsed.error);
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      await upsert({ input: parsed.input });
      if (!editing || regenerate) {
        await requestPlan({});
        toast.success("Your coach is building your plan…");
        router.push("/plan");
      } else {
        toast.success("Profile saved.");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const wUnit = form.unit === "metric" ? "kg" : "lb";
  const isLast = step === STEP_TITLES.length - 1;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-black text-black dark:text-white">
          {editing ? "Your profile" : "Let’s build your plan"}
        </h1>
        <p className="text-sm text-gray-500">
          Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800">
          <div
            className="h-1.5 rounded-full bg-emerald-500 transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {step === 0 && (
            <>
              <div className="flex gap-2">
                {(["metric", "imperial"] as const).map((u) => (
                  <Button
                    key={u}
                    type="button"
                    variant={form.unit === u ? "default" : "outline"}
                    onClick={() => set("unit", u)}
                  >
                    {u === "metric" ? "kg / cm" : "lb / ft-in"}
                  </Button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    inputMode="numeric"
                    value={form.age}
                    onChange={(e) => set("age", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sex (used for calorie maths)</Label>
                  <OptionGrid<Sex>
                    value={form.sex}
                    onChange={(v) => set("sex", v)}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other / prefer not to say" },
                    ]}
                  />
                </div>
                {form.unit === "metric" ? (
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      inputMode="decimal"
                      value={form.height}
                      onChange={(e) => set("height", e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="feet">Feet</Label>
                      <Input
                        id="feet"
                        type="number"
                        inputMode="numeric"
                        value={form.feet}
                        onChange={(e) => set("feet", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inches">Inches</Label>
                      <Input
                        id="inches"
                        type="number"
                        inputMode="numeric"
                        value={form.inches}
                        onChange={(e) => set("inches", e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="weight">Current weight ({wUnit})</Label>
                  <Input
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    value={form.weight}
                    onChange={(e) => set("weight", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>What do you want to do?</Label>
                <OptionGrid<Goal>
                  value={form.goal}
                  onChange={(v) => set("goal", v)}
                  options={[
                    {
                      value: "lose_fat",
                      label: "🔥 Get thinner",
                      hint: "Lose body fat steadily",
                    },
                    {
                      value: "lean_tone",
                      label: "✨ Get leaner",
                      hint: "Tone up, lose a little fat",
                    },
                    {
                      value: "build_muscle",
                      label: "💪 Build muscle",
                      hint: "Gain size and strength",
                    },
                    {
                      value: "maintain",
                      label: "⚖️ Stay fit",
                      hint: "Maintain weight, feel better",
                    },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">
                  Goal weight in {wUnit} (optional)
                </Label>
                <Input
                  id="target"
                  type="number"
                  inputMode="decimal"
                  value={form.targetWeight}
                  onChange={(e) => set("targetWeight", e.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Daily activity outside workouts</Label>
                <OptionGrid<ActivityLevel>
                  value={form.activityLevel}
                  onChange={(v) => set("activityLevel", v)}
                  options={[
                    {
                      value: "sedentary",
                      label: "Mostly sitting",
                      hint: "Desk job, little walking",
                    },
                    {
                      value: "light",
                      label: "Lightly active",
                      hint: "Some walking",
                    },
                    {
                      value: "moderate",
                      label: "Moderately active",
                      hint: "On your feet a lot",
                    },
                    {
                      value: "active",
                      label: "Very active",
                      hint: "Physical job / lots of movement",
                    },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Training experience</Label>
                <OptionGrid<Experience>
                  value={form.experience}
                  onChange={(v) => set("experience", v)}
                  options={[
                    { value: "beginner", label: "Beginner" },
                    { value: "intermediate", label: "Intermediate" },
                    { value: "advanced", label: "Advanced" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Equipment you have</Label>
                <OptionGrid<Equipment>
                  value={form.equipment}
                  onChange={(v) => set("equipment", v)}
                  options={[
                    { value: "none", label: "None", hint: "Bodyweight only" },
                    {
                      value: "home_basic",
                      label: "Home basics",
                      hint: "Dumbbells, bands",
                    },
                    { value: "full_gym", label: "Full gym" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Days per week you can train</Label>
                <NumberChips
                  value={form.daysPerWeek}
                  onChange={(n) => set("daysPerWeek", n)}
                  options={[1, 2, 3, 4, 5, 6, 7]}
                  suffix=""
                />
              </div>
              <div className="space-y-2">
                <Label>Minutes per session</Label>
                <NumberChips
                  value={form.minutesPerSession}
                  onChange={(n) => set("minutesPerSession", n)}
                  options={[20, 30, 45, 60, 90]}
                  suffix=" min"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="injuries">
                  Injuries or limitations (optional)
                </Label>
                <Textarea
                  id="injuries"
                  rows={2}
                  maxLength={1000}
                  value={form.injuries}
                  onChange={(e) => set("injuries", e.target.value)}
                  placeholder="e.g. bad left knee, lower-back pain"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Diet preference</Label>
                <OptionGrid<DietPreference>
                  value={form.dietPreference}
                  onChange={(v) => set("dietPreference", v)}
                  options={[
                    { value: "no_preference", label: "No preference" },
                    { value: "vegetarian", label: "Vegetarian" },
                    { value: "vegan", label: "Vegan" },
                    { value: "pescatarian", label: "Pescatarian" },
                    { value: "halal", label: "Halal" },
                    { value: "low_carb", label: "Low carb" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>Meals per day</Label>
                <NumberChips
                  value={form.mealsPerDay}
                  onChange={(n) => set("mealsPerDay", n)}
                  options={[2, 3, 4, 5, 6]}
                  suffix=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="habits">
                  How would you describe your eating habits?
                </Label>
                <Textarea
                  id="habits"
                  rows={2}
                  maxLength={1000}
                  value={form.eatingHabits}
                  onChange={(e) => set("eatingHabits", e.target.value)}
                  placeholder="e.g. skip breakfast, snack at night, lots of takeaways, drink soda daily"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="typical">
                  What do you eat on a typical day?
                </Label>
                <Textarea
                  id="typical"
                  rows={3}
                  maxLength={1000}
                  value={form.typicalDay}
                  onChange={(e) => set("typicalDay", e.target.value)}
                  placeholder="Breakfast, lunch, dinner, snacks, drinks…"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">
                  Allergies or foods you can&apos;t/won&apos;t eat (optional)
                </Label>
                <Input
                  id="allergies"
                  maxLength={1000}
                  value={form.allergies}
                  onChange={(e) => set("allergies", e.target.value)}
                />
              </div>
              {editing && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={regenerate}
                    onChange={(e) => setRegenerate(e.target.checked)}
                  />
                  Generate a fresh 6-month plan with these changes (restarts
                  your check-in schedule)
                </label>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          disabled={step === 0 || saving}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        {isLast ? (
          <Button
            disabled={saving}
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Build my plan →"}
          </Button>
        ) : (
          <Button
            onClick={() => setStep((s) => s + 1)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
