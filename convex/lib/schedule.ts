// convex/lib/schedule.ts — shared by Convex (enforcement) and the UI (display).
export const TOTAL_MONTHS = 6;
export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
/** Users may check in up to 3 days early. Set to MONTH_MS while testing to unlock everything. */
export const EARLY_MS = 3 * 24 * 60 * 60 * 1000;

export interface CheckInWindow {
  month: number | null; // null = program finished
  dueAt: number | null;
  open: boolean;
}

export function checkInWindow(
  startedAt: number,
  completed: number,
  now: number,
): CheckInWindow {
  if (completed >= TOTAL_MONTHS)
    return { month: null, dueAt: null, open: false };
  const month = completed + 1;
  const dueAt = startedAt + month * MONTH_MS;
  return { month, dueAt, open: now >= dueAt - EARLY_MS };
}

export function currentMonth(startedAt: number, now: number): number {
  const m = Math.floor((now - startedAt) / MONTH_MS) + 1;
  return Math.min(TOTAL_MONTHS, Math.max(1, m));
}
