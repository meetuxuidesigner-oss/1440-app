import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip } from '@/components/ActivityForm';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Press } from '@/components/ui/Press';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { tap } from '@/lib/haptics';
import { activeActivities } from '@/logic/day';
import { checkLog, type LogCheck } from '@/logic/log';
import { dayAt, windowOf } from '@/logic/schedule';
import { formatClock, formatDayShort, formatDuration } from '@/logic/time';
import { useApp } from '@/store';
import { activityColor, color, radius, type } from '@/theme';

const MIN = 60_000;
const DURATIONS = [15, 30, 45, 60];
const STEP = 15;

function message(check: LogCheck, names: Map<string, string>): string | null {
  if (check.ok) return null;
  switch (check.reason) {
    case 'future':
      return "That ends in the future. Log it once it's done, or start the timer.";
    case 'tooOld':
      return 'You can log up to 7 days back, so streaks stay honest.';
    case 'tooShort':
      return 'Sessions need at least a minute.';
    case 'invalid':
      return 'That time range doesn’t work.';
    case 'overlap':
      return `Overlaps ${names.get(check.with.activityId) ?? 'another session'}, ${formatClock(check.with.start)} – ${check.with.end ? formatClock(check.with.end) : 'now'}.`;
  }
}

/** Log time you forgot to track. Fast by default: pick an activity and a length, it ended just now. */
export default function Log() {
  const params = useLocalSearchParams<{ activityId?: string }>();
  const data = useApp((s) => s.data);
  const logSession = useApp((s) => s.logSession);
  const insets = useSafeAreaInsets();
  const [now] = useState(() => Math.floor(Date.now() / MIN) * MIN);
  const activities = data ? activeActivities(data) : [];
  const [activityId, setActivityId] = useState(params.activityId ?? activities[0]?.id);
  const [duration, setDuration] = useState(30);
  const [endsAgo, setEndsAgo] = useState(0);

  const end = now - endsAgo * MIN;
  const start = end - duration * MIN;
  const names = useMemo(() => new Map(data?.activities.map((a) => [a.id, a.name])), [data]);

  if (!data) return null;
  const check = checkLog(data, start, end, now);
  const error = message(check, names);
  const w = windowOf(data, dayAt(data, start));
  const inSleep = check.ok && end > w.sleepStart;
  const sameDay = dayAt(data, start) === dayAt(data, now);

  const save = (replaceId?: string) => {
    if (!activityId) return;
    const result = logSession(activityId, start, end, replaceId);
    if (result.ok) router.back();
  };

  const shift = (delta: number) => {
    tap();
    setEndsAgo((v) => Math.max(0, v + delta));
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
      <SheetHeader title="Log time" />

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>Activity</Text>
        <View style={styles.wrap}>
          {activities.map((a) => {
            const on = a.id === activityId;
            return (
              <Press
                key={a.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => {
                  tap();
                  setActivityId(a.id);
                }}
                style={[styles.act, on && { borderColor: activityColor[a.color], backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                <View style={[styles.dot, { backgroundColor: activityColor[a.color] }]} />
                <Text style={[styles.actText, on && { color: color.text }]}>{a.name}</Text>
              </Press>
            );
          })}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>How long</Text>
        <View style={styles.row}>
          {DURATIONS.map((m) => (
            <Chip key={m} wide label={formatDuration(m)} on={duration === m} onPress={() => setDuration(m)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={styles.label}>When</Text>
        <View style={styles.when}>
          <Press accessibilityRole="button" accessibilityLabel="15 minutes earlier" onPress={() => shift(STEP)} style={styles.stepBtn}>
            <Icon name="back" size={18} />
          </Press>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.range} accessibilityLiveRegion="polite">
              {formatClock(start)} – {formatClock(end)}
            </Text>
            <Text style={styles.rangeSub}>
              {endsAgo === 0 ? 'Ended just now' : `${sameDay ? 'Today' : formatDayShort(dayAt(data, start))} · ended ${formatDuration(endsAgo)} ago`}
            </Text>
          </View>
          <Press
            accessibilityRole="button"
            accessibilityLabel="15 minutes later"
            disabled={endsAgo === 0}
            onPress={() => shift(-STEP)}
            style={[styles.stepBtn, endsAgo === 0 && { opacity: 0.35 }]}>
            <Icon name="chevron" size={18} />
          </Press>
        </View>
        <View style={styles.row}>
          <Chip wide label="Just now" on={endsAgo === 0} onPress={() => setEndsAgo(0)} />
          <Chip wide label="1h ago" on={endsAgo === 60} onPress={() => setEndsAgo(60)} />
          <Chip wide label="Yesterday" on={endsAgo === 1440} onPress={() => setEndsAgo(1440)} />
        </View>
      </View>

      {error ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {inSleep ? <Text style={styles.info}>Part of this is in your sleep window. That part won’t count.</Text> : null}

      {!check.ok && check.reason === 'overlap' && check.with.end !== null ? (
        <Button kind="secondary" label={`Replace that session`} onPress={() => save(check.with.id)} />
      ) : (
        <Button label={`Log ${formatDuration(duration)}`} disabled={!check.ok || !activityId} onPress={() => save()} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 24 },
  label: { ...type.body15Semi, color: color.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  act: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: color.surface2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actText: { ...type.body14Medium, color: color.textSecondary },
  row: { flexDirection: 'row', gap: 8 },
  when: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: radius.lg,
    backgroundColor: color.surface1,
    borderWidth: 1,
    borderColor: color.hairline,
  },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: color.surface3, alignItems: 'center', justifyContent: 'center' },
  range: { ...type.body16Semi, color: color.text, fontVariant: ['tabular-nums'] },
  rangeSub: { ...type.body13, color: color.textSecondary },
  error: { padding: 14, borderRadius: radius.md, backgroundColor: 'rgba(255,107,91,0.10)' },
  errorText: { ...type.body14, color: color.danger },
  info: { ...type.body13, color: color.textSecondary, textAlign: 'center' },
});
