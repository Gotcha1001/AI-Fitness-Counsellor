// lib/units.ts
import type { UnitSystem } from "@/convex/lib/validators";

const LB_PER_KG = 2.20462;

export const kgToLb = (kg: number): number => kg * LB_PER_KG;
export const lbToKg = (lb: number): number => lb / LB_PER_KG;
export const ftInToCm = (feet: number, inches: number): number =>
  (feet * 12 + inches) * 2.54;

export function cmToFtIn(cm: number): { feet: number; inches: number } {
  const total = cm / 2.54;
  let feet = Math.floor(total / 12);
  let inches = Math.round(total - feet * 12);
  if (inches === 12) {
    feet += 1;
    inches = 0;
  }
  return { feet, inches };
}

export function toDisplayWeight(kg: number, unit: UnitSystem): number {
  const value = unit === "metric" ? kg : kgToLb(kg);
  return Math.round(value * 10) / 10;
}

export function formatWeight(kg: number, unit: UnitSystem): string {
  return `${toDisplayWeight(kg, unit)} ${unit === "metric" ? "kg" : "lb"}`;
}

export function formatDelta(kg: number, unit: UnitSystem): string {
  const v = toDisplayWeight(Math.abs(kg), unit);
  const sign = kg > 0 ? "+" : kg < 0 ? "−" : "";
  return `${sign}${v} ${unit === "metric" ? "kg" : "lb"}`;
}
