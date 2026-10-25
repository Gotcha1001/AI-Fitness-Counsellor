// convex/lib/nutrition.ts — safe, boring math. The AI suggests; this file sets the guard rails.
import type { ActivityLevel, Goal, ProfileInput, Sex } from "./validators";

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

/** Mifflin-St Jeor. */
export function bmr(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

export function tdee(
  p: Pick<
    ProfileInput,
    "sex" | "currentWeightKg" | "heightCm" | "age" | "activityLevel"
  >,
): number {
  return Math.round(
    bmr(p.sex, p.currentWeightKg, p.heightCm, p.age) *
      ACTIVITY_FACTOR[p.activityLevel],
  );
}

/** Never let a plan go below these, whatever the model says. */
export function calorieFloor(sex: Sex): number {
  if (sex === "male") return 1500;
  if (sex === "female") return 1200;
  return 1350;
}

export function suggestedCalories(
  goal: Goal,
  maintenance: number,
  sex: Sex,
): number {
  const delta: Record<Goal, number> = {
    lose_fat: -500,
    lean_tone: -250,
    maintain: 0,
    build_muscle: 250,
  };
  return Math.max(calorieFloor(sex), maintenance + delta[goal]);
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** Throws a user-friendly Error if the profile is out of range or unsafe. */
export function validateProfile(p: ProfileInput): void {
  const inRange = (n: number, lo: number, hi: number) =>
    Number.isFinite(n) && n >= lo && n <= hi;
  if (!inRange(p.age, 18, 80))
    throw new Error("This coach is for adults aged 18–80.");
  if (!inRange(p.heightCm, 120, 230))
    throw new Error("Height looks off — please check it.");
  if (!inRange(p.currentWeightKg, 30, 300))
    throw new Error("Weight looks off — please check it.");
  if (p.targetWeightKg !== undefined && !inRange(p.targetWeightKg, 30, 300)) {
    throw new Error("Target weight looks off — please check it.");
  }
  if (!inRange(p.daysPerWeek, 1, 7))
    throw new Error("Training days must be 1–7.");
  if (!inRange(p.minutesPerSession, 10, 180))
    throw new Error("Session length must be 10–180 minutes.");
  if (!inRange(p.mealsPerDay, 1, 8))
    throw new Error("Meals per day must be 1–8.");
  for (const text of [p.eatingHabits, p.typicalDay, p.allergies, p.injuries]) {
    if (text.length > 1000)
      throw new Error("Text answers must be under 1000 characters.");
  }
  if (p.goal === "lose_fat" && bmi(p.currentWeightKg, p.heightCm) < 18.5) {
    throw new Error(
      "Your BMI is already in the underweight range, so a fat-loss plan wouldn't be safe. Pick “maintain” or “build muscle”, or speak to a doctor.",
    );
  }
}
