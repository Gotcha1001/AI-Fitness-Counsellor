// convex/lib/parseMealPlan.ts — turns untrusted model text into ONE validated week.
// The AI suggests; this file sets the guard rails (7 days, portions on every food,
// macro math, daily calorie band, allergy filter). Returns null so the caller can retry.
import type { DayWorkout, MealDay, MealWeek, PlannedMeal } from "./validators";

type Json = Record<string, unknown>;

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function isRecord(x: unknown): x is Json {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function str(x: unknown, max: number): string {
  return typeof x === "string" ? x.trim().slice(0, max) : "";
}
function num(x: unknown): number | null {
  const n = typeof x === "number" ? x : typeof x === "string" ? Number(x) : NaN;
  return Number.isFinite(n) ? n : null;
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

function extractJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "");
  for (
    let i = cleaned.indexOf("{");
    i !== -1;
    i = cleaned.indexOf("{", i + 1)
  ) {
    const end = cleaned.lastIndexOf("}");
    if (end <= i) break;
    try {
      return JSON.parse(cleaned.slice(i, end + 1));
    } catch {}
  }
  return null;
}

function parseMeal(raw: unknown): PlannedMeal | null {
  if (!isRecord(raw)) return null;
  const name = str(raw.name, 80);
  const rawItems: unknown[] = Array.isArray(raw.items) ? raw.items : [];
  // Every food MUST have a portion — that's the whole point of this page.
  const items = rawItems
    .flatMap((it: unknown) => {
      if (!isRecord(it)) return [];
      const food = str(it.food, 80);
      const portion = str(it.portion, 40);
      return food && portion ? [{ food, portion }] : [];
    })
    .slice(0, 8);
  const protein = num(raw.proteinG);
  const carbs = num(raw.carbsG);
  const fat = num(raw.fatG);
  const statedKcal = num(raw.calories);
  if (!name || items.length === 0) return null;
  if (protein === null || carbs === null || fat === null || statedKcal === null)
    return null;

  const proteinG = Math.round(clamp(protein, 0, 150));
  const carbsG = Math.round(clamp(carbs, 0, 250));
  const fatG = Math.round(clamp(fat, 0, 120));
  // Models fudge calories. If they disagree with the macros by >25%, trust the macros.
  const macroKcal = 4 * proteinG + 4 * carbsG + 9 * fatG;
  let calories = clamp(statedKcal, 30, 1500);
  if (macroKcal > 0 && Math.abs(calories - macroKcal) / macroKcal > 0.25) {
    calories = macroKcal;
  }
  return {
    name,
    items,
    calories: Math.round(calories),
    proteinG,
    carbsG,
    fatG,
  };
}

function parseWorkout(raw: unknown): DayWorkout {
  const rest: DayWorkout = {
    title: "Rest day",
    minutes: 0,
    details: "Rest, or a light walk and some stretching.",
  };
  if (!isRecord(raw)) return rest;
  const title = str(raw.title, 80);
  const minutes = num(raw.minutes);
  if (!title || minutes === null) return rest;
  if (minutes <= 0 || /^rest/i.test(title)) {
    return { ...rest, details: str(raw.details, 300) || rest.details };
  }
  return {
    title,
    minutes: Math.round(clamp(minutes, 5, 180)),
    details: str(raw.details, 400),
  };
}

export interface ParseWeekOpts {
  week: number;
  wantSnack: boolean;
  /** A day must land inside this band (roughly 70%..130% of the daily target). */
  minDayKcal: number;
  maxDayKcal: number;
  allergyTerms: string[];
}

export function parseWeek(text: string, opts: ParseWeekOpts): MealWeek | null {
  const root = extractJsonObject(text);
  if (!isRecord(root) || !Array.isArray(root.days) || root.days.length < 7)
    return null;

  const days: MealDay[] = [];
  const haystack: string[] = [];

  for (let i = 0; i < 7; i++) {
    const d: unknown = root.days[i];
    if (!isRecord(d)) return null;
    const breakfast = parseMeal(d.breakfast);
    const lunch = parseMeal(d.lunch);
    const dinner = parseMeal(d.dinner);
    if (!breakfast || !lunch || !dinner) return null;
    const snack = opts.wantSnack ? parseMeal(d.snack) : null;

    const meals = [breakfast, lunch, dinner, ...(snack ? [snack] : [])];
    const totalCalories = meals.reduce((s, m) => s + m.calories, 0);
    if (totalCalories < opts.minDayKcal || totalCalories > opts.maxDayKcal)
      return null;

    for (const m of meals) {
      haystack.push(`${m.name} ${m.items.map((it) => it.food).join(" ")}`);
    }
    days.push({
      day: DAY_NAMES[i], // force the names so the UI never shows "Day 1"
      breakfast,
      lunch,
      dinner,
      ...(snack ? { snack } : {}),
      totalCalories,
      workout: parseWorkout(d.workout),
    });
  }

  // Allergy guard: reject the whole week if any listed allergen shows up.
  const hay = haystack.join(" ").toLowerCase();
  if (opts.allergyTerms.some((t) => hay.includes(t))) return null;

  return { week: opts.week, focus: str(root.focus, 160), days };
}
