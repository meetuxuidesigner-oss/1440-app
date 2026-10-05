import { StyleSheet, Text, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import type { DayMark } from '@/logic/day';
import { formatDayShort } from '@/logic/time';
import type { DayKey } from '@/logic/types';
import { color, type } from '@/theme';

import { Icon } from './ui/Icon';

const WORD: Record<DayMark, string> = {
  done: 'target met',
  rest: 'planned rest',
  gap: 'missed',
  dayOff: 'day off',
  upcoming: 'upcoming',
  today: 'today',
};

/** One week of an activity. A planned rest day looks calm, not like a failure. */
export function WeekStrip({ marks, tint, compact }: { marks: { day: DayKey; mark: DayMark }[]; tint: string; compact?: boolean }) {
  const d = compact ? 26 : 34;
  return (
    <View style={styles.row}>
      {marks.map(({ day, mark }) => (
        <View key={day} style={styles.col} accessible accessibilityLabel={`${formatDayShort(day)}, ${WORD[mark]}`}>
          {!compact ? <Text style={[styles.day, mark === 'today' && { color: color.text }]}>{formatDayShort(day).slice(0, 1)}</Text> : null}
          <View
            style={[
              styles.dot,
              { width: d, height: d, borderRadius: d / 2 },
              mark === 'done' && { backgroundColor: tint },
              mark === 'rest' && { backgroundColor: withAlpha(tint, 0.14), borderColor: withAlpha(tint, 0.4), borderStyle: 'dashed', borderWidth: 1.5 },
              mark === 'gap' && { backgroundColor: color.surface2 },
              mark === 'dayOff' && { backgroundColor: 'rgba(135,125,255,0.16)' },
              mark === 'upcoming' && { borderColor: color.hairline, borderWidth: 1.5 },
              mark === 'today' && { borderColor: tint, borderWidth: 2 },
            ]}>
            {mark === 'done' ? <Icon name="check" size={d * 0.5} color={color.bg} /> : null}
            {mark === 'dayOff' ? <Icon name="moon" size={d * 0.42} color={color.nightGlow} /> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: 6 },
  day: { ...type.body12Semi, color: color.textSecondary },
  dot: { alignItems: 'center', justifyContent: 'center' },
});
