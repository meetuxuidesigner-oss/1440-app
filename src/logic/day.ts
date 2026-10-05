import { addDays, dayOf, dayWindow, overlapMin, weekDays } from './time';
import type { Activity, AppData, DayKey, Session } from './types';

export function activeActivities(data: AppData): Activity[] {
  return data.activities.filter((a) => !a.archived && !a.paused);
}

export function runningSession(data: AppData): Session | undefined {
  return data.sessions.find((s) => s.end === null);
}

/** Sessions that started in this day (a session belongs to the day it started in). */
export function sessionsOn(data: AppData, day: DayKey, activityId?: string): Session[] {
  return data.sessions
    .filter((s) => dayOf(s.start, data.settings) === day && (!activityId || s.activityId === activityId))
    .sort((a, b) => a.start - b.start);
}

/** Minutes that count: only the awake part of the day. Time inside the sleep window shows but earns nothing. */
export function countedMinutes(data: AppData, session: Session, now: number): number {
  const day = dayOf(session.start, data.settings);
  const w = dayWindow(day, data.settings);
  return overlapMin(session.start, session.end ?? now, w.start, w.sleepStart);
}

export function minutesOn(data: AppData, day: DayKey, activityId: string, now: number): number {
  return sessionsOn(data, day, activityId).reduce((sum, s) => sum + countedMinutes(data, s, now), 0);
}

export const isDayOff = (data: AppData, day: DayKey) => data.daysOff.includes(day);
export const isRestDay = (data: AppData, day: DayKey, activityId: string) =>
  data.restDays.some((r) => r.day === day && r.activityId === activityId);

export function targetMet(data: AppData, day: DayKey, activity: Activity, now: number): boolean {
  return minutesOn(data, day, activity.id, now) >= activity.dailyTarget;
}

export interface WeekResult {
  days: DayKey[];
  /** Days that are not a Day Off. */
  available: number;
  /** Weekly target, shrunk to fit Days Off (rounded down). */
  target: number;
  /** Days the daily target was met, up to and including `until`. */
  done: number;
  met: boolean;
  /** A fully-off week: the streak neither grows nor breaks. */
  paused: boolean;
}

export function weekResult(data: AppData, activity: Activity, anyDayInWeek: DayKey, now: number, until?: DayKey): WeekResult {
  const days = weekDays(anyDayInWeek, data.settings.statementDay);
  const available = days.filter((d) => !isDayOff(data, d)).length;
  const target = Math.floor((activity.daysPerWeek * available) / 7);
  const counted = until ? days.filter((d) => d <= until) : days;
  const done = counted.filter((d) => !isDayOff(data, d) && targetMet(data, d, activity, now)).length;
  return { days, available, target, done, met: available > 0 && done >= target, paused: available === 0 };
}

export interface FillLayer {
  activityId: string;
  color: Activity['color'];
  /** Minutes that count toward the fill (capped at the activity's daily target). */
  minutes: number;
  /** Share of today's total target, 0–1. */
  fraction: number;
}

export type FillState = 'dayOff' | 'noActivities' | 'allResting' | 'empty' | 'filling' | 'full';

export interface DailyFill {
  day: DayKey;
  state: FillState;
  /** Real minutes spent on activities today, uncapped (the honest number). */
  wellSpent: number;
  /** Sum of today's daily targets ("full"). */
  target: number;
  /** 0–1, never above 1: the sphere can't overfill. */
  fraction: number;
  /** Bottom-to-top, in the order each activity was first done today. */
  layers: FillLayer[];
  /** Activities that count toward today's target. */
  included: Activity[];
}

/**
 * Which activities count toward today's sphere:
 * every active activity, except one with a planned rest day today,
 * one whose weekly target was already met before today, and all of them on a Day Off.
 */
