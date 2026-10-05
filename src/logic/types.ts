/** Minutes after local midnight, e.g. 7:00 am = 420. */
export type ClockMin = number;

/** A day key in the form YYYY-MM-DD. A "day" runs from wake time to the next wake time. */
export type DayKey = string;

export type ActivityColor = 'coral' | 'amber' | 'sun' | 'sky' | 'violet' | 'rose' | 'sand' | 'mist';

export interface Settings {
  wake: ClockMin;
  sleep: ClockMin;
  /** 0 = Sunday … 6 = Saturday. The weekly statement arrives on this day; the week ends on it. */
  statementDay: number;
}

export interface Activity {
  id: string;
  name: string;
  color: ActivityColor;
  /** Minutes per day. Required when an activity is created; it sizes the sphere. */
  dailyTarget: number;
  /** How many days a week the target should be met (3–7). */
  daysPerWeek: number;
  createdAt: number;
  archived?: boolean;
  paused?: boolean;
}

export interface Session {
  id: string;
  activityId: string;
  start: number;
  /** null while the timer is running. */
  end: number | null;
}

export interface RestDay {
  activityId: string;
  day: DayKey;
}

export interface AppData {
  settings: Settings;
  activities: Activity[];
  sessions: Session[];
  restDays: RestDay[];
  daysOff: DayKey[];
}
