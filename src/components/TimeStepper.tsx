import { StyleSheet, Text, View } from 'react-native';

import { tap } from '@/lib/haptics';
import { formatClockMin } from '@/logic/time';
import { color, radius, type } from '@/theme';

import { Icon } from './ui/Icon';
import { Press } from './ui/Press';

/** Wake or sleep time, in 30-minute steps. */
export function TimeStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const step = (d: number) => {
    tap();
    onChange((value + d + 1440) % 1440);
  };
  return (
    <View style={styles.time}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.timeRow}>
        <Press accessibilityRole="button" accessibilityLabel={`${label} 30 minutes earlier`} onPress={() => step(-30)} style={styles.timeBtn}>
          <Text style={styles.timeSign}>−</Text>
        </Press>
        <Text style={styles.timeValue} accessibilityLiveRegion="polite">
          {formatClockMin(value)}
        </Text>
        <Press accessibilityRole="button" accessibilityLabel={`${label} 30 minutes later`} onPress={() => step(30)} style={styles.timeBtn}>
          <Icon name="plus" size={18} />
        </Press>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  time: { flex: 1, padding: 12, borderRadius: radius.lg, backgroundColor: color.surface1, borderWidth: 1, borderColor: color.hairline, gap: 8 },
  timeLabel: { ...type.body13, color: color.textSecondary, textAlign: 'center' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface3, alignItems: 'center', justifyContent: 'center' },
  timeSign: { fontSize: 22, lineHeight: 24, color: color.text },
  timeValue: { ...type.body16Semi, color: color.text, fontVariant: ['tabular-nums'] },
});
