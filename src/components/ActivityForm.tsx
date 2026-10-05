import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { tap } from '@/lib/haptics';
import { formatDuration } from '@/logic/time';
import type { ActivityColor } from '@/logic/types';
import { activityColor, activityColorOrder, color, radius, type } from '@/theme';

import { Icon } from './ui/Icon';
import { Press } from './ui/Press';

export interface ActivityDraft {
  name: string;
  color: ActivityColor;
  dailyTarget: number;
  daysPerWeek: number;
}

export const TARGET_PRESETS = [15, 20, 30, 45, 60];
const MIN_TARGET = 5;
const MAX_TARGET = 240;

export const isDraftValid = (d: ActivityDraft) => d.name.trim().length > 0 && d.dailyTarget >= MIN_TARGET;

function Chip({ label, on, onPress, wide }: { label: string; on: boolean; onPress: () => void; wide?: boolean }) {
  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={() => {
        tap();
        onPress();
      }}
      style={[styles.chip, wide && { flex: 1 }, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Press>
  );
}

/**
 * Name, colour, daily target and days per week.
 * The daily target is required: it decides how much of today's sphere this activity fills.
 */
export function ActivityForm({ value, onChange, autoFocus }: { value: ActivityDraft; onChange: (d: ActivityDraft) => void; autoFocus?: boolean }) {
  const set = (patch: Partial<ActivityDraft>) => onChange({ ...value, ...patch });
  const tint = activityColor[value.color];
  const step = (delta: number) => {
    tap();
    set({ dailyTarget: Math.min(MAX_TARGET, Math.max(MIN_TARGET, value.dailyTarget + delta)) });
  };

  return (
    <View style={{ gap: 22 }}>
      <View style={[styles.nameBox, { borderColor: value.name ? tint : color.glassStroke }]}>
        <View style={[styles.swatch, { backgroundColor: tint }]} />
        <TextInput
          value={value.name}
          onChangeText={(name) => set({ name })}
          placeholder="e.g. Learn Spanish"
          placeholderTextColor={color.textMuted}
          style={styles.name}
          autoFocus={autoFocus}
          maxLength={32}
          returnKeyType="done"
          accessibilityLabel="Activity name"
        />
      </View>

      <View style={styles.colors} accessibilityRole="radiogroup" accessibilityLabel="Colour">
        {activityColorOrder.map((c) => (
          <Press
            key={c}
            accessibilityRole="radio"
            accessibilityLabel={c}
            accessibilityState={{ selected: value.color === c }}
            onPress={() => {
              tap();
              set({ color: c });
            }}
            style={[styles.color, value.color === c && { borderColor: activityColor[c] }]}>
            <View style={[styles.colorFill, { backgroundColor: activityColor[c] }]} />
          </Press>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>Daily target</Text>
        <View style={styles.stepper}>
          <Press accessibilityRole="button" accessibilityLabel="5 minutes less" onPress={() => step(-5)} style={styles.stepBtn}>
            <Text style={styles.stepSign}>−</Text>
          </Press>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={styles.stepValue} accessibilityLiveRegion="polite">
              {formatDuration(value.dailyTarget)}
            </Text>
            <Text style={styles.stepHint}>a day</Text>
          </View>
          <Press accessibilityRole="button" accessibilityLabel="5 minutes more" onPress={() => step(5)} style={styles.stepBtn}>
            <Icon name="plus" size={20} />
          </Press>
        </View>
        <View style={styles.chips}>
          {TARGET_PRESETS.map((m) => (
            <Chip key={m} wide label={`${m}m`} on={value.dailyTarget === m} onPress={() => set({ dailyTarget: m })} />
          ))}
        </View>
        <Text style={styles.help}>Pick an amount you can keep on a busy day. Small and steady beats big and rare.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>Days a week</Text>
        <View style={styles.chips}>
          {[3, 4, 5, 6, 7].map((n) => (
            <Chip key={n} wide label={String(n)} on={value.daysPerWeek === n} onPress={() => set({ daysPerWeek: n })} />
          ))}
        </View>
        <Text style={styles.help}>
          {value.daysPerWeek === 7
            ? 'Every day, no planned rest. You can still take a Day Off.'
            : `${7 - value.daysPerWeek} rest ${7 - value.daysPerWeek === 1 ? 'day' : 'days'} built in. Rest keeps the streak, it doesn't break it.`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 60,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    backgroundColor: color.surface1,
    borderWidth: 1.5,
  },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  name: { flex: 1, ...type.body16Semi, color: color.text, height: '100%', ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null) },
  colors: { flexDirection: 'row', justifyContent: 'space-between' },
  color: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  colorFill: { width: 28, height: 28, borderRadius: 14 },
  label: { ...type.body15Semi, color: color.text },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: radius.lg,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  stepBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface3, alignItems: 'center', justifyContent: 'center' },
  stepSign: { fontSize: 24, lineHeight: 26, color: color.text, fontFamily: type.body16.fontFamily },
  stepValue: { ...type.heading24, color: color.text, fontVariant: ['tabular-nums'] },
  stepHint: { ...type.body12Semi, color: color.textSecondary, marginTop: -2 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: color.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOn: { backgroundColor: color.greenSoft, borderColor: color.green },
  chipText: { ...type.body14Medium, color: color.textSecondary },
  chipTextOn: { color: color.green },
  help: { ...type.body13, color: color.textSecondary },
});

export { Chip };
