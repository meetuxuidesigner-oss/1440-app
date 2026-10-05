import { dayOf, dayWindow, type DayWindow } from './time';
import type { AppData, ClockMin, DayKey, Settings } from './types';

/**
 * Wake and sleep times can change any time, but a change never rewrites the past:
 * days that already happened keep the times they were lived with, so streaks stay fair.
 */

/** The settings that were in force at moment t. */
export function settingsAt(data: AppData, t: number): Settings {
  const past = data.pastSchedules?.find((p) => t < p.until);
  return past ? { ...data.settings, wake: past.wake, sleep: past.sleep } : data.settings;
}

/** The day a moment belongs to, using the times that applied then. */
export function dayAt(data: AppData, t: number): DayKey {
  return dayOf(t, settingsAt(data, t));
}

/** The settings a given day was (or will be) lived with: the ones in force when it started. */
export function settingsForDay(data: AppData, day: DayKey): Settings {
  let s = data.settings;
  for (let i = 0; i < 2; i++) s = settingsAt(data, dayWindow(day, s).start);
  return s;
}

export function windowOf(data: AppData, day: DayKey): DayWindow {
  return dayWindow(day, settingsForDay(data, day));
}

export interface PendingSchedule {
  wake: ClockMin;
  sleep: ClockMin;
  /** When the new times take over. */
  from: number;
}

/** A change that was saved but hasn't started yet. */
export function pendingSchedule(data: AppData, now: number): PendingSchedule | null {
  const next = data.pastSchedules?.find((p) => now < p.until);
  if (!next) return null;
  return { wake: data.settings.wake, sleep: data.settings.sleep, from: next.until };
}

export type ScheduleStart = 'today' | 'tomorrow';

/**
 * When a change would start. If nothing has been tracked today, today can simply restart
 * with the new times. Otherwise today keeps its times and the change starts tomorrow.
 */
export function whenScheduleStarts(data: AppData, now: number): ScheduleStart {
  const current = settingsAt(data, now);
  const today = dayOf(now, current);
  const trackedToday = data.sessions.some((s) => dayAt(data, s.start) === today);
  return trackedToday ? 'tomorrow' : 'today';
}

export function changeSchedule(data: AppData, wake: ClockMin, sleep: ClockMin, now: number): AppData {
  const current = settingsAt(data, now);
  const today = dayOf(now, current);
  const w = dayWindow(today, current);
  const until = whenScheduleStarts(data, now) === 'today' ? w.start : w.end;
  // Keep history that's already over; drop any change that hadn't started yet.
  const kept = (data.pastSchedules ?? []).filter((p) => p.until <= until);
  const unchanged = wake === current.wake && sleep === current.sleep;
  const pastSchedules = unchanged ? kept.filter((p) => p.until <= now) : [...kept, { until, wake: current.wake, sleep: current.sleep }];
  return { ...data, settings: { ...data.settings, wake, sleep }, pastSchedules };
}
