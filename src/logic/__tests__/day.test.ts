import { describe, expect, it } from '@jest/globals';
import { arcSegments, awakeFraction, dailyFill, minutesOn, weekResult, weeklyStreak, weekMarks } from '../day';
import { DEFAULT_SETTINGS, makeSampleData } from '../sample';
import { atClock, dayOf, formatDuration } from '../time';
import type { AppData } from '../types';

// Thursday 24 Sept 2026, 2:18 pm: the moment every design screen shows.
const NOW = new Date(2026, 8, 24, 14, 18).getTime();
const TODAY = '2026-09-24';

const sample = () => makeSampleData(NOW);
const act = (data: AppData, id: string) => data.activities.find((a) => a.id === id)!;

describe('day boundaries', () => {
  it('runs from wake time to wake time, not midnight to midnight', () => {
    expect(dayOf(atClock('2026-09-24', 7 * 60), DEFAULT_SETTINGS)).toBe('2026-09-24');
    expect(dayOf(atClock('2026-09-25', 0 * 60 + 40), DEFAULT_SETTINGS)).toBe('2026-09-24');
    expect(dayOf(atClock('2026-09-25', 6 * 60 + 59), DEFAULT_SETTINGS)).toBe('2026-09-24');
  });
});

describe('sample week matches the designs', () => {
  it('fills the sphere to 95 of 105 min (90%) in English, Workout, Read order', () => {
    const fill = dailyFill(sample(), TODAY, NOW);
    expect(fill.state).toBe('filling');
    expect(fill.wellSpent).toBe(95);
    expect(fill.target).toBe(105);
    expect(Math.round(fill.fraction * 100)).toBe(90);
    expect(fill.layers.map((l) => l.activityId)).toEqual(['english', 'workout', 'read']);
    expect(formatDuration(fill.wellSpent)).toBe('1h 35m');
  });

  it('adds up to 355 min this week', () => {
    const data = sample();
    const week = ['2026-09-21', '2026-09-22', '2026-09-23', TODAY];
    const total = data.activities.reduce((sum, a) => sum + week.reduce((s, d) => s + minutesOn(data, d, a.id, NOW), 0), 0);
    expect(total).toBe(355);
  });

  it('shows 3 of 5, 3 of 4 and 3 of 5 days done', () => {
    const data = sample();
    expect(weekResult(data, act(data, 'english'), TODAY, NOW).done).toBe(3);
    expect(weekResult(data, act(data, 'workout'), TODAY, NOW).done).toBe(3);
    expect(weekResult(data, act(data, 'read'), TODAY, NOW).done).toBe(3);
  });

  it('has streaks of 6, 3 and 11 weeks', () => {
    const data = sample();
    expect(weeklyStreak(data, act(data, 'english'), TODAY, NOW)).toBe(6);
    expect(weeklyStreak(data, act(data, 'workout'), TODAY, NOW)).toBe(3);
    expect(weeklyStreak(data, act(data, 'read'), TODAY, NOW)).toBe(11);
  });

  it('marks Workout Tuesday as rest, not a gap', () => {
    const data = sample();
    const marks = weekMarks(data, act(data, 'workout'), TODAY, NOW).map((m) => m.mark);
    expect(marks).toEqual(['done', 'rest', 'done', 'done', 'upcoming', 'upcoming', 'upcoming']);
  });

  it('places sessions on the awake arc', () => {
    const data = sample();
    expect(awakeFraction(data, TODAY, NOW)).toBeCloseTo(7.3 / 16, 3);
    expect(arcSegments(data, TODAY, NOW)).toHaveLength(3);
  });
});

describe('the sphere never overfills', () => {
  it('caps each activity at its daily target but keeps the honest total', () => {
    const data = sample();
    const evening = new Date(2026, 8, 24, 18, 40).getTime();
    data.sessions.push(
      { id: 'x1', activityId: 'read', start: atClock(TODAY, 17 * 60 + 30), end: atClock(TODAY, 18 * 60 + 10) },
      { id: 'x2', activityId: 'english', start: atClock(TODAY, 16 * 60), end: atClock(TODAY, 16 * 60 + 5) },
    );
    const fill = dailyFill(data, TODAY, evening);
    expect(fill.state).toBe('full');
    expect(fill.fraction).toBe(1);
    expect(fill.wellSpent).toBe(140);
  });
});

describe('which activities count today', () => {
  it('drops an activity on its planned rest day', () => {
    const data = sample();
    data.restDays.push({ activityId: 'read', day: TODAY });
    const fill = dailyFill(data, TODAY, NOW);
    expect(fill.target).toBe(75);
    expect(fill.included.map((a) => a.id)).toEqual(['english', 'workout']);
  });

  it('drops an activity whose weekly target was met before today, but still counts its time', () => {
    const data = sample();
    act(data, 'workout').daysPerWeek = 2;
    const fill = dailyFill(data, TODAY, NOW);
    expect(fill.target).toBe(60);
    expect(fill.wellSpent).toBe(95);
  });

  it('pauses everything on a Day Off', () => {
    const data = sample();
    data.daysOff.push(TODAY);
    expect(dailyFill(data, TODAY, NOW).state).toBe('dayOff');
  });

  it('shrinks the weekly target to fit Days Off (5 of 7 with 3 off = 2 of 4)', () => {
    const data = sample();
    data.daysOff.push('2026-09-25', '2026-09-26', '2026-09-27');
    const w = weekResult(data, act(data, 'english'), TODAY, NOW);
    expect(w.available).toBe(4);
    expect(w.target).toBe(2);
    expect(w.met).toBe(true);
  });

  it('does not count time inside the sleep window', () => {
    const data = sample();
    data.sessions.push({ id: 'late', activityId: 'read', start: atClock(TODAY, 23 * 60 + 10), end: atClock('2026-09-25', 30) });
    const late = atClock('2026-09-25', 60);
    expect(minutesOn(data, TODAY, 'read', late)).toBe(20);
  });
});
