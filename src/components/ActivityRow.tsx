import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { withAlpha } from '@/lib/color';
import type { RowStatus } from '@/logic/status';
import type { Activity } from '@/logic/types';
import { activityColor, color, radius, type } from '@/theme';

import { Icon } from './ui/Icon';
import { Press } from './ui/Press';

interface Props {
  activity: Activity;
  status: RowStatus;
  /** mm:ss of the running session. */
  elapsed?: string;
  onOpen: () => void;
  onToggle: () => void;
}

function Ring({ progress, tint, done }: { progress: number; tint: string; done: boolean }) {
  const size = 40;
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={20} cy={20} r={r} stroke={withAlpha(tint, 0.18)} strokeWidth={3.5} fill="none" />
        {progress > 0 ? (
          <Circle
            cx={20}
            cy={20}
            r={r}
            stroke={tint}
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * progress} ${c}`}
            transform="rotate(-90 20 20)"
          />
        ) : null}
      </Svg>
      {done ? <Icon name="check" size={16} color={tint} /> : <View style={[styles.dot, { backgroundColor: tint }]} />}
    </View>
  );
}

export function ActivityRow({ activity, status, elapsed, onOpen, onToggle }: Props) {
  const tint = activityColor[activity.color];
  const running = status.kind === 'running';
  const quiet = status.kind === 'rest' || status.kind === 'weekDone' || status.kind === 'dayOff';
  return (
    <Press
      scaleTo={0.98}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${activity.name}. ${status.text}`}
      style={[styles.row, running && { borderColor: withAlpha(tint, 0.5), backgroundColor: withAlpha(tint, 0.08) }]}>
      <Ring progress={status.progress} tint={tint} done={status.kind === 'met'} />
      <View style={styles.text}>
        <Text style={[styles.name, quiet && styles.nameQuiet]} numberOfLines={1}>
          {activity.name}
        </Text>
        <Text style={[styles.status, running && { color: tint }, status.kind === 'met' && { color: color.green }]} numberOfLines={1}>
          {running && elapsed ? `${elapsed} · ` : ''}
          {status.text}
        </Text>
      </View>
      <Press
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={running ? `Stop ${activity.name}` : `Start ${activity.name}`}
        style={[styles.toggle, running ? { backgroundColor: tint } : { backgroundColor: color.surface3 }]}>
        <Icon name={running ? 'stop' : 'play'} size={18} color={running ? color.bg : color.text} />
      </Press>
    </Press>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 12,
    borderRadius: radius.lg,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  text: { flex: 1, gap: 1 },
  name: { ...type.body16Semi, color: color.text },
  nameQuiet: { color: color.textSecondary },
  status: { ...type.body13, color: color.textSecondary, fontVariant: ['tabular-nums'] },
  toggle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
