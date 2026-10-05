import type { DayMark } from '@/logic/day';
import type { ActivityColor, DayKey } from '@/logic/types';

/** What one shared activity shows a circle: ✓ days and streaks. Never minutes. */
export interface SharedActivity {
  id: string;
  name: string;
  color: ActivityColor;
  /** Mon–Sun of this week. */
  marks: DayMark[];
  /** Days the target was met this week. */
  done: number;
  /** Days the week asks for. */
  target: number;
  met: boolean;
  /** Weeks in a row. */
  streak: number;
}

export interface Snapshot {
  /** First day of the week the marks belong to. */
  week: DayKey;
  activities: SharedActivity[];
  updatedAt: number;
}

export interface Profile {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  joinedAt: string;
  snapshot: Snapshot | null;
}

export interface Kudos {
  circleId: string;
  from: string;
  to: string;
  /** `${activityId}:${weekStart}` */
  target: string;
  createdAt: string;
}

export interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  members: Member[];
  kudos: Kudos[];
}

export interface CirclePreview {
  id: string;
  name: string;
  owner: string;
  members: string[];
  full: boolean;
}

export const MAX_MEMBERS = 10;

export const kudosTarget = (activityId: string, week: DayKey) => `${activityId}:${week}`;
