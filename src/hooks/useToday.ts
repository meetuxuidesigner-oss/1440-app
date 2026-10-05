import { useMemo } from 'react';

import { arcSegments, awakeFraction, dailyFill, runningSession } from '@/logic/day';
import { dayOf, dayWindow } from '@/logic/time';
import { useApp, useNow } from '@/store';

const MIN = 60_000;

/**
 * Everything "today" needs, from one clock.
 * The clock ticks every second (for the running timer), but the sphere only
 * moves once a minute, so the liquid rises calmly instead of jittering.
 */
export function useToday() {
  const data = useApp((s) => s.data);
  const now = useNow(1000);
  const minute = Math.floor(now / MIN) * MIN;

  const view = useMemo(() => {
    if (!data) return null;
    const day = dayOf(minute, data.settings);
    const w = dayWindow(day, data.settings);
    return {
      day,
      fill: dailyFill(data, day, minute),
      segments: arcSegments(data, day, minute),
      arcNow: awakeFraction(data, day, minute),
      bedtime: minute >= w.sleepStart,
      window: w,
    };
  }, [data, minute]);

  const running = data ? runningSession(data) : undefined;
  return { data, now, minute, running, ...(view ?? {}) };
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
