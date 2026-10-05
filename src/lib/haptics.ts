import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const on = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap for selections and toggles. */
export const tap = () => {
  if (on) Haptics.selectionAsync().catch(() => {});
};

/** Firmer bump for starting or stopping a timer. */
export const bump = () => {
  if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
};

/** Success pattern, used once when the sphere fills. */
export const success = () => {
  if (on) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
};
