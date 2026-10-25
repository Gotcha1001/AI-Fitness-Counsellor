// app/components/WeightChart.tsx — dependency-free SVG line chart.
"use client";

import type { UnitSystem } from "@/convex/lib/validators";
import { toDisplayWeight } from "@/lib/units";

export interface ChartPoint {
  label: string;
  kg: number;
}

export function WeightChart({
  points,
  unit,
}: {
  points: ChartPoint[];
  unit: UnitSystem;
}) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Your progress chart appears after your first monthly check-in.
      </p>
    );
  }
  const W = 400;
  const H = 170;
  const PAD = 28;
  const values = points.map((p) => toDisplayWeight(p.kg, unit));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (points.length - 1);
  const y = (val: number) => H - PAD - ((val - min) / span) * (H - 2 * PAD);
  const line = values.map((val, i) => `${x(i)},${y(val)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto text-emerald-500"
      role="img"
      aria-label="Weight over time"
    >
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {values.map((val, i) => (
        <g key={points[i].label}>
          <circle cx={x(i)} cy={y(val)} r={4.5} fill="currentColor" />
          <text
            x={x(i)}
            y={y(val) - 10}
            textAnchor="middle"
            fontSize={11}
            className="fill-gray-700 dark:fill-gray-200"
          >
            {val}
          </text>
          <text
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            className="fill-gray-400"
          >
            {points[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}
