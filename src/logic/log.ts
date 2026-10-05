import type { AppData, Session } from './types';

const MIN = 60_000;
export const MAX_BACKFILL_DAYS = 7;

export type LogCheck =
  | { ok: true }
  | { ok: false; reason: 'future' | 'tooOld' | 'tooShort' | 'invalid' }
  | { ok: false; reason: 'overlap'; with: Session };

/**
 * Rules for adding or editing a session by hand:
 * no future times, at most 7 days back (so streaks can't be rewritten), at least 1 minute, no overlaps.
 */
export function checkLog(data: AppData, start: number, end: number, now: number, ignoreId?: string): LogCheck {
  if (!(end > start)) return { ok: false, reason: 'invalid' };
  if (end > now + MIN / 2) return { ok: false, reason: 'future' };
  if (start < now - MAX_BACKFILL_DAYS * 24 * 60 * MIN) return { ok: false, reason: 'tooOld' };
  if (end - start < MIN) return { ok: false, reason: 'tooShort' };
  const clash = data.sessions.find((s) => s.id !== ignoreId && start < (s.end ?? now) && end > s.start);
  if (clash) return { ok: false, reason: 'overlap', with: clash };
  return { ok: true };
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
