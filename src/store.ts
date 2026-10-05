import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { checkLog, newId, type LogCheck } from '@/logic/log';
import { makeSampleData } from '@/logic/sample';
import type { Activity, AppData, Session, Settings } from '@/logic/types';

const MIN = 60_000;

export interface Toast {
  id: string;
  message: string;
  /** Snapshot to restore when Undo is tapped. */
  undo?: AppData;
}

interface State {
  data: AppData | null;
  toast: Toast | null;
  /** Sets up a fresh day from onboarding. */
  finishOnboarding: (settings: Settings, activities: Omit<Activity, 'id' | 'createdAt'>[]) => void;
  loadSampleWeek: () => void;
  reset: () => void;
  addActivity: (a: Omit<Activity, 'id' | 'createdAt'>) => void;
  startTimer: (activityId: string) => void;
  stopTimer: () => void;
  logSession: (activityId: string, start: number, end: number, replaceId?: string) => LogCheck;
  deleteSession: (id: string) => void;
  dismissToast: () => void;
  undo: () => void;
}

const nameOf = (data: AppData, id: string) => data.activities.find((a) => a.id === id)?.name ?? 'activity';
const toastOf = (message: string, undo?: AppData): Toast => ({ id: newId(), message, undo });

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      data: null,
      toast: null,

      finishOnboarding: (settings, activities) => {
        const now = Date.now();
        set({
          data: {
            settings,
            activities: activities.map((a) => ({ ...a, id: newId(), createdAt: now })),
            sessions: [],
            restDays: [],
            daysOff: [],
          },
        });
      },

      loadSampleWeek: () => {
        const prev = get().data;
        set({ data: makeSampleData(Date.now()), toast: prev ? toastOf('Sample week loaded.', prev) : null });
      },

      reset: () => set({ data: null, toast: null }),

      addActivity: (a) => {
        const data = get().data;
        if (!data) return;
        set({ data: { ...data, activities: [...data.activities, { ...a, id: newId(), createdAt: Date.now() }] } });
      },

      startTimer: (activityId) => {
        const data = get().data;
        if (!data) return;
        const now = Date.now();
        const running = data.sessions.find((s) => s.end === null);
        if (running?.activityId === activityId) return;
        let sessions = data.sessions;
        let message = `Started ${nameOf(data, activityId)}.`;
        if (running) {
          const mins = Math.round((now - running.start) / MIN);
          sessions = mins < 1 ? sessions.filter((s) => s.id !== running.id) : sessions.map((s) => (s.id === running.id ? { ...s, end: now } : s));
          message = mins < 1 ? message : `Saved ${mins} min of ${nameOf(data, running.activityId)}. Started ${nameOf(data, activityId)}.`;
        }
        const next: Session = { id: newId(), activityId, start: now, end: null };
        set({ data: { ...data, sessions: [...sessions, next] }, toast: running ? toastOf(message, data) : null });
      },

      stopTimer: () => {
        const data = get().data;
        if (!data) return;
        const running = data.sessions.find((s) => s.end === null);
        if (!running) return;
        const now = Date.now();
        const mins = Math.round((now - running.start) / MIN);
        const name = nameOf(data, running.activityId);
        if (mins < 1) {
          set({ data: { ...data, sessions: data.sessions.filter((s) => s.id !== running.id) }, toast: toastOf('Under a minute, not saved.', data) });
          return;
        }
        set({
          data: { ...data, sessions: data.sessions.map((s) => (s.id === running.id ? { ...s, end: now } : s)) },
          toast: toastOf(`Saved ${mins} min of ${name}.`, data),
        });
      },

      logSession: (activityId, start, end, replaceId) => {
        const data = get().data;
        if (!data) return { ok: false, reason: 'invalid' };
        const base = replaceId ? { ...data, sessions: data.sessions.filter((s) => s.id !== replaceId) } : data;
        const check = checkLog(base, start, end, Date.now());
        if (!check.ok) return check;
        const session: Session = { id: newId(), activityId, start, end };
        const mins = Math.round((end - start) / MIN);
        set({ data: { ...base, sessions: [...base.sessions, session].sort((a, b) => a.start - b.start) }, toast: toastOf(`Logged ${mins} min of ${nameOf(data, activityId)}.`, data) });
        return check;
      },

      deleteSession: (id) => {
        const data = get().data;
        if (!data) return;
        set({ data: { ...data, sessions: data.sessions.filter((s) => s.id !== id) }, toast: toastOf('Session deleted.', data) });
      },

      dismissToast: () => set({ toast: null }),

      undo: () => {
        const t = get().toast;
        if (t?.undo) set({ data: t.undo, toast: null });
      },
    }),
    {
      name: 'app-1440',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ data: s.data }),
    },
  ),
);

/** Re-renders every `ms` so time-based numbers stay current. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** True once the saved data has been read from the phone. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useApp.persist.onFinishHydration(onChange),
    () => useApp.persist.hasHydrated(),
    () => false,
  );
}
