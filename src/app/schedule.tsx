import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DaySphere } from '@/components/sphere/DaySphere';
import { TimeStepper } from '@/components/TimeStepper';
import { Button } from '@/components/ui/Button';
import { SheetHeader } from '@/components/ui/SheetHeader';
import type { DailyFill } from '@/logic/day';
import { settingsAt, whenScheduleStarts } from '@/logic/schedule';
import { awakeMinutes, formatClockMin, formatDuration } from '@/logic/time';
import { useApp } from '@/store';
import { color, radius, type } from '@/theme';

const EMPTY: DailyFill = { day: '', state: 'empty', wellSpent: 0, target: 0, fraction: 0, layers: [], included: [] };

/** Change wake and sleep times. The past keeps its times, so streaks stay fair. */
export default function Schedule() {
  const insets = useSafeAreaInsets();
  const data = useApp((s) => s.data);
  const setSchedule = useApp((s) => s.setSchedule);
  const [now] = useState(() => Date.now());
  const [wake, setWake] = useState(data?.settings.wake ?? 420);
  const [sleep, setSleep] = useState(data?.settings.sleep ?? 1380);
  if (!data) return null;

  const today = settingsAt(data, now);
  const starts = whenScheduleStarts(data, now);
  const awake = awakeMinutes({ ...data.settings, wake, sleep });
  const same = wake === data.settings.wake && sleep === data.settings.sleep;
  const valid = wake !== sleep;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
      <SheetHeader title="Your day" />
      <View style={{ alignItems: 'center' }}>
        <DaySphere
          size={240}
          fill={EMPTY}
          settings={{ ...data.settings, wake, sleep }}
          now={0}
          center={
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.awake}>{formatDuration(awake)}</Text>
              <Text style={styles.p}>awake</Text>
            </View>
          }
        />
      </View>
      <View style={styles.times}>
        <TimeStepper label="Wake" value={wake} onChange={setWake} />
        <TimeStepper label="Sleep" value={sleep} onChange={setSleep} />
      </View>
      {!valid ? <Text style={styles.warn}>Wake and sleep can’t be the same time.</Text> : null}
      {valid && awake < 12 * 60 ? <Text style={styles.warn}>That’s a short day. Double-check your times.</Text> : null}
      {valid && awake > 19 * 60 ? <Text style={styles.warn}>That leaves under 5 hours for sleep. Rest is part of the plan.</Text> : null}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          {starts === 'today'
            ? 'Nothing is tracked yet today, so today starts again with these times.'
            : `Starts tomorrow. Today keeps ${formatClockMin(today.wake)} – ${formatClockMin(today.sleep)}, so nothing you did today moves to a different day.`}
        </Text>
        <Text style={styles.noteText}>Past days always keep the times they were lived with, so your streaks stay fair.</Text>
      </View>

      <Button
        label={starts === 'today' ? 'Save' : 'Save from tomorrow'}
        disabled={!valid || same}
        onPress={() => {
          setSchedule(wake, sleep);
          router.back();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 18 },
  awake: { ...type.heading32, color: color.text },
  p: { ...type.body15, color: color.textSecondary },
  times: { flexDirection: 'row', gap: 12 },
  warn: { ...type.body13, color: color.textSecondary, textAlign: 'center' },
  note: { gap: 6, padding: 16, borderRadius: radius.lg, backgroundColor: color.surface1, borderWidth: 1, borderColor: color.hairline },
  noteText: { ...type.body14, color: color.textSecondary },
});
