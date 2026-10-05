import { describe, expect, it } from '@jest/globals';

import { makeSampleData } from '@/logic/sample';

import { buildSnapshot, momentsOf } from '../snapshot';
import type { Circle } from '../types';

const NOW = new Date(2026, 8, 24, 14, 18).getTime();
const data = makeSampleData(NOW);

describe('what a circle can see', () => {
  it('only includes activities switched on for that circle', () => {
    expect(buildSnapshot(data, [], NOW).activities).toEqual([]);
    expect(buildSnapshot(data, ['english'], NOW).activities.map((a) => a.id)).toEqual(['english']);
  });

  it('shares ✓ days and streaks, never minutes or times', () => {
    const snap = buildSnapshot(data, ['english', 'workout', 'read'], NOW);
    const english = snap.activities.find((a) => a.id === 'english')!;
    expect(english).toMatchObject({ done: 3, target: 5, met: false, streak: 6 });
    expect(english.marks).toHaveLength(7);
    const workout = buildSnapshot(data, ['workout'], NOW).activities[0];
    expect(workout.marks).not.toContain('gap');
    const text = JSON.stringify(snap);
    expect(text).not.toMatch(/minute|dailyTarget|start|end|session/i);
    expect(Object.keys(english).sort()).toEqual(['color', 'done', 'id', 'marks', 'met', 'name', 'streak', 'target']);
  });

  it('turns weeks into calm, positive moments', () => {
    const circle: Circle = {
      id: 'c',
      name: 'Test',
      inviteCode: 'ABC123',
      ownerId: 'me',
      createdAt: '',
      kudos: [],
      members: [
        { id: 'me', name: 'Meet', joinedAt: '', snapshot: buildSnapshot(data, ['english'], NOW) },
        { id: 'riya', name: 'Riya Shah', joinedAt: '', snapshot: buildSnapshot(data, ['english', 'read'], NOW) },
      ],
    };
    const moments = momentsOf(circle, 'me');
    expect(moments.map((m) => m.text)).toEqual(['Riya is on an 11-week Read streak', 'Riya is on a 6-week Learn English streak']);
  });
});
