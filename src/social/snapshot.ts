import { activeActivities, weekMarks, weekResult, weeklyStreak } from '@/logic/day';
import { dayAt } from '@/logic/schedule';
import { weekDays } from '@/logic/time';
import type { AppData } from '@/logic/types';

import type { Circle, Member, SharedActivity, Snapshot } from './types';

/**
 * Builds what a circle is allowed to see. Only the activities chosen for that circle,
 * and for each one only ✓ days and the streak. Minutes are never included.
 */
export function buildSnapshot(data: AppData, sharedIds: string[], now: number): Snapshot {
  const today = dayAt(data, now);
  const week = weekDays(today, data.settings.statementDay)[0];
  const activities: SharedActivity[] = activeActivities(data)
    .filter((a) => sharedIds.includes(a.id))
    .map((a) => {
      const w = weekResult(data, a, today, now);
      return {
        id: a.id,
        name: a.name,
        color: a.color,
        // A missed day is shown to friends as a plain blank day, never as a miss.
        marks: weekMarks(data, a, today, now).map((m) => (m.mark === 'gap' ? 'blank' : m.mark)),
        done: w.done,
        target: w.target,
        met: w.met,
        streak: weeklyStreak(data, a, today, now),
      };
    });
  return { week, activities, updatedAt: now };
}

/** Stable key so we only upload when something friends can see actually changed. */
export function snapshotKey(s: Snapshot): string {
  return JSON.stringify({ week: s.week, activities: s.activities });
}

export interface Moment {
  key: string;
  member: Member;
  activity: SharedActivity;
  week: string;
  text: string;
}

/** "an 8-week", "an 11-week", "a 6-week" */
const article = (n: number) => (n === 11 || n === 18 || String(n).startsWith('8') ? 'an' : 'a');

/** Calm, positive moments only. Missed days are never announced. */
export function momentsOf(circle: Circle, meId: string | undefined): Moment[] {
  const out: Moment[] = [];
  for (const member of circle.members) {
    if (member.id === meId || !member.snapshot) continue;
    const first = member.name.split(' ')[0];
    for (const a of member.snapshot.activities) {
      let text: string | null = null;
      if (a.met) text = `${first} finished their ${a.name} week · ${a.done} of ${a.target} days`;
      else if (a.streak >= 2) text = `${first} is on ${article(a.streak)} ${a.streak}-week ${a.name} streak`;
      else if (a.done > 0) text = `${first} has ${a.done} of ${a.target} ${a.name} days this week`;
      if (text) out.push({ key: `${member.id}:${a.id}`, member, activity: a, week: member.snapshot.week, text });
    }
  }
  return out.sort((x, y) => Number(y.activity.met) - Number(x.activity.met) || y.activity.streak - x.activity.streak);
}

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
