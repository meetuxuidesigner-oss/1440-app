import type { BottomTabBarProps } from 'expo-router/tabs';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tap } from '@/lib/haptics';
import { color, radius, type } from '@/theme';

import { Icon, type IconName } from './Icon';

const ICONS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  week: { icon: 'week', label: 'Week' },
  circles: { icon: 'circles', label: 'Circles' },
  you: { icon: 'you', label: 'You' },
};

/** Floating pill tab bar. Four tabs only: the timer lives on Home, not in a fifth tab. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={meta.label}
              onPress={() => {
                const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) {
                  tap();
                  navigation.navigate(route.name);
                }
              }}
              style={[styles.tab, focused && styles.tabOn]}>
              <Icon name={meta.icon} size={22} filled={focused} color={focused ? color.text : color.textSecondary} />
              <Text style={[styles.label, focused && styles.labelOn]}>{meta.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    gap: 2,
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: Platform.OS === 'android' ? '#1C1C20' : 'rgba(28,28,32,0.94)',
    borderWidth: 1,
    borderColor: color.glassStroke,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  tab: { width: 76, height: 54, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', gap: 2 },
  tabOn: { backgroundColor: 'rgba(255,255,255,0.10)' },
  label: { ...type.body12Semi, fontSize: 11, lineHeight: 14, color: color.textSecondary },
  labelOn: { color: color.text },
});
