import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityRow } from '@/components/ActivityRow';
import { DaySphere } from '@/components/sphere/DaySphere';
import { Icon } from '@/components/ui/Icon';
import { Press } from '@/components/ui/Press';
import { formatElapsed, useToday } from '@/hooks/useToday';
import { bump, success } from '@/lib/haptics';
import { activeActivities } from '@/logic/day';
import { nextHint, rowStatus, VERY_FULL_DAY_MIN } from '@/logic/status';
import { formatClockMin, formatDayLong } from '@/logic/time';
import { useApp } from '@/store';
import { color, radius, type } from '@/theme';

export default function Home() {
  const { data, now, minute, running, day, fill, segments, arcNow, bedtime } = useToday();
  const startTimer = useApp((s) => s.startTimer);
  const stopTimer = useApp((s) => s.stopTimer);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const size = Math.min(width - 24, 380);

  // One success buzz the moment the sphere becomes full, never again that day.
  const wasFull = useRef<string | null>(null);
  useEffect(() => {
    if (!fill || !day) return;
    if (fill.state === 'full' && wasFull.current !== day) {
      if (wasFull.current !== null) success();
      wasFull.current = day;
    } else if (wasFull.current === null) {
      wasFull.current = '';
    }
  }, [fill, day]);

  if (!data || !fill || !day) return null;

  const activities = activeActivities(data);
  const hint = nextHint(data, fill, day, minute);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }}
      showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>
            {formatDayLong(day)} · woke {formatClockMin(data.settings.wake)}
          </Text>
          <Text style={styles.title} accessibilityRole="header">
            Today
          </Text>
        </View>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Log time you forgot to track"
          onPress={() => router.push('/log')}
          style={styles.iconButton}>
          <Icon name="plus" size={22} />
        </Press>
      </View>

      <View style={styles.sphere}>
        <DaySphere size={size} fill={fill} settings={data.settings} segments={segments} now={arcNow} bedtime={bedtime} />
      </View>

      {hint ? (
        <Text style={[styles.hint, fill.state === 'full' && { color: color.green }]} accessibilityLiveRegion="polite">
          {hint}
        </Text>
      ) : null}
      {fill.target > VERY_FULL_DAY_MIN ? (
        <Text style={styles.note}>That&apos;s a very full day. Fewer, steadier?</Text>
      ) : null}

      <View style={styles.list}>
        {activities.length === 0 ? (
          <Text style={styles.empty}>Add your first activity. Give it a small daily target you can keep on a busy day.</Text>
        ) : null}
        {activities.map((a) => {
          const isRunning = running?.activityId === a.id;
          return (
            <ActivityRow
              key={a.id}
              activity={a}
              status={rowStatus(data, a, day, now, fill)}
              elapsed={isRunning && running ? formatElapsed(now - running.start) : undefined}
              onOpen={() => router.push({ pathname: '/activity/[id]', params: { id: a.id } })}
              onToggle={() => {
                bump();
                if (isRunning) stopTimer();
                else startTimer(a.id);
              }}
            />
          );
        })}
        <Press
          accessibilityRole="button"
          onPress={() => router.push('/new-activity')}
          style={styles.add}
          scaleTo={0.98}>
          <Icon name="plus" size={18} color={color.textSecondary} />
          <Text style={styles.addText}>Add activity</Text>
        </Press>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 20, gap: 12 },
  date: { ...type.body13, color: color.textSecondary },
  title: { ...type.heading32, color: color.text },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.surface2,
    borderWidth: 1,
    borderColor: color.glassStroke,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sphere: { alignItems: 'center', marginTop: 4 },
  hint: { ...type.body14Medium, color: color.textSecondary, textAlign: 'center', marginTop: 2, paddingHorizontal: 24 },
  note: { ...type.body13, color: color.textSecondary, textAlign: 'center', marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 10, marginTop: 20 },
  empty: { ...type.body15, color: color.textSecondary, textAlign: 'center', paddingHorizontal: 12, paddingBottom: 6 },
  add: {
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.glassStroke,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addText: { ...type.body15Semi, color: color.textSecondary },
});
