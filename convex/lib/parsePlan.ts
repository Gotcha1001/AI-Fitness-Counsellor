// convex/lib/parsePlan.ts — turns untrusted model text into a validated, clamped PlanContent.
import type { PlanContent, PlanMonth } from "./validators";

type Json = Record<string, unknown>;

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
function strList(x: unknown, maxItems: number): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((item: unknown) => str(item, 200))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    return parsed;
  } catch {
    return null;
  }
}

export function parsePlan(
  text: string,
  opts: { calorieFloor: number; startWeightKg: number },
): PlanContent | null {
  const root = extractJsonObject(text);
  if (!isRecord(root)) return null;

  const rawMonths = root.months;
  if (!Array.isArray(rawMonths) || rawMonths.length < 6) return null;

  const months: PlanMonth[] = [];
  for (let i = 0; i < 6; i++) {
    const m: unknown = rawMonths[i];
    if (!isRecord(m)) return null;
    const rawWorkouts: unknown[] = Array.isArray(m.workouts) ? m.workouts : [];
    const workouts = rawWorkouts
      .slice(0, 7)
      .flatMap((w: unknown, idx: number) => {
        if (!isRecord(w)) return [];
        const minutes = num(w.minutes);
        const title = str(w.title, 80);
        if (minutes === null || !title) return [];
        return [
          {
            day: str(w.day, 20) || `Day ${idx + 1}`,
            title,
            minutes: Math.round(clamp(minutes, 5, 180)),
            details: str(w.details, 400),
          },
        ];
      });
    const target = num(m.targetWeightKg);
    if (workouts.length === 0 || target === null) return null;
    months.push({
      month: i + 1,
      focus: str(m.focus, 160),
      nutritionNotes: str(m.nutritionNotes, 500),
      // Sanity band: never more than -20% / +15% of starting weight.
      targetWeightKg: round1(
        clamp(target, opts.startWeightKg * 0.8, opts.startWeightKg * 1.15),
      ),
      workouts,
    });
  }

  const calories = num(root.dailyCalories);
  const protein = num(root.proteinG);
  const carbs = num(root.carbsG);
  const fat = num(root.fatG);
  if (calories === null || protein === null || carbs === null || fat === null)
    return null;

  const foodsToEat = strList(root.foodsToEat, 20);
  const foodsToAvoid = strList(root.foodsToAvoid, 20);
  const summary = str(root.summary, 600);
  if (!summary || foodsToEat.length === 0 || foodsToAvoid.length === 0)
    return null;

  return {
    summary,
    dailyCalories: Math.round(clamp(calories, opts.calorieFloor, 5000)),
    proteinG: Math.round(clamp(protein, 20, 400)),
    carbsG: Math.round(clamp(carbs, 20, 700)),
    fatG: Math.round(clamp(fat, 20, 250)),
    foodsToEat,
    foodsToAvoid,
    dailyHabits: strList(root.dailyHabits, 8),
    months,
  };
}
