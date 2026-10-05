import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useApp } from '@/store';

import { useSocial } from './store';

const PUBLISH_DELAY = 3000;
const REFRESH_EVERY = 60_000;

/**
 * Keeps circles fresh in the background:
 * shares my ✓ days a few seconds after anything changes, and fetches friends' weeks
 * when the app opens and once a minute while it stays open.
 */
export function useSocialSync() {
  useEffect(() => {
    const start = () => {
      const { refresh, publish } = useSocial.getState();
      refresh().then(() => publish());
    };
    let unsubHydrate = () => {};
    if (useSocial.persist.hasHydrated()) start();
    else unsubHydrate = useSocial.persist.onFinishHydration(start);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubData = useApp.subscribe((s, prev) => {
      if (s.data === prev.data) return;
      clearTimeout(timer);
      timer = setTimeout(() => useSocial.getState().publish(), PUBLISH_DELAY);
    });

    const interval = setInterval(() => {
      if (AppState.currentState === 'active') useSocial.getState().refresh();
    }, REFRESH_EVERY);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const s = useSocial.getState();
        s.refresh().then(() => s.publish());
      }
    });

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      unsubData();
      unsubHydrate();
      sub.remove();
    };
  }, []);
}
