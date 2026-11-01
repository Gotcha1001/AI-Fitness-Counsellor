// app/(pages)/appearance/page.tsx   →   URL: /appearance
"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import {
  Ban,
  Binary,
  Check,
  CloudRain,
  Dumbbell,
  Heart,
  Loader2,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
} from "lucide-react";

import { useAppearance } from "@/app/context/AppearanceContext";
import {
  GRADIENT_ACCENT_LIST,
  RAIN_MODE_LIST,
  RANGE_LIMITS,
  SOLID_ACCENT_LIST,
  UI_SIZE_LIST,
  accentBackground,
  alpha,
  type AccentId,
  type AccentTheme,
  type RainMode,
} from "@/convex/lib/appearance";

const RAIN_ICONS: Record<RainMode, typeof Binary> = {
  code: Binary,
  hearts: Heart,
  neon: CloudRain,
  fit: Dumbbell,
  off: Ban,
};

/* ------------------------------ small pieces ------------------------------ */

interface CardProps {
  title: string;
  description: string;
  hex: string;
  children: ReactNode;
}

function Card({
  title,
  description,
  hex,
  children,
}: CardProps): React.JSX.Element {
  return (
    <section
      className="rounded-xl border bg-white p-6 dark:bg-gray-950"
      style={{
        borderColor: alpha(hex, 0.25),
        boxShadow: `0 0 24px -10px ${alpha(hex, 0.35)}`,
      }}
    >
      <h2 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-50">
        {title}
      </h2>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {children}
    </section>
  );
}

interface RangeRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  hex: string;
  disabled: boolean;
  onChange: (value: number) => void;
}

function RangeRow({
  id,
  label,
  value,
  min,
  max,
  hex,
  disabled,
  onChange,
}: RangeRowProps): React.JSX.Element {
  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <label htmlFor={id} className="text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <span className="font-mono text-xs tabular-nums" style={{ color: hex }}>
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer disabled:cursor-not-allowed"
        style={{ accentColor: hex }}
      />
    </div>
  );
}

interface ChoiceButtonProps {
  selected: boolean;
  hex: string;
  onClick: () => void;
  children: ReactNode;
}

/** A selectable tile used for theme, text size and rain style. */
function ChoiceButton({
  selected,
  hex,
  onClick,
  children,
}: ChoiceButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        borderColor: selected ? alpha(hex, 0.55) : alpha(hex, 0.15),
        backgroundColor: selected ? alpha(hex, 0.1) : undefined,
        boxShadow: selected ? `0 0 20px -6px ${alpha(hex, 0.55)}` : undefined,
        outlineColor: hex,
      }}
    >
      {children}
    </button>
  );
}

interface AccentGridProps {
  label: string;
  swatches: AccentTheme[];
  selected: AccentId;
  onSelect: (id: AccentId) => void;
  columns: string;
}

