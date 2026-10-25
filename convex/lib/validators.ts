// convex/lib/validators.ts
// Single source of truth: Convex validators -> TypeScript types (no `any`).
import { v, type Infer } from "convex/values";

export const goalValidator = v.union(
  v.literal("lose_fat"),
  v.literal("build_muscle"),
  v.literal("lean_tone"),
  v.literal("maintain"),
);
export const sexValidator = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("other"),
);
export const activityValidator = v.union(
  v.literal("sedentary"),
  v.literal("light"),
  v.literal("moderate"),
  v.literal("active"),
);
export const experienceValidator = v.union(
  v.literal("beginner"),
  v.literal("intermediate"),
  v.literal("advanced"),
);
export const equipmentValidator = v.union(
  v.literal("none"),
  v.literal("home_basic"),
  v.literal("full_gym"),
);
export const dietValidator = v.union(
  v.literal("no_preference"),
  v.literal("vegetarian"),
  v.literal("vegan"),
  v.literal("pescatarian"),
  v.literal("halal"),
  v.literal("low_carb"),
);
export const unitValidator = v.union(
  v.literal("metric"),
  v.literal("imperial"),
);
export const statusValidator = v.union(
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed"),
);

/** Everything the user tells us during onboarding (weights always stored in kg, height in cm). */
export const profileFields = {
  unitSystem: unitValidator,
  age: v.number(),
  sex: sexValidator,
  heightCm: v.number(),
  currentWeightKg: v.number(),
  targetWeightKg: v.optional(v.number()),
  goal: goalValidator,
  activityLevel: activityValidator,
  experience: experienceValidator,
  equipment: equipmentValidator,
  daysPerWeek: v.number(),
  minutesPerSession: v.number(),
  dietPreference: dietValidator,
  mealsPerDay: v.number(),
  eatingHabits: v.string(),
  typicalDay: v.string(),
  allergies: v.string(),
  injuries: v.string(),
};
export const profileInputValidator = v.object(profileFields);

// ---- AI generated 6-month plan ----
export const workoutValidator = v.object({
  day: v.string(),
  title: v.string(),
  minutes: v.number(),
  details: v.string(),
});
export const monthValidator = v.object({
  month: v.number(),
  focus: v.string(),
  nutritionNotes: v.string(),
  targetWeightKg: v.number(),
  workouts: v.array(workoutValidator), // a typical week for that month
});
export const planContentValidator = v.object({
  summary: v.string(),
  dailyCalories: v.number(),
  proteinG: v.number(),
  carbsG: v.number(),
  fatG: v.number(),
  foodsToEat: v.array(v.string()),
  foodsToAvoid: v.array(v.string()),
  dailyHabits: v.array(v.string()),
  months: v.array(monthValidator),
});

export type ProfileInput = Infer<typeof profileInputValidator>;
export type PlanContent = Infer<typeof planContentValidator>;
export type PlanMonth = Infer<typeof monthValidator>;
export type Goal = Infer<typeof goalValidator>;
export type Sex = Infer<typeof sexValidator>;
export type ActivityLevel = Infer<typeof activityValidator>;
export type Experience = Infer<typeof experienceValidator>;
export type Equipment = Infer<typeof equipmentValidator>;
export type DietPreference = Infer<typeof dietValidator>;
export type UnitSystem = Infer<typeof unitValidator>;
