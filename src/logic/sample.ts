import { addDays, atClock, dayOf, weekDays } from './time';
import type { Activity, AppData, DayKey, Session, Settings } from './types';

export const DEFAULT_SETTINGS: Settings = { wake: 7 * 60, sleep: 23 * 60, statementDay: 0 };

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

/**
 * The shared sample week used in every design screen.
 * "Today" gets Thursday's sessions and the three days before it get Monday–Wednesday's,
 * so on Thu 24 Sept 2026 at 2:18 pm the numbers match the designs exactly:
 * 95 min well spent today, 355 min this week, streaks of 6, 3 and 11 weeks.
 */
export function makeSampleData(now: number, settings: Settings = DEFAULT_SETTINGS): AppData {
  const today = dayOf(now, settings);
  const longAgo = new Date(now).setFullYear(new Date(now).getFullYear() - 1);
  const activities: Activity[] = [
    { id: 'english', name: 'Learn English', color: 'sky', dailyTarget: 30, daysPerWeek: 5, createdAt: longAgo },
    { id: 'workout', name: 'Workout', color: 'coral', dailyTarget: 45, daysPerWeek: 4, createdAt: longAgo },
    { id: 'read', name: 'Read', color: 'amber', dailyTarget: 30, daysPerWeek: 5, createdAt: longAgo },
  ];

  const sessions: Session[] = [];
  let n = 0;
  const add = (activityId: string, day: DayKey, from: number, to: number) => {
    const start = atClock(day, from);
    const end = atClock(day, to);
    if (end <= now) sessions.push({ id: `s${++n}`, activityId, start, end });
  };

  // This week (relative to today)
  const mon = addDays(today, -3);
  const tue = addDays(today, -2);
  const wed = addDays(today, -1);
  add('english', mon, h(7, 30), h(8, 5));
  add('workout', mon, h(18), h(18, 50));
  add('read', mon, h(20, 15), h(20, 45));
  add('english', tue, h(7, 30), h(8));
  add('read', tue, h(20), h(20, 30));
  add('workout', wed, h(18, 15), h(19));
  add('read', wed, h(21, 10), h(21, 50));
  add('english', today, h(7, 30), h(8));
  add('workout', today, h(8, 15), h(9));
  add('read', today, h(13), h(13, 20));

  // History: full weeks before this one, so the streaks are real (English 6, Workout 3, Read 11).
  const thisWeek = weekDays(mon, settings.statementDay);
  const history: { id: string; weeks: number; days: number; from: number; to: number }[] = [
    { id: 'english', weeks: 6, days: 5, from: h(7, 30), to: h(8) },
    { id: 'workout', weeks: 3, days: 4, from: h(18), to: h(18, 45) },
    { id: 'read', weeks: 11, days: 5, from: h(20), to: h(20, 30) },
  ];
  for (const item of history) {
    for (let w = 1; w <= item.weeks + 1; w++) {
      const first = addDays(thisWeek[0], -7 * w);
      // The week before the streak only half-meets the target, so the streak starts there.
      const days = w === item.weeks + 1 ? Math.max(1, item.days - 3) : item.days;
      for (let d = 0; d < days; d++) add(item.id, addDays(first, d), item.from, item.to);
    }
  }

  return {
    settings,
    activities,
    sessions: sessions.sort((a, b) => a.start - b.start),
    restDays: [{ activityId: 'workout', day: tue }],
    daysOff: [],
  };
}
