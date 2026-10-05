import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

/**
 * The 1440 Supabase project. The publishable key is meant to live in the app:
 * what people can read or write is decided by the database's privacy rules, not by this key.
 */
export const SUPABASE_URL = 'https://qkmuucwhkfsqhxfvsfmj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_9QNEO4pzZ4jEC2RS0FIvvA_HqumMvFe';

let client: SupabaseClient | null = null;

/** Created on first use, so static web rendering (no window) never touches storage. */
export function supabase(): SupabaseClient {
  if (client) return client;
  client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  if (Platform.OS !== 'web') {
    // Refresh the session only while the app is open.
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client?.auth.startAutoRefresh();
      else client?.auth.stopAutoRefresh();
    });
  }
  return client;
}
