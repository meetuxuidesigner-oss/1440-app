import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/store';
import { color, radius, type } from '@/theme';

const SHOW_MS = 4500;

/** One toast at a time, above the tab bar. Undo is always one tap away. */
export function ToastHost() {
  const toast = useApp((s) => s.toast);
  const dismiss = useApp((s) => s.dismissToast);
  const undo = useApp((s) => s.undo);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(dismiss, SHOW_MS);
    return () => clearTimeout(id);
  }, [toast, dismiss]);

  if (!toast) return null;
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', paddingBottom: insets.bottom + 92 }]}>
      <Animated.View
        key={toast.id}
        entering={FadeInDown.springify().damping(18)}
        exiting={FadeOutDown.duration(180)}
        accessibilityLiveRegion="polite"
        style={styles.toast}>
        <Text style={styles.text} numberOfLines={2}>
          {toast.message}
        </Text>
        {toast.undo ? (
          <Pressable accessibilityRole="button" hitSlop={10} onPress={undo}>
            <Text style={styles.undo}>Undo</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    marginHorizontal: 16,
    alignSelf: 'center',
    maxWidth: 480,
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: color.surface3,
    borderWidth: 1,
    borderColor: color.glassStroke,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  text: { ...type.body14, color: color.text, flex: 1 },
  undo: { ...type.body14Medium, color: color.green, fontFamily: type.body15Semi.fontFamily },
});
