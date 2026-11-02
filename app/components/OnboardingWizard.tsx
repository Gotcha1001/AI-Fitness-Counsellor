"use client";

import { useState, type ReactNode } from "react";
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
import { PlanGeneratingModal } from "@/app/components/PlanGeneratingModal";
import { CyberShell, Frame, HudLabel } from "@/app/components/Cyber";

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

// Keep these in sync with validateProfile() in convex/lib/nutrition.ts
const LIMITS = {
  age: [18, 80],
  heightCm: [120, 230],
  weightKg: [30, 300],
} as const;

const inRange = (n: number, [lo, hi]: readonly [number, number]) =>
  Number.isFinite(n) && n >= lo && n <= hi;

function parseHeightCm(f: FormState): number {
  if (f.unit === "metric") return Number(f.height);
  return ftInToCm(Number(f.feet), Number(f.inches || 0));
}

/** Validates everything on step 1 ("About you"). Returns an error or null. */
function validateAbout(f: FormState): string | null {
  const age = Number(f.age);
  if (!f.age.trim() || !Number.isFinite(age)) return "Enter your age.";
  if (!inRange(age, LIMITS.age)) return "This coach is for adults aged 18–80.";

  const heightCm = parseHeightCm(f);
  const hasHeight =
    f.unit === "metric" ? f.height.trim() !== "" : f.feet.trim() !== "";
  if (!hasHeight || !Number.isFinite(heightCm) || heightCm <= 0)
    return "Enter your height.";
  if (!inRange(heightCm, LIMITS.heightCm))
    return f.unit === "metric"
      ? "Height must be in centimetres, between 120 and 230 (e.g. 175 — not 1.75)."
      : "Height must be between 3 ft 11 in and 7 ft 6 in (e.g. 5 ft 9 in).";

  const w = Number(f.weight);
  const weightKg = f.unit === "metric" ? w : lbToKg(w);
  if (!f.weight.trim() || !Number.isFinite(weightKg) || weightKg <= 0)
    return "Enter your current weight.";
  if (!inRange(weightKg, LIMITS.weightKg))
    return f.unit === "metric"
      ? "Weight must be between 30 and 300 kg."
      : "Weight must be between 66 and 661 lb.";
  return null;
}

