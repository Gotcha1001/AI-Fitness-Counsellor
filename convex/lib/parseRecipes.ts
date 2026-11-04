// convex/lib/parseRecipes.ts — turns untrusted model text into validated, clamped recipes.
// The AI suggests; this file sets the guard rails (macro math, calorie cap, allergy filter).
import type { MealType, Recipe } from "./validators";

type Json = Record<string, unknown>;

const MIN_RECIPES = 3;
const MAX_RECIPES = 6;

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
function strList(x: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((item: unknown) => str(item, maxLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

function extractJsonObject(text: string): unknown {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?/gi, "");
  // try each "{" until one parses
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

function toMealType(x: unknown): MealType | null {
  const s = typeof x === "string" ? x.toLowerCase() : "";
  if (s.includes("breakfast")) return "breakfast";
  if (s.includes("lunch")) return "lunch";
  if (s.includes("dinner") || s.includes("supper")) return "dinner";
  if (s.includes("snack")) return "snack";
  return null;
}

const ALLERGY_STOPWORDS = new Set([
  "none",
  "nothing",
  "nil",
  "allergic",
  "allergy",
  "allergies",
  "allergen",
  "intolerant",
  "intolerance",
  "can",
  "eat",
  "and",
  "the",
  "any",
  "all",
  "not",
  "dont",
  "don",
  "but",
  "with",
  "from",
  "mild",
  "severe",
  "very",
  "too",
  "foods",
  "food",
  "also",
  "have",
  "has",
  "been",
  "only",
  "some",
  "avoid",
  "cannot",
]);

/** Words from the free-text allergy field that a recipe must not contain. */
export function allergyTerms(text: string): string[] {
  const words = text
    .toLowerCase()
    .split(/[^a-z\u00c0-\u024f]+/)
    .filter((w) => w.length >= 3 && !ALLERGY_STOPWORDS.has(w));
  const out = new Set<string>();
  for (const w of words) {
    out.add(w);
    if (w.length > 4 && w.endsWith("s")) out.add(w.slice(0, -1)); // peanuts -> peanut
  }
  return [...out];
}

export interface ParseRecipesOpts {
  /** A single serving should never be more than this (about 60% of the daily target). */
  maxKcalPerServing: number;
  allergyTerms: string[];
}

/** Returns at least 3 valid recipes, or null so the caller can retry. */
export function parseRecipes(
  text: string,
  opts: ParseRecipesOpts,
): Recipe[] | null {
  const root = extractJsonObject(text);
  if (!isRecord(root) || !Array.isArray(root.recipes)) return null;

  const out: Recipe[] = [];
  for (const raw of root.recipes as unknown[]) {
    if (!isRecord(raw)) continue;

    const title = str(raw.title, 80);
    const mealType = toMealType(raw.mealType);
    const ingredients = strList(raw.ingredients, 20, 120);
    const steps = strList(raw.steps, 12, 300);
    const protein = num(raw.proteinG);
    const carbs = num(raw.carbsG);
    const fat = num(raw.fatG);
    const statedKcal = num(raw.caloriesPerServing);
    if (!title || !mealType || ingredients.length < 2 || steps.length < 2)
      continue;
    if (
      protein === null ||
      carbs === null ||
      fat === null ||
      statedKcal === null
    )
      continue;

    const proteinG = Math.round(clamp(protein, 0, 150));
    const carbsG = Math.round(clamp(carbs, 0, 250));
    const fatG = Math.round(clamp(fat, 0, 120));

    // Models fudge calories. If they disagree with the macros by >25%, trust the macros.
    const macroKcal = 4 * proteinG + 4 * carbsG + 9 * fatG;
    let kcal = clamp(statedKcal, 50, 1500);
    if (macroKcal > 0 && Math.abs(kcal - macroKcal) / macroKcal > 0.25) {
      kcal = macroKcal;
    }
    kcal = Math.round(kcal);
    if (kcal > opts.maxKcalPerServing) continue;

    // Allergy guard: drop any recipe whose title or ingredients mention a listed allergen.
    const haystack = `${title} ${ingredients.join(" ")}`.toLowerCase();
    if (opts.allergyTerms.some((t) => haystack.includes(t))) continue;

    const tip = str(raw.tip, 200);
    out.push({
      title,
      mealType,
      description: str(raw.description, 220),
      prepMinutes: Math.round(clamp(num(raw.prepMinutes) ?? 10, 0, 240)),
      cookMinutes: Math.round(clamp(num(raw.cookMinutes) ?? 10, 0, 240)),
      servings: Math.round(clamp(num(raw.servings) ?? 1, 1, 8)),
      caloriesPerServing: kcal,
      proteinG,
      carbsG,
      fatG,
      ingredients,
      steps,
      ...(tip ? { tip } : {}),
    });
    if (out.length >= MAX_RECIPES) break;
  }
  return out.length >= MIN_RECIPES ? out : null;
}