export function dailyFill(data: AppData, day: DayKey, now: number): DailyFill {
  const all = activeActivities(data);
  const wellSpent = all.reduce((sum, a) => sum + minutesOn(data, day, a.id, now), 0);
  const base = { day, wellSpent, layers: [] as FillLayer[], included: [] as Activity[] };

  if (isDayOff(data, day)) return { ...base, state: 'dayOff', target: 0, fraction: 0 };
  if (all.length === 0) return { ...base, state: 'noActivities', target: 0, fraction: 0 };

  const previousDay = (d: DayKey) => d < day;
  const included = all.filter((a) => {
    if (isRestDay(data, day, a.id)) return false;
    const w = weekResult(data, a, day, now);
    const doneBefore = w.days.filter((d) => previousDay(d) && !isDayOff(data, d) && targetMet(data, d, a, now)).length;
    return doneBefore < w.target;
  });

  if (included.length === 0) return { ...base, state: 'allResting', target: 0, fraction: 0 };

  const target = included.reduce((sum, a) => sum + a.dailyTarget, 0);
  const firstStart = (a: Activity) => sessionsOn(data, day, a.id)[0]?.start ?? Infinity;
  const layers = included
    .map((a) => ({ a, minutes: Math.min(minutesOn(data, day, a.id, now), a.dailyTarget) }))
    .filter((x) => x.minutes > 0)
    .sort((x, y) => firstStart(x.a) - firstStart(y.a))
    .map(({ a, minutes }) => ({ activityId: a.id, color: a.color, minutes, fraction: minutes / target }));
  const filled = layers.reduce((sum, l) => sum + l.minutes, 0);
  const fraction = Math.min(1, filled / target);
  const state: FillState = fraction >= 1 ? 'full' : fraction > 0 ? 'filling' : 'empty';
  return { ...base, state, target, fraction, layers, included };
}

/** Weeks in a row the activity met its weekly target. The current week counts once met; fully-off weeks are skipped. */
export function weeklyStreak(data: AppData, activity: Activity, today: DayKey, now: number): number {
  const createdDay = dayOf(activity.createdAt, data.settings);
  let streak = 0;
  let cursor = today;
  const current = weekResult(data, activity, cursor, now);
  if (current.met) streak++;
  cursor = current.days[0];
  for (let i = 0; i < 520; i++) {
    const prevDay = addDays(cursor, -1);
    const w = weekResult(data, activity, prevDay, now);
    if (w.days[6] < createdDay) break;
    if (w.paused) {
      cursor = w.days[0];
      continue;
    }
    if (!w.met) break;
    streak++;
    cursor = w.days[0];
  }
  return streak;
}


/** 'blank' is what friends see instead of a missed day: misses are never shown to a circle. */
export type DayMark = 'done' | 'rest' | 'gap' | 'dayOff' | 'upcoming' | 'today' | 'blank';

/** One mark per day for an activity's week strip. */
export function weekMarks(data: AppData, activity: Activity, today: DayKey, now: number): { day: DayKey; mark: DayMark }[] {
  const days = weekDays(today, data.settings.statementDay);
  return days.map((day) => {
    if (isDayOff(data, day)) return { day, mark: 'dayOff' };
    if (targetMet(data, day, activity, now)) return { day, mark: 'done' };
    if (isRestDay(data, day, activity.id)) return { day, mark: 'rest' };
    if (day === today) return { day, mark: 'today' };
    if (day > today) return { day, mark: 'upcoming' };
    return { day, mark: 'gap' };
  });
}

/** Position on the awake-day arc, 0 at wake time, 1 at bedtime. */
export function awakeFraction(data: AppData, day: DayKey, t: number): number {
  const w = dayWindow(day, data.settings);
  return Math.min(1, Math.max(0, (t - w.start) / (w.sleepStart - w.start)));
}

export interface ArcSegment {
  sessionId: string;
  color: Activity['color'];
  from: number;
  to: number;
}

export function arcSegments(data: AppData, day: DayKey, now: number): ArcSegment[] {
  const colorOf = new Map(data.activities.map((a) => [a.id, a.color]));
  return sessionsOn(data, day)
    .map((s) => ({
      sessionId: s.id,
      color: colorOf.get(s.activityId) ?? 'mist',
      from: awakeFraction(data, day, s.start),
      to: awakeFraction(data, day, s.end ?? now),
    }))
    .filter((seg) => seg.to > seg.from);
}
