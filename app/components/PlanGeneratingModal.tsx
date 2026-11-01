// app/components/PlanGeneratingModal.tsx
"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Apple,
  CalendarRange,
  Calculator,
  Check,
  Dumbbell,
  Sparkles,
} from "lucide-react";
import { useAppearance } from "@/app/context/AppearanceContext";
import { alpha } from "@/convex/lib/appearance";

/* ------------------------------- content -------------------------------- */

const STEPS = [
  { icon: Calculator, label: "Working out your calories & macros" },
  { icon: Apple, label: "Choosing foods to eat and avoid" },
  { icon: Dumbbell, label: "Building your weekly workouts" },
  { icon: CalendarRange, label: "Mapping out all 6 months" },
  { icon: Sparkles, label: "Polishing your plan" },
] as const;

// A step becomes "active" once EITHER enough of the plan has streamed in
// (progressChars from Convex) OR enough seconds have passed. Tweak these if
// your plans come out longer or shorter.
const STEP_CHARS = [0, 1500, 4500, 8000, 11000];
const STEP_SECONDS = [0, 10, 22, 36, 48];
const EXPECTED_CHARS = 12000; // roughly a full plan, for the progress bar
const EXPECTED_SECONDS = 75;
const HIDE_AFTER_SECONDS = 30; // "keep working in background" button appears
const GIVE_UP_SECONDS = 300; // matches the 5-minute stuck rule in requestPlan

const PULSES = [
  { top: "12%", left: "10%", delay: 0 },
  { top: "22%", left: "86%", delay: 0.8 },
  { top: "70%", left: "8%", delay: 1.5 },
  { top: "80%", left: "88%", delay: 0.5 },
  { top: "48%", left: "92%", delay: 1.9 },
  { top: "58%", left: "6%", delay: 1.1 },
];

const READOUTS = [
  ["2,100", "kcal", "140g P"],
  ["3×", "week", "45 min"],
  ["−0.5", "kg/wk", "Month 1"],
  ["180g", "carbs", "70g fat"],
  ["Day 7", "rest", "walk"],
];

const RAIN_COLUMNS = Array.from({ length: 6 }).map((_, i) => ({
  left: `${(i / 5) * 100}%`,
  tokens: READOUTS[i % READOUTS.length],
  duration: 8 + (i % 4) * 1.8,
  delay: (i % 5) * 0.6,
}));

const flicker = {
  opacity: [0.55, 0.9, 0.5, 1, 0.6, 0.85, 0.55],
  scale: [0.95, 1.05, 0.92, 1.1, 0.97, 1.04, 0.95],
};

