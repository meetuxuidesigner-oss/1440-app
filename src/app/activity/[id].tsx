import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Press } from '@/components/ui/Press';
import { Card, SectionLabel } from '@/components/ui/Screen';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { WeekStrip } from '@/components/WeekStrip';
import { formatElapsed, useToday } from '@/hooks/useToday';
import { withAlpha } from '@/lib/color';
import { bump } from '@/lib/haptics';
import { countedMinutes, minutesOn, weekMarks, weekResult, weeklyStreak } from '@/logic/day';
import { MAX_BACKFILL_DAYS } from '@/logic/log';
import { dayAt } from '@/logic/schedule';
import { addDays, formatClock, formatDayLong, formatDuration } from '@/logic/time';
import { useApp } from '@/store';
import { activityColor, color, radius, type } from '@/theme';

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, now, minute, day, running } = useToday();
  const startTimer = useApp((s) => s.startTimer);
  const stopTimer = useApp((s) => s.stopTimer);
  const deleteSession = useApp((s) => s.deleteSession);
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const activity = data?.activities.find((a) => a.id === id);
  if (!data || !day || !activity) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 8, paddingHorizontal: 16 }]}>
        <SheetHeader title="Activity" back />
        <Text style={styles.muted}>This activity doesn’t exist any more.</Text>
      </View>
    );
  }

  const tint = activityColor[activity.color];
  const today = minutesOn(data, day, activity.id, minute);
  const progress = Math.min(1, today / activity.dailyTarget);
  const w = weekResult(data, activity, day, minute);
  const streak = weeklyStreak(data, activity, day, minute);
  const isRunning = running?.activityId === activity.id;

  const oldest = addDays(day, -MAX_BACKFILL_DAYS);
  const recent = data.sessions
    .filter((s) => s.activityId === activity.id && dayAt(data, s.start) >= oldest)
    .sort((a, b) => b.start - a.start);
  const byDay = new Map<string, typeof recent>();
  for (const s of recent) {
    const k = dayAt(data, s.start);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 16 }}>
      <SheetHeader title="" back />

      <View style={styles.hero}>
        <View style={[styles.badge, { backgroundColor: withAlpha(tint, 0.16) }]}>
          <View style={[styles.badgeDot, { backgroundColor: tint }]} />
        </View>
        <Text style={styles.title}>{activity.name}</Text>
        <Text style={styles.muted}>
          {activity.dailyTarget} min a day · {activity.daysPerWeek} days a week
        </Text>
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <View style={styles.statTop}>
            <Icon name="flame" size={16} color={streak > 0 ? color.green : color.textSecondary} />
            <Text style={styles.statValue}>{streak}</Text>
          </View>
          <Text style={styles.statLabel}>week streak</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={[styles.statValue, w.met && { color: color.green }]}>
            {w.done} of {w.target}
          </Text>
          <Text style={styles.statLabel}>days this week</Text>
        </Card>
      </View>

      <Card style={{ marginTop: 12, gap: 16 }}>
        <WeekStrip marks={weekMarks(data, activity, day, minute)} tint={tint} />
      </Card>

      <SectionLabel>Today</SectionLabel>
      <Card style={{ gap: 12 }}>
        <View style={styles.todayRow}>
          <Text style={styles.todayValue}>{formatDuration(today)}</Text>
          <Text style={styles.muted}>of {formatDuration(activity.dailyTarget)}</Text>
          <View style={{ flex: 1 }} />
          {isRunning && running ? <Text style={[styles.timer, { color: tint }]}>{formatElapsed(now - running.start)}</Text> : null}
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: tint }]} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button
            style={{ flex: 1 }}
            kind={isRunning ? 'secondary' : 'primary'}
            label={isRunning ? 'Stop' : 'Start'}
            onPress={() => {
              bump();
              if (isRunning) stopTimer();
              else startTimer(activity.id);
            }}
          />
          <Button
            style={{ flex: 1 }}
            kind="secondary"
            label="Log time"
            onPress={() => router.push({ pathname: '/log', params: { activityId: activity.id } })}
          />
        </View>
      </Card>

      <SectionLabel>Last 7 days</SectionLabel>
      {byDay.size === 0 ? <Text style={[styles.muted, { marginLeft: 4 }]}>No sessions yet.</Text> : null}
      <View style={{ gap: 12 }}>
        {[...byDay.entries()].map(([d, sessions]) => (
          <Card key={d} style={{ paddingVertical: 6 }}>
            <Text style={styles.dayLabel}>{d === day ? 'Today' : formatDayLong(d)}</Text>
            {sessions.map((s) => {
              const open = selected === s.id;
              const counted = countedMinutes(data, s, minute);
              return (
                <Press
                  key={s.id}
                  scaleTo={0.99}
                  accessibilityRole="button"
                  accessibilityHint="Shows delete"
                  onPress={() => setSelected(open ? null : s.id)}
                  style={styles.session}>
                  <View style={[styles.sessionDot, { backgroundColor: tint }]} />
                  <Text style={styles.sessionTime}>
                    {formatClock(s.start)} – {s.end ? formatClock(s.end) : 'now'}
                  </Text>
                  <Text style={styles.sessionMin}>{formatDuration(counted)}</Text>
                  {open && s.end ? (
                    <Press
                      accessibilityRole="button"
                      accessibilityLabel="Delete session"
                      onPress={() => {
                        deleteSession(s.id);
                        setSelected(null);
                      }}
                      style={styles.delete}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </Press>
                  ) : null}
                </Press>
              );
            })}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  hero: { alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 20 },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  badgeDot: { width: 22, height: 22, borderRadius: 11 },
  title: { ...type.heading24, color: color.text, textAlign: 'center' },
  muted: { ...type.body14, color: color.textSecondary },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, gap: 2 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { ...type.heading24, color: color.text, fontVariant: ['tabular-nums'] },
  statLabel: { ...type.body13, color: color.textSecondary },
  todayRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  todayValue: { ...type.heading24, color: color.text },
  timer: { ...type.body16Semi, fontVariant: ['tabular-nums'] },
  bar: { height: 8, borderRadius: 4, backgroundColor: color.surface3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  dayLabel: { ...type.body12Semi, color: color.textSecondary, paddingTop: 8, paddingBottom: 4 },
  session: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  sessionDot: { width: 6, height: 6, borderRadius: 3 },
  sessionTime: { ...type.body15, color: color.text, flex: 1, fontVariant: ['tabular-nums'] },
  sessionMin: { ...type.body14Medium, color: color.textSecondary },
  delete: { paddingHorizontal: 12, height: 32, borderRadius: radius.full, backgroundColor: 'rgba(255,107,91,0.14)', justifyContent: 'center' },
  deleteText: { ...type.body12Semi, color: color.danger },
});
