import type { ClockMin, DayKey, Settings } from './types';

const MIN = 60_000;

const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of a day key. */
export function midnightOf(day: DayKey): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function addDays(day: DayKey, n: number): DayKey {
  const d = midnightOf(day);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function atClock(day: DayKey, clock: ClockMin): number {
  const d = midnightOf(day);
  d.setMinutes(clock);
  return d.getTime();
}

/** The day a moment belongs to: a day starts at wake time and ends at the next wake time. */
export function dayOf(t: number, settings: Settings): DayKey {
  return dateKey(new Date(t - settings.wake * MIN));
}

export interface DayWindow {
  /** Wake time that starts the day. */
  start: number;
  /** Bedtime: start of the sleep window. */
  sleepStart: number;
  /** Next wake time: end of the day. */
  end: number;
}

export function dayWindow(day: DayKey, settings: Settings): DayWindow {
  const start = atClock(day, settings.wake);
  const sleepOnSameDate = settings.sleep > settings.wake;
  const sleepStart = atClock(sleepOnSameDate ? day : addDays(day, 1), settings.sleep);
  const end = atClock(addDays(day, 1), settings.wake);
  return { start, sleepStart, end };
}

export function awakeMinutes(settings: Settings): number {
  const diff = settings.sleep - settings.wake;
  return diff > 0 ? diff : diff + 1440;
}

export function minutesBetween(a: number, b: number): number {
  return Math.max(0, (b - a) / MIN);
}

/** Overlap of [a1,a2) with [b1,b2) in minutes. */
export function overlapMin(a1: number, a2: number, b1: number, b2: number): number {
  return minutesBetween(Math.max(a1, b1), Math.min(a2, b2));
}

/** The 7 day keys of the week containing `day`. The week ends on the statement day (Sunday by default, so it starts Monday). */
export function weekDays(day: DayKey, statementDay: number): DayKey[] {
  const dow = midnightOf(day).getDay();
  const firstDow = (statementDay + 1) % 7;
  const offset = (dow - firstDow + 7) % 7;
  const first = addDays(day, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(first, i));
}

export function formatDuration(min: number): string {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
}

export function formatClock(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h < 12 ? 'am' : 'pm';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${pad(m)} ${suffix}`;
}

export function formatClockMin(c: ClockMin): string {
  const d = new Date(2000, 0, 1, Math.floor(c / 60), c % 60);
  return formatClock(d.getTime());
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

/** "Thursday, 24 Sept" */
export function formatDayLong(day: DayKey): string {
  const d = midnightOf(day);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Thu" */
export function formatDayShort(day: DayKey): string {
  return WEEKDAYS[midnightOf(day).getDay()].slice(0, 3);
}