function AccentGrid({
  label,
  swatches,
  selected,
  onSelect,
  columns,
}: AccentGridProps): React.JSX.Element {
  const [hovered, setHovered] = useState<AccentId | null>(null);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid gap-3 ${columns}`}
    >
      {swatches.map((swatch) => {
        const isSelected = selected === swatch.id;
        const isHovered = hovered === swatch.id;
        const isGradient = swatch.kind === "gradient";
        return (
          <button
            key={swatch.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(swatch.id)}
            onMouseEnter={() => setHovered(swatch.id)}
            onMouseLeave={() => setHovered(null)}
            className="flex flex-col items-center gap-2 rounded-lg border p-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: isSelected
                ? alpha(swatch.hex400, 0.5)
                : isHovered
                  ? alpha(swatch.hex400, 0.25)
                  : "transparent",
              backgroundColor: isSelected
                ? alpha(swatch.hex400, 0.08)
                : undefined,
              boxShadow: isSelected
                ? `0 0 20px -4px ${alpha(swatch.hex400, 0.5)}`
                : undefined,
              outlineColor: swatch.hex400,
            }}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10"
              style={{
                background: accentBackground(swatch),
                boxShadow:
                  isSelected || isHovered
                    ? `0 0 14px 2px ${alpha(swatch.hex400, isSelected ? 0.65 : 0.45)}`
                    : "inset 0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              {isSelected && (
                <Check
                  className={
                    isGradient
                      ? "h-4 w-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.7)]"
                      : "h-4 w-4 text-black/70"
                  }
                  strokeWidth={3}
                />
              )}
            </span>
            <span
              className="text-center text-[11px] font-medium leading-tight text-gray-600 dark:text-gray-300"
              style={{
                color: isSelected || isHovered ? swatch.hex400 : undefined,
              }}
            >
              {swatch.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

const THEME_CHOICES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

// next-themes only knows the real theme after mount; this avoids a hydration
// mismatch without a setState-in-effect.
const subscribeNoop = (): (() => void) => () => {};

/* ---------------------------------- page ---------------------------------- */

export default function AppearancePage(): React.JSX.Element {
  const { appearance, theme, update, reset, isSaving } = useAppearance();
  const { theme: colorMode, setTheme } = useTheme();
  const { isSignedIn } = useUser();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const { hex400 } = theme;
  const rainOff = appearance.rainMode === "off";

  return (
    <div className="relative mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="accent-gradient-text text-2xl font-black tracking-tight"
            style={{ filter: `drop-shadow(0 0 16px ${alpha(hex400, 0.4)})` }}
          >
            Appearance
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose your colors, rain and text size. Changes apply right away
            {isSignedIn ? " and follow you across devices." : "."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSaving && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving
            </span>
          )}
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            style={{ borderColor: alpha(hex400, 0.35) }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset to defaults
          </button>
        </div>
      </div>

      {/* Accent color */}
      <Card
        title="Accent color"
        description="Used for buttons, highlights, progress bars, the sidebar and the rain. Gradients tint the sidebar and rain with several colors."
        hex={hex400}
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Solid
        </p>
        <AccentGrid
          label="Solid accent colors"
          swatches={SOLID_ACCENT_LIST}
          selected={appearance.accent}
          onSelect={(accent) => update({ accent })}
          columns="grid-cols-3 sm:grid-cols-6"
        />

        <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Gradients
        </p>
        <AccentGrid
          label="Gradient accent colors"
          swatches={GRADIENT_ACCENT_LIST}
          selected={appearance.accent}
          onSelect={(accent) => update({ accent })}
          columns="grid-cols-3 sm:grid-cols-5"
        />
      </Card>

      {/* Rain */}
      <Card
        title="Rain"
        description="An animated layer that falls over the page. Pick a style, then tune it."
        hex={hex400}
      >
        <div
          role="radiogroup"
          aria-label="Rain style"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {RAIN_MODE_LIST.map((mode) => {
            const Icon = RAIN_ICONS[mode.id];
            const isSelected = appearance.rainMode === mode.id;
            return (
              <ChoiceButton
                key={mode.id}
                selected={isSelected}
                hex={hex400}
                onClick={() => update({ rainMode: mode.id })}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: isSelected ? hex400 : undefined }}
                />
                <span
                  className="text-sm font-medium text-gray-800 dark:text-gray-100"
                  style={{ color: isSelected ? hex400 : undefined }}
                >
                  {mode.label}
                </span>
                <span className="text-xs leading-snug text-gray-500 dark:text-gray-400">
                  {mode.description}
                </span>
              </ChoiceButton>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <RangeRow
            id="rain-size"
            label="Drop size"
            value={appearance.rainSize}
            min={RANGE_LIMITS.rainSize.min}
            max={RANGE_LIMITS.rainSize.max}
            hex={hex400}
            disabled={rainOff}
            onChange={(rainSize) => update({ rainSize })}
          />
          <RangeRow
            id="rain-density"
            label="Amount"
            value={appearance.rainDensity}
            min={RANGE_LIMITS.rainDensity.min}
            max={RANGE_LIMITS.rainDensity.max}
            hex={hex400}
            disabled={rainOff}
            onChange={(rainDensity) => update({ rainDensity })}
          />
          <RangeRow
            id="rain-speed"
            label="Speed"
            value={appearance.rainSpeed}
            min={RANGE_LIMITS.rainSpeed.min}
            max={RANGE_LIMITS.rainSpeed.max}
            hex={hex400}
            disabled={rainOff}
            onChange={(rainSpeed) => update({ rainSpeed })}
          />
          <RangeRow
            id="rain-opacity"
            label="Brightness"
            value={appearance.rainOpacity}
            min={RANGE_LIMITS.rainOpacity.min}
            max={RANGE_LIMITS.rainOpacity.max}
            hex={hex400}
            disabled={rainOff}
            onChange={(rainOpacity) => update({ rainOpacity })}
          />

          <div
            className={`flex items-center justify-between gap-4 ${rainOff ? "opacity-40" : ""}`}
          >
            <div>
              <p
                id="glow-label"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Neon glow
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Adds a soft glow to each drop. Turn it off if the app feels
                slow.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={appearance.glow}
              aria-labelledby="glow-label"
              disabled={rainOff}
              onClick={() => update({ glow: !appearance.glow })}
              className="relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
              style={{
                borderColor: alpha(hex400, 0.5),
                backgroundColor: appearance.glow
                  ? alpha(hex400, 0.35)
                  : "transparent",
                outlineColor: hex400,
              }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
                style={{
                  left: appearance.glow ? "1.5rem" : "0.125rem",
                  backgroundColor: hex400,
                  boxShadow: appearance.glow
                    ? `0 0 10px 2px ${alpha(hex400, 0.6)}`
                    : undefined,
                }}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Text size */}
      <Card
        title="Text size"
        description="Scales the whole app: text, buttons and spacing."
        hex={hex400}
      >
        <div
          role="radiogroup"
          aria-label="Text size"
          className="grid grid-cols-3 gap-3"
        >
          {UI_SIZE_LIST.map((size) => {
            const isSelected = appearance.uiSize === size.id;
            return (
              <ChoiceButton
                key={size.id}
                selected={isSelected}
                hex={hex400}
                onClick={() => update({ uiSize: size.id })}
              >
                <span
                  className="font-semibold text-gray-800 dark:text-gray-100"
                  style={{
                    color: isSelected ? hex400 : undefined,
                    fontSize:
                      size.id === "small"
                        ? "0.8rem"
                        : size.id === "large"
                          ? "1.25rem"
                          : "1rem",
                  }}
                >
                  Aa {size.label}
                </span>
                <span className="text-xs leading-snug text-gray-500 dark:text-gray-400">
                  {size.hint}
                </span>
              </ChoiceButton>
            );
          })}
        </div>
      </Card>

      {/* Light / dark */}
      <Card
        title="Light or dark"
        description="Match your device, or pick one."
        hex={hex400}
      >
        <div
          role="radiogroup"
          aria-label="Color mode"
          className="grid grid-cols-3 gap-3"
        >
          {THEME_CHOICES.map(({ id, label, icon: Icon }) => {
            const isSelected = mounted && colorMode === id;
            return (
              <ChoiceButton
                key={id}
                selected={isSelected}
                hex={hex400}
                onClick={() => setTheme(id)}
              >
                <Icon
                  className="h-5 w-5"
                  style={{ color: isSelected ? hex400 : undefined }}
                />
                <span
                  className="text-sm font-medium text-gray-800 dark:text-gray-100"
                  style={{ color: isSelected ? hex400 : undefined }}
                >
                  {label}
                </span>
              </ChoiceButton>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
