import { describe, expect, it } from '@jest/globals';

import { dailyFill, weeklyStreak } from '../day';
import { makeSampleData } from '../sample';
import { changeSchedule, dayAt, pendingSchedule, whenScheduleStarts, windowOf } from '../schedule';
import { addDays } from '../time';

const NOW = new Date(2026, 8, 24, 14, 18).getTime(); // Thu 24 Sept, 2:18 pm
const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m).getTime();
const hm = (h: number, m = 0) => h * 60 + m;

describe('changing wake and sleep times', () => {
  const data = makeSampleData(NOW);
  const today = '2026-09-24';

  it('starts tomorrow when today already has tracked time, and never rewrites the past', () => {
    expect(whenScheduleStarts(data, NOW)).toBe('tomorrow');
    const next = changeSchedule(data, hm(6), hm(22), NOW);

    // Today and earlier days keep the times they were lived with.
    expect(windowOf(next, today).start).toBe(at(24, 7));
    expect(windowOf(next, today).sleepStart).toBe(at(24, 23));
    expect(dailyFill(next, today, NOW)).toMatchObject({ wellSpent: 95, target: 105 });
    expect(next.activities.map((a) => weeklyStreak(next, a, today, NOW))).toEqual([6, 3, 11]);

    // Tomorrow uses the new times.
    expect(windowOf(next, addDays(today, 1)).start).toBe(at(25, 6));
    expect(windowOf(next, addDays(today, 1)).sleepStart).toBe(at(25, 22));
    expect(pendingSchedule(next, NOW)).toEqual({ wake: hm(6), sleep: hm(22), from: at(25, 7) });
    expect(pendingSchedule(next, at(25, 9))).toBeNull();
  });

  it('keeps every moment in exactly one day when the wake time moves later', () => {
    const next = changeSchedule(data, hm(8), hm(23), NOW);
    expect(dayAt(next, at(25, 6, 59))).toBe(today);
    expect(dayAt(next, at(25, 7, 30))).toBe(today); // still asleep: the old day stretches to the new wake time
    expect(dayAt(next, at(25, 8))).toBe('2026-09-25');
    expect(windowOf(next, '2026-09-25').start).toBe(at(25, 8));
  });

  it('applies right away when nothing is tracked yet today', () => {
    const empty = { ...data, sessions: data.sessions.filter((s) => dayAt(data, s.start) !== today) };
    expect(whenScheduleStarts(empty, NOW)).toBe('today');
    const next = changeSchedule(empty, hm(6, 30), hm(22, 30), NOW);
    expect(windowOf(next, today).start).toBe(at(24, 6, 30));
    expect(windowOf(next, '2026-09-23').start).toBe(at(23, 7));
    expect(pendingSchedule(next, NOW)).toBeNull();
  });

  it('cancels a pending change when the old times are chosen again', () => {
    const changed = changeSchedule(data, hm(6), hm(22), NOW);
    const back = changeSchedule(changed, hm(7), hm(23), NOW);
    expect(pendingSchedule(back, NOW)).toBeNull();
    expect(back.settings).toMatchObject({ wake: hm(7), sleep: hm(23) });
    expect(windowOf(back, addDays(today, 1)).start).toBe(at(25, 7));
  });

  it('remembers several changes in a row', () => {
    const first = changeSchedule(data, hm(6), hm(22), NOW);
    const later = at(30, 12); // next Wednesday, with nothing tracked yet that day
    const second = changeSchedule(first, hm(8), hm(0), later);
    expect(windowOf(second, today).start).toBe(at(24, 7));
    expect(windowOf(second, '2026-09-28').start).toBe(at(28, 6));
    expect(windowOf(second, '2026-09-30').start).toBe(at(30, 8));
    expect(windowOf(second, '2026-09-30').sleepStart).toBe(new Date(2026, 9, 1, 0, 0).getTime());
  });
});
