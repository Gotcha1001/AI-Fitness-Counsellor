// hooks/useInspirations.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { localDateKey } from "@/lib/dateKey";

interface InspirationsData {
  loading: boolean;
  dateKey: string;
  today: Doc<"inspirations"> | null;
  recent: Doc<"inspirations">[];
  streak: number;
}

export function useInspirations(): InspirationsData {
  const [dateKey] = useState(() => localDateKey());
  const today = useQuery(api.inspirations.getToday, { dateKey });
  const recent = useQuery(api.inspirations.listRecent, {});
  const streak = useQuery(api.inspirations.getStreak, { dateKey });
  const ensureToday = useMutation(api.inspirations.ensureToday);
  const started = useRef(false);

  // Create today's inspiration once per visit (the mutation is idempotent).
  useEffect(() => {
    if (today === undefined || started.current) return;
    started.current = true;
    ensureToday({ dateKey }).catch((e: unknown) =>
      console.error("[inspirations] ensureToday failed", e),
    );
  }, [today, dateKey, ensureToday]);

  return {
    loading:
      today === undefined || recent === undefined || streak === undefined,
    dateKey,
    today: today ?? null,
    recent: recent ?? [],
    streak: streak ?? 0,
  };
}