/** Faint HUD grid as an inline SVG, tinted with the accent color. */
function gridBackground(hex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><path d="M48 0H0V48" fill="none" stroke="${hex}" stroke-opacity="0.18" stroke-width="1"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const subscribeNoop = (): (() => void) => () => {};

/* -------------------------------- public API ------------------------------ */

interface PlanGeneratingModalProps {
  open: boolean;
  /** plan.progressChars from Convex: how much of the plan has streamed in. */
  progressChars?: number;
  /**
   * Pass plan._id on the plan page. It enables the "keep working in the
   * background" button, so a stuck run can never trap the user behind the
   * modal. Leave undefined in the onboarding wizard.
   */
  sessionKey?: string;
}

export function PlanGeneratingModal({
  open,
  progressChars = 0,
  sessionKey,
}: PlanGeneratingModalProps): React.JSX.Element | null {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);
  const hidden = sessionKey !== undefined && hiddenKey === sessionKey;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && !hidden && (
        <Overlay
          key="plan-generating"
          progressChars={progressChars}
          onHide={sessionKey ? () => setHiddenKey(sessionKey) : undefined}
        />
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* --------------------------------- overlay -------------------------------- */

function Overlay({
  progressChars,
  onHide,
}: {
  progressChars: number;
  onHide?: () => void;
}): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const { theme } = useAppearance();
  const { hex400, shades } = theme;
  const gridBg = useMemo(() => gridBackground(hex400), [hex400]);

  // Lock page scroll while the modal is up.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Seconds since the modal appeared.
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(mountedAt);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - mountedAt) / 1000));

  // Give up (hide) after 5 minutes so a stuck run can't trap the user.
  useEffect(() => {
    if (onHide && elapsed >= GIVE_UP_SECONDS) onHide();
  }, [elapsed, onHide]);

  let activeStep = 0;
  for (let i = 0; i < STEPS.length; i++) {
    if (progressChars >= STEP_CHARS[i] || elapsed >= STEP_SECONDS[i])
      activeStep = i;
  }
  const pct = Math.min(
    95,
    Math.max(
      (progressChars / EXPECTED_CHARS) * 100,
      (elapsed / EXPECTED_SECONDS) * 100,
    ),
  );

  const spin = (reverse = false) =>
    reduceMotion ? undefined : { rotate: reverse ? -360 : 360 };
  const spinTransition = (duration: number) =>
    reduceMotion
      ? { duration: 0 }
      : { duration, repeat: Infinity, ease: "linear" as const };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-generating-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative w-full max-w-md overflow-hidden rounded-xl border bg-[#04070a] p-8 text-center"
        style={{
          borderColor: alpha(hex400, 0.25),
          boxShadow: `0 0 60px -12px ${alpha(hex400, 0.5)}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("${gridBg}")`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0a1219_0%,_#04070a_75%)]" />

        {/* falling plan-stat readouts */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-70">
          {RAIN_COLUMNS.map((col, i) => (
            <motion.div
              key={i}
              className="absolute top-0 flex flex-col gap-5 font-mono text-[10px]"
              style={{
                left: col.left,
                color: alpha(i % 2 === 0 ? hex400 : shades[300], 0.35),
                maskImage:
                  "linear-gradient(to bottom, transparent, black 25%, black 65%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black 25%, black 65%, transparent)",
              }}
              animate={reduceMotion ? undefined : { y: ["-30%", "130%"] }}
              transition={{
                duration: col.duration,
                repeat: Infinity,
                delay: col.delay,
                ease: "linear",
              }}
            >
              {col.tokens.map((t, j) => (
                <span key={j}>{t}</span>
              ))}
            </motion.div>
          ))}
        </div>

        {/* idea-spark dust */}
        {PULSES.map((s, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute h-1.5 w-1.5 rounded-full"
            style={{ top: s.top, left: s.left, backgroundColor: shades[300] }}
            animate={reduceMotion ? undefined : { opacity: [0.1, 0.7, 0.1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: s.delay,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* corner brackets */}
        {[
          "-left-px -top-px border-l-2 border-t-2",
          "-right-px -top-px border-r-2 border-t-2",
          "-left-px -bottom-px border-l-2 border-b-2",
          "-right-px -bottom-px border-r-2 border-b-2",
        ].map((cls, i) => (
          <div
            key={i}
            className={`pointer-events-none absolute ${cls} h-5 w-5`}
            style={{ borderColor: alpha(hex400, 0.6) }}
          />
        ))}

        {/* scanline */}
        <motion.div
          className="pointer-events-none absolute left-0 right-0 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${alpha(shades[300], 0.5)}, transparent)`,
          }}
          animate={reduceMotion ? undefined : { top: ["0%", "100%"] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }}
        />

        {/* flickering core */}
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border border-dashed"
            style={{ borderColor: alpha(hex400, 0.35) }}
            animate={spin()}
            transition={spinTransition(14)}
          />
          <motion.div
            className="absolute inset-1.5 rounded-full border"
            style={{ borderColor: alpha(shades[600], 0.4) }}
            animate={spin(true)}
            transition={spinTransition(9)}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: alpha(shades[300], 0.3) }}
            animate={
              reduceMotion
                ? undefined
                : { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }
            }
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <motion.div
            className="absolute h-10 w-10 rounded-full blur-xl"
            style={{ backgroundColor: shades[300] }}
            animate={reduceMotion ? undefined : flicker}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-full border"
            style={{
              borderColor: alpha(hex400, 0.5),
              background: `linear-gradient(to bottom right, ${shades[700]}, ${shades[500]})`,
              boxShadow: `0 0 25px -4px ${alpha(hex400, 0.9)}`,
            }}
          >
            <Dumbbell className="h-5 w-5 text-[#04070a]" />
          </div>
        </div>

        <h2
          id="plan-generating-title"
          className="relative text-xl font-bold tracking-tight text-stone-50"
        >
          Your coach is building your plan
        </h2>
        <p className="relative mt-2 font-mono text-xs uppercase tracking-[0.2em] text-stone-400">
          Your personal 6-month programme
        </p>

        <div className="relative mt-8 space-y-2.5" aria-live="polite">
          {STEPS.map((step, i) => (
            <StepRow
              key={step.label}
              icon={step.icon}
              label={step.label}
              index={i}
              state={
                i < activeStep ? "done" : i === activeStep ? "active" : "todo"
              }
              hex400={hex400}
              shade300={shades[300]}
              reduceMotion={!!reduceMotion}
            />
          ))}
        </div>

        <div
          className="relative mt-8 h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: alpha(hex400, 0.12) }}
        >
          <motion.div
            className="relative h-full rounded-full"
            style={{
              background: `linear-gradient(to right, ${shades[700]}, ${shades[300]})`,
            }}
            initial={{ width: "4%" }}
            animate={{ width: `${Math.max(4, pct)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {!reduceMotion && (
              <motion.span
                className="absolute inset-y-0 w-1/3 rounded-full"
                style={{
                  background: `linear-gradient(to right, transparent, ${alpha(shades[300], 0.9)}, transparent)`,
                }}
                initial={{ x: "-100%" }}
                animate={{ x: "300%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.div>
        </div>

        <p className="relative mt-3 text-xs text-stone-400">
          This usually takes under a minute.
        </p>

        {onHide && elapsed >= HIDE_AFTER_SECONDS && (
          <button
            type="button"
            onClick={onHide}
            className="relative mt-4 rounded-md border px-3 py-1.5 text-xs font-medium text-stone-200 transition-colors hover:text-white"
            style={{ borderColor: alpha(hex400, 0.4) }}
          >
            Taking a while? Keep working in the background
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- step row -------------------------------- */

function StepRow({
  icon: Icon,
  label,
  index,
  state,
  hex400,
  shade300,
  reduceMotion,
}: {
  icon: (typeof STEPS)[number]["icon"];
  label: string;
  index: number;
  state: "done" | "active" | "todo";
  hex400: string;
  shade300: string;
  reduceMotion: boolean;
}): React.JSX.Element {
  const isActive = state === "active";
  const isDone = state === "done";
  return (
    <motion.div
      className="flex items-center gap-3 rounded-md border px-3 py-2 text-left"
      style={{
        borderColor: alpha(hex400, isActive ? 0.35 : 0.1),
        backgroundColor: alpha(hex400, isActive ? 0.1 : 0.04),
        opacity: state === "todo" ? 0.5 : 1,
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: state === "todo" ? 0.5 : 1, x: 0 }}
      transition={{ delay: 0.12 * index + 0.2, duration: 0.4 }}
    >
      <motion.div
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded border bg-[#0a1219]"
        style={{ borderColor: alpha(hex400, isDone ? 0.7 : 0.3) }}
        animate={
          isActive && !reduceMotion
            ? {
                borderColor: [
                  alpha(hex400, 0.3),
                  alpha(shade300, 0.7),
                  alpha(hex400, 0.3),
                ],
              }
            : undefined
        }
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      >
        {isDone ? (
          <Check
            className="h-3.5 w-3.5"
            style={{ color: shade300 }}
            strokeWidth={3}
          />
        ) : (
          <Icon
            className="h-3 w-3"
            style={{ color: alpha(shade300, isActive ? 0.9 : 0.5) }}
          />
        )}
      </motion.div>
      <span
        className={`font-mono text-[13px] ${
          isDone ? "text-stone-400" : "text-stone-200/90"
        }`}
      >
        {label}
        {isActive && !reduceMotion && (
          <motion.span
            className="inline-block"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            …
          </motion.span>
        )}
      </span>
      {isActive && (
        <motion.span
          className="ml-auto h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: hex400 }}
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }
          }
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
