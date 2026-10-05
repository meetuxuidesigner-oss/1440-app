import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { tap } from '@/lib/haptics';
import { color, radius, type } from '@/theme';

import { Icon } from '../ui/Icon';
import { Press } from '../ui/Press';

/**
 * One tap to cheer, tap again to take it back.
 * Signature moment: a soft ripple spreads out when kudos is sent.
 */
export function KudosButton({ sent, count, onPress, label }: { sent: boolean; count: number; onPress: () => void; label: string }) {
  const reduced = useReducedMotion();
  const ripple = useSharedValue(0);
  const ring = useAnimatedStyle(() => ({
    opacity: ripple.value === 0 ? 0 : 0.55 * (1 - ripple.value),
    transform: [{ scale: 1 + ripple.value * 1.4 }],
  }));

  return (
    <View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, ring]} />
      <Press
        accessibilityRole="button"
        accessibilityState={{ selected: sent }}
        accessibilityLabel={sent ? `Take back kudos for ${label}` : `Send kudos for ${label}`}
        hitSlop={6}
        onPress={() => {
          tap();
          if (!sent && !reduced) {
            ripple.set(0);
            ripple.set(withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
          }
          onPress();
        }}
        style={[styles.button, sent && styles.sent]}>
        <Icon name="sparkle" size={15} filled={sent} color={sent ? color.green : color.textSecondary} />
        <Text style={[styles.text, sent && { color: color.green }]}>{count > 0 ? count : 'Kudos'}</Text>
      </Press>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 34,
    minWidth: 44,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sent: { backgroundColor: color.greenSoft, borderColor: 'rgba(54,214,94,0.45)' },
  text: { ...type.body12Semi, color: color.textSecondary },
  ring: { borderRadius: radius.full, borderWidth: 2, borderColor: color.green },
});
