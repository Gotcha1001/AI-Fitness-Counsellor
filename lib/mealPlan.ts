// lib/mealPlan.ts — small pure helpers for the meal plan UI (no React, no Convex calls).
import type { MealDay, PlannedMeal } from "@/convex/lib/validators";

export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Weekday name of a date, Monday-first, matching the names the AI plan stores. */
export function weekdayName(d: Date = new Date()): string {
  return WEEKDAYS[(d.getDay() + 6) % 7];
}

/** Whole weeks that have passed since the plan was written (0 = first week). */
export function elapsedWeeks(startMs: number, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - startMs) / WEEK_MS));
}

export function mealsForDay(
  day: MealDay,
): { slot: MealSlot; meal: PlannedMeal }[] {
  const list: { slot: MealSlot; meal: PlannedMeal }[] = [
    { slot: "breakfast", meal: day.breakfast },
    { slot: "lunch", meal: day.lunch },
    { slot: "dinner", meal: day.dinner },
  ];
  if (day.snack) list.push({ slot: "snack", meal: day.snack });
  return list;
}

export interface Macros {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function dayMacros(day: MealDay): Macros {
  return mealsForDay(day).reduce<Macros>(
    (sum, { meal }) => ({
      calories: sum.calories + meal.calories,
      proteinG: sum.proteinG + meal.proteinG,
      carbsG: sum.carbsG + meal.carbsG,
      fatG: sum.fatG + meal.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export interface WeekSummary {
  avgKcal: number;
  avgProteinG: number;
  trainingDays: number;
  trainingMinutes: number;
}

export function weekSummary(days: MealDay[]): WeekSummary {
  const n = Math.max(days.length, 1);
  const kcal = days.reduce((s, d) => s + d.totalCalories, 0);
  const protein = days.reduce((s, d) => s + dayMacros(d).proteinG, 0);
  const training = days.filter((d) => d.workout.minutes > 0);
  return {
    avgKcal: Math.round(kcal / n),
    avgProteinG: Math.round(protein / n),
    trainingDays: training.length,
    trainingMinutes: training.reduce((s, d) => s + d.workout.minutes, 0),
  };
}
