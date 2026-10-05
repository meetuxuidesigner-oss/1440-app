import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useApp } from '@/store';

import * as api from './api';
import { buildSnapshot, snapshotKey } from './snapshot';
import type { Circle, CirclePreview, Profile } from './types';

interface SocialState {
  me: Profile | null;
  circles: Circle[];
  /** Which of my activities each circle sees. Missing or empty = nothing (private by default). */
  shares: Record<string, string[]>;
  /** Last snapshot uploaded per circle, so unchanged weeks aren't re-sent. */
  published: Record<string, string>;
  loading: boolean;
  error: string | null;
  lastLoaded: number;

  signIn: (name: string) => Promise<Profile>;
  refresh: () => Promise<void>;
  createCircle: (name: string, shared: string[]) => Promise<string>;
  preview: (code: string) => Promise<CirclePreview | null>;
  joinCircle: (code: string, shared: string[]) => Promise<string>;
  setShares: (circleId: string, shared: string[]) => Promise<void>;
  toggleKudos: (circleId: string, to: string, target: string) => Promise<void>;
  leave: (circleId: string) => Promise<void>;
  publish: (force?: boolean) => Promise<void>;
  clearError: () => void;
}

export const useSocial = create<SocialState>()(
  persist(
    (set, get) => ({
      me: null,
      circles: [],
      shares: {},
      published: {},
      loading: false,
      error: null,
      lastLoaded: 0,

      signIn: async (name) => {
        const me = await api.signIn(name);
        set({ me });
        return me;
      },

      refresh: async () => {
        if (!get().me) return;
        set({ loading: true });
        try {
          const circles = await api.loadCircles();
          set({ circles, error: null, lastLoaded: Date.now() });
        } catch (e) {
          set({ error: api.friendlyError(e) });
        } finally {
          set({ loading: false });
        }
      },

      createCircle: async (name, shared) => {
        const id = await api.createCircle(name);
        set({ shares: { ...get().shares, [id]: shared } });
        await get().publish(true);
        await get().refresh();
        return id;
      },

      preview: (code) => api.previewCircle(code),

      joinCircle: async (code, shared) => {
        const id = await api.joinCircle(code);
        set({ shares: { ...get().shares, [id]: shared } });
        await get().publish(true);
        await get().refresh();
        return id;
      },

      setShares: async (circleId, shared) => {
        set({ shares: { ...get().shares, [circleId]: shared } });
        await get().publish(true);
        await get().refresh();
      },

      toggleKudos: async (circleId, to, target) => {
        const me = get().me;
        if (!me) return;
        const circle = get().circles.find((c) => c.id === circleId);
        if (!circle) return;
        const given = circle.kudos.some((k) => k.from === me.id && k.to === to && k.target === target);
        // Update the screen first, then the server. Roll back if the server says no.
        const before = get().circles;
        const kudos = given
          ? circle.kudos.filter((k) => !(k.from === me.id && k.to === to && k.target === target))
          : [...circle.kudos, { circleId, from: me.id, to, target, createdAt: new Date().toISOString() }];
        set({ circles: before.map((c) => (c.id === circleId ? { ...c, kudos } : c)) });
        try {
          if (given) await api.takeBackKudos(circleId, me.id, to, target);
          else await api.giveKudos(circleId, me.id, to, target);
        } catch (e) {
          set({ circles: before, error: api.friendlyError(e) });
        }
      },

      leave: async (circleId) => {
        const me = get().me;
        if (!me) return;
        await api.leaveCircle(circleId, me.id);
        const { [circleId]: _gone, ...shares } = get().shares;
        set({ shares, circles: get().circles.filter((c) => c.id !== circleId) });
      },

      publish: async (force) => {
        const { me, circles, shares, published } = get();
        const data = useApp.getState().data;
        if (!me || !data) return;
        const ids = new Set([...circles.map((c) => c.id), ...Object.keys(shares)]);
        const next = { ...published };
        for (const circleId of ids) {
          const snapshot = buildSnapshot(data, shares[circleId] ?? [], Date.now());
          const key = snapshotKey(snapshot);
          if (!force && next[circleId] === key) continue;
          try {
            await api.publishSnapshot(circleId, me.id, snapshot);
            next[circleId] = key;
          } catch {
            // Not a member any more, or offline: try again next time.
          }
        }
        set({ published: next });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'app-1440-social',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ me: s.me, circles: s.circles, shares: s.shares, published: s.published }),
    },
  ),
);

/** Start over: forget circles on this phone (the account stays on the server). */
export function resetSocial() {
  useSocial.setState({ me: null, circles: [], shares: {}, published: {}, error: null });
}
