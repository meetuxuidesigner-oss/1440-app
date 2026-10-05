import { isRestDay, minutesOn, runningSession, weekResult, type DailyFill } from './day';
import { formatDuration } from './time';
import type { Activity, AppData, DayKey } from './types';

export type RowKind = 'running' | 'met' | 'rest' | 'weekDone' | 'progress' | 'notStarted' | 'dayOff';

export interface RowStatus {
  kind: RowKind;
  minutes: number;
  /** 0–1 toward today's daily target. */
  progress: number;
  text: string;
}

/** What one activity row on Home says about today. */
export function rowStatus(data: AppData, activity: Activity, day: DayKey, now: number, fill: DailyFill): RowStatus {
  const minutes = minutesOn(data, day, activity.id, now);
  const progress = Math.min(1, minutes / activity.dailyTarget);
  const running = runningSession(data)?.activityId === activity.id;
  const inPlan = fill.included.some((a) => a.id === activity.id);
  const left = Math.max(0, Math.ceil(activity.dailyTarget - minutes));
  const base = { minutes, progress };

  if (running) {
    const text = progress >= 1 ? `Running · target met` : `Running · ${left} min to go`;
    return { ...base, kind: 'running', text };
  }
  if (progress >= 1) return { ...base, kind: 'met', text: `Done · ${formatDuration(minutes)}` };
  if (fill.state === 'dayOff') return { ...base, kind: 'dayOff', text: minutes > 0 ? `${formatDuration(minutes)} · Day off` : 'Day off' };
  if (!inPlan && isRestDay(data, day, activity.id)) return { ...base, kind: 'rest', text: 'Rest day · planned' };
  if (!inPlan) {
    const w = weekResult(data, activity, day, now);
    return { ...base, kind: 'weekDone', text: `Week done · ${w.done} of ${w.target}` };
  }
  if (minutes >= 1) return { ...base, kind: 'progress', text: `${Math.floor(minutes)} of ${activity.dailyTarget} min · ${left} to go` };
  return { ...base, kind: 'notStarted', text: `${activity.dailyTarget} min today` };
}

/** One short line under the sphere: the next useful thing, never a guilt trip. */
export function nextHint(data: AppData, fill: DailyFill, day: DayKey, now: number): string | null {
  if (fill.state === 'full') return 'Anything more today is a bonus, not a requirement.';
  if (fill.state !== 'filling' && fill.state !== 'empty') return null;
  const remaining = fill.included
    .map((a) => ({ a, left: Math.ceil(a.dailyTarget - minutesOn(data, day, a.id, now)) }))
    .filter((x) => x.left > 0);
  if (remaining.length === 1) return `${remaining[0].left} min of ${remaining[0].a.name} to go`;
  const total = remaining.reduce((s, x) => s + x.left, 0);
  return `${formatDuration(total)} to go across ${remaining.length} activities`;
}

/** Over this, Home gently questions the plan. Rewarding balance, not hustle. */
export const VERY_FULL_DAY_MIN = 8 * 60;
