// app/components/WeightChart.tsx — dependency-free SVG line chart.
// Neon look: glowing accent line, gradient fill and HUD grid. Must render
// inside a `.cp` container (CyberShell) so --c1 / --c2 are defined.
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
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--cp-faint)]">
        {"// Your progress chart appears after your first monthly check-in."}
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
  const area = `${x(0)},${H - PAD} ${line} ${x(values.length - 1)},${H - PAD}`;
  const gridY = [0, 0.5, 1].map((t) => H - PAD - t * (H - 2 * PAD));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Weight over time"
    >
      <defs>
        <linearGradient id="wc-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--c1)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--c1)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="wc-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--c1)" />
          <stop offset="100%" stopColor="var(--c2)" />
        </linearGradient>
      </defs>

      {gridY.map((gy) => (
        <line
          key={gy}
          x1={PAD}
          x2={W - PAD}
          y1={gy}
          y2={gy}
          stroke="var(--cp-line)"
          strokeDasharray="3 4"
        />
      ))}

      <polygon points={area} fill="url(#wc-fill)" />

      <polyline
        points={line}
        fill="none"
        stroke="url(#wc-line)"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 5px var(--c1))" }}
      />

      {values.map((val, i) => (
        <g key={points[i].label}>
          <circle
            cx={x(i)}
            cy={y(val)}
            r={4.5}
            fill="var(--cp-bg)"
            stroke="var(--c1)"
            strokeWidth={2}
            style={{ filter: "drop-shadow(0 0 4px var(--c1))" }}
          />
          <text
            x={x(i)}
            y={y(val) - 10}
            textAnchor="middle"
            fontSize={11}
            fontWeight={700}
            className="fill-stone-100"
          >
            {val}
          </text>
          <text
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize={9}
            letterSpacing="1.5"
            className="fill-stone-500 font-mono"
          >
            {points[i].label.toUpperCase()}
          </text>
        </g>
      ))}
    </svg>
  );
}