function toInput(f: FormState): ParseResult {
  const aboutError = validateAbout(f);
  if (aboutError) return { ok: false, error: aboutError };

  const age = Number(f.age);
  const heightCm = parseHeightCm(f);
  const w = Number(f.weight);
  const weightKg = f.unit === "metric" ? w : lbToKg(w);

  let targetKg: number | undefined;
  if (f.targetWeight.trim() !== "") {
    const t = Number(f.targetWeight);
    if (!Number.isFinite(t) || t <= 0)
      return { ok: false, error: "Target weight must be a number." };
    targetKg = f.unit === "metric" ? t : lbToKg(t);
    if (!inRange(targetKg, LIMITS.weightKg))
      return {
        ok: false,
        error:
          f.unit === "metric"
            ? "Goal weight must be between 30 and 300 kg."
            : "Goal weight must be between 66 and 661 lb.",
      };
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

/* ------------------------------ UI pieces ------------------------------ */

/** Mono HUD-style field label. */
function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="block font-mono text-[11px] uppercase tracking-[0.25em] text-[color:var(--c2)]"
      >
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-[color:var(--cp-faint)]">{hint}</p>}
    </div>
  );
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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="cp-opt"
        >
          <p className="text-sm font-bold text-[color:var(--cp-fg)]">
            {o.label}
          </p>
          {o.hint && (
            <p className="text-xs text-[color:var(--cp-muted)]">{o.hint}</p>
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
          aria-pressed={value === n}
          onClick={() => onChange(n)}
          className="cp-tab"
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
      toast.error(parsed.error); // Goal-weight problems live on step 2; everything else on step 1.
      setStep(/goal weight/i.test(parsed.error) ? 1 : 0);
      return;
    }

    setSaving(true); // When we navigate to /plan we keep `saving` true, so the modal stays up
    // until the page changes and the plan page's own modal takes over.
    let navigating = false;
    try {
      await upsert({ input: parsed.input });
      if (!editing || regenerate) {
        await requestPlan({});
        toast.success("Your coach is building your plan…");
        navigating = true;
        router.push("/plan");
      } else {
        toast.success("Profile saved.");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg); // Server-side range errors: jump back to the step that has the field.
      if (/height|weight|aged 18/i.test(msg))
        setStep(/target weight/i.test(msg) ? 1 : 0);
    } finally {
      if (!navigating) setSaving(false);
    }
  }

  /** Switch units and convert what's already typed, so values never get misread. */
  function switchUnit(next: UnitSystem) {
    if (next === form.unit) return;
    setForm((prev) => {
      const out: FormState = { ...prev, unit: next };

      const cm =
        prev.unit === "metric"
          ? Number(prev.height)
          : ftInToCm(Number(prev.feet), Number(prev.inches || 0));
      const hasHeight =
        prev.unit === "metric"
          ? prev.height.trim() !== ""
          : prev.feet.trim() !== "";
      if (hasHeight && Number.isFinite(cm) && cm > 0) {
        if (next === "imperial") {
          const { feet, inches } = cmToFtIn(cm);
          out.feet = String(feet);
          out.inches = String(inches);
        } else {
          out.height = round1(cm);
        }
      }

      const convert = (v: string) => {
        const n = Number(v);
        if (v.trim() === "" || !Number.isFinite(n)) return v;
        return round1(next === "imperial" ? kgToLb(n) : lbToKg(n));
      };
      out.weight = convert(prev.weight);
      out.targetWeight = convert(prev.targetWeight);
      return out;
    });
  }

  function handleNext() {
    if (step === 0) {
      const err = validateAbout(form);
      if (err) {
        toast.error(err);
        return;
      }
    }
    setStep((s) => s + 1);
  }

  const wUnit = form.unit === "metric" ? "kg" : "lb";
  const isLast = step === STEP_TITLES.length - 1;
  const title = editing ? "Your profile" : "Let’s build your plan";
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <CyberShell>
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-10 lg:py-14">
        <PlanGeneratingModal open={saving && (!editing || regenerate)} />

        <div className="text-left">
          <div className="mb-4 inline-flex items-center gap-2 border border-[color:var(--c2)]/40 bg-[color:var(--c2)]/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--c2)]">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--c1)]"
              style={{ animation: "cp-blink 1.4s infinite" }}
            />
            {editing ? "SETTINGS // PROFILE" : "ONBOARDING // NEW PLAN"}
          </div>

          <h1 className="text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-5xl">
            <span
              className="cp-glitch text-[color:var(--cp-fg)]"
              data-text={title}
            >
              {title}
            </span>
          </h1>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[color:var(--cp-muted)]">
            Step {pad(step + 1)} / {pad(STEP_TITLES.length)} ·{" "}
            <span className="text-[color:var(--c1)]">{STEP_TITLES[step]}</span>
          </p>

          {/* segmented progress bar */}
          <div className="mt-3 flex gap-1.5">
            {STEP_TITLES.map((t, i) => (
              <div key={t} className="h-1.5 flex-1 bg-[var(--cp-line)]">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: i <= step ? "100%" : "0%",
                    background: "var(--c1)",
                    boxShadow: i <= step ? "0 0 10px var(--c1)" : undefined,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <Frame className="cp-glow">
          <div className="space-y-5 p-6">
            {step === 0 && (
              <>
                <div className="flex gap-2">
                  {(["metric", "imperial"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={form.unit === u}
                      onClick={() => switchUnit(u)}
                      className="cp-tab"
                    >
                      {u === "metric" ? "kg / cm" : "lb / ft-in"}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Age" htmlFor="age">
                    <input
                      id="age"
                      className="cp-input"
                      type="number"
                      inputMode="numeric"
                      value={form.age}
                      onChange={(e) => set("age", e.target.value)}
                    />
                  </Field>

                  <Field label="Sex (used for calorie maths)">
                    <OptionGrid<Sex>
                      value={form.sex}
                      onChange={(v) => set("sex", v)}
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other / prefer not to say" },
                      ]}
                    />
                  </Field>

                  {form.unit === "metric" ? (
                    <Field
                      label="Height (cm)"
                      htmlFor="height"
                      hint="In centimetres (120–230), not metres."
                    >
                      <input
                        id="height"
                        className="cp-input"
                        type="number"
                        inputMode="decimal"
                        placeholder="e.g. 175"
                        value={form.height}
                        onChange={(e) => set("height", e.target.value)}
                      />
                    </Field>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Feet" htmlFor="feet">
                        <input
                          id="feet"
                          className="cp-input"
                          type="number"
                          inputMode="numeric"
                          value={form.feet}
                          onChange={(e) => set("feet", e.target.value)}
                        />
                      </Field>
                      <Field label="Inches" htmlFor="inches">
                        <input
                          id="inches"
                          className="cp-input"
                          type="number"
                          inputMode="numeric"
                          value={form.inches}
                          onChange={(e) => set("inches", e.target.value)}
                        />
                      </Field>
                    </div>
                  )}

                  <Field label={`Current weight (${wUnit})`} htmlFor="weight">
                    <input
                      id="weight"
                      className="cp-input"
                      type="number"
                      inputMode="decimal"
                      value={form.weight}
                      onChange={(e) => set("weight", e.target.value)}
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="What do you want to do?">
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
                </Field>

                <Field
                  label={`Goal weight in ${wUnit} (optional)`}
                  htmlFor="target"
                >
                  <input
                    id="target"
                    className="cp-input"
                    type="number"
                    inputMode="decimal"
                    value={form.targetWeight}
                    onChange={(e) => set("targetWeight", e.target.value)}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Daily activity outside workouts">
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
                </Field>

                <Field label="Training experience">
                  <OptionGrid<Experience>
                    value={form.experience}
                    onChange={(v) => set("experience", v)}
                    options={[
                      { value: "beginner", label: "Beginner" },
                      { value: "intermediate", label: "Intermediate" },
                      { value: "advanced", label: "Advanced" },
                    ]}
                  />
                </Field>

                <Field label="Equipment you have">
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
                </Field>

                <Field label="Days per week you can train">
                  <NumberChips
                    value={form.daysPerWeek}
                    onChange={(n) => set("daysPerWeek", n)}
                    options={[1, 2, 3, 4, 5, 6, 7]}
                    suffix=""
                  />
                </Field>

                <Field label="Minutes per session">
                  <NumberChips
                    value={form.minutesPerSession}
                    onChange={(n) => set("minutesPerSession", n)}
                    options={[20, 30, 45, 60, 90]}
                    suffix=" min"
                  />
                </Field>

                <Field
                  label="Injuries or limitations (optional)"
                  htmlFor="injuries"
                >
                  <textarea
                    id="injuries"
                    className="cp-input"
                    rows={2}
                    maxLength={1000}
                    value={form.injuries}
                    onChange={(e) => set("injuries", e.target.value)}
                    placeholder="e.g. bad left knee, lower-back pain"
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Diet preference">
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
                </Field>

                <Field label="Meals per day">
                  <NumberChips
                    value={form.mealsPerDay}
                    onChange={(n) => set("mealsPerDay", n)}
                    options={[2, 3, 4, 5, 6]}
                    suffix=""
                  />
                </Field>

                <Field
                  label="How would you describe your eating habits?"
                  htmlFor="habits"
                >
                  <textarea
                    id="habits"
                    className="cp-input"
                    rows={2}
                    maxLength={1000}
                    value={form.eatingHabits}
                    onChange={(e) => set("eatingHabits", e.target.value)}
                    placeholder="e.g. skip breakfast, snack at night, lots of takeaways, drink soda daily"
                  />
                </Field>

                <Field
                  label="What do you eat on a typical day?"
                  htmlFor="typical"
                >
                  <textarea
                    id="typical"
                    className="cp-input"
                    rows={3}
                    maxLength={1000}
                    value={form.typicalDay}
                    onChange={(e) => set("typicalDay", e.target.value)}
                    placeholder="Breakfast, lunch, dinner, snacks, drinks…"
                  />
                </Field>

                <Field
                  label="Allergies or foods you can't/won't eat (optional)"
                  htmlFor="allergies"
                >
                  <input
                    id="allergies"
                    className="cp-input"
                    maxLength={1000}
                    value={form.allergies}
                    onChange={(e) => set("allergies", e.target.value)}
                  />
                </Field>

                {editing && (
                  <label className="flex items-start gap-3 border border-[color:var(--cp-line)] bg-[var(--cp-tint)] p-3 text-sm text-[color:var(--cp-muted)]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      style={{ accentColor: "var(--c1)" }}
                      checked={regenerate}
                      onChange={(e) => setRegenerate(e.target.checked)}
                    />
                    <span>
                      Generate a fresh 6-month plan with these changes (restarts
                      your check-in schedule)
                    </span>
                  </label>
                )}
              </>
            )}
          </div>
        </Frame>

        <div className="flex justify-between">
          <button
            type="button"
            className="cp-btn-ghost px-6 py-3 text-sm"
            disabled={step === 0 || saving}
            onClick={() => setStep((s) => s - 1)}
          >
            Back
          </button>

          <span className="cp-glow inline-block">
            {isLast ? (
              <button
                type="button"
                disabled={saving}
                onClick={handleSubmit}
                className="cp-btn px-8 py-3 text-sm"
              >
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Build my plan →"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="cp-btn px-8 py-3 text-sm"
              >
                Next
              </button>
            )}
          </span>
        </div>

        <HudLabel>{"// FIT COACH · PROFILE MODULE"}</HudLabel>
      </div>
    </CyberShell>
  );
}
