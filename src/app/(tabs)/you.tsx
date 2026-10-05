import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Press } from '@/components/ui/Press';
import { Card, Screen, SectionLabel } from '@/components/ui/Screen';
import { pendingSchedule, settingsAt } from '@/logic/schedule';
import { awakeMinutes, formatClockMin, formatDuration } from '@/logic/time';
import { useApp, useNow } from '@/store';
import { color, type } from '@/theme';

const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function You() {
  const data = useApp((s) => s.data);
  const loadSampleWeek = useApp((s) => s.loadSampleWeek);
  const reset = useApp((s) => s.reset);
  const [confirming, setConfirming] = useState(false);
  const now = useNow(60_000);
  if (!data) return null;
  const { settings } = data;
  const current = settingsAt(data, now);
  const pending = pendingSchedule(data, now);

  return (
    <Screen title="You">
      <SectionLabel>Your day</SectionLabel>
      <Press accessibilityRole="button" accessibilityLabel="Change wake and sleep times" scaleTo={0.98} onPress={() => router.push('/schedule')}>
        <Card style={{ paddingVertical: 4 }}>
          <Row label="Wake" value={formatClockMin(current.wake)} />
          <View style={styles.sep} />
          <Row label="Sleep" value={formatClockMin(current.sleep)} />
          <View style={styles.sep} />
          <Row label="Awake time" value={formatDuration(awakeMinutes(current))} />
          {pending ? (
            <>
              <View style={styles.sep} />
              <Text style={styles.pending}>
                From tomorrow: {formatClockMin(pending.wake)} – {formatClockMin(pending.sleep)}
              </Text>
            </>
          ) : null}
          <View style={styles.sep} />
          <Text style={styles.edit}>Change times</Text>
        </Card>
      </Press>
      <Card style={{ paddingVertical: 4, marginTop: 12 }}>
        <Row label="Weekly statement" value={WEEKDAY[settings.statementDay]} />
      </Card>
      <Text style={styles.note}>Time in your sleep window never counts. Rest is part of the plan.</Text>

      <SectionLabel>Test data</SectionLabel>
      <Card style={{ gap: 10 }}>
        <Text style={styles.body}>Fill the app with the sample week from the designs: three activities, a few days of sessions and streaks.</Text>
        <Button kind="secondary" label="Load sample week" onPress={() => loadSampleWeek()} />
        <Button
          kind="danger"
          label={confirming ? 'Tap again to erase everything' : 'Start over'}
          onPress={() => {
            if (!confirming) return setConfirming(true);
            reset();
            router.replace('/onboarding');
          }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  label: { ...type.body15, color: color.text },
  value: { ...type.body15, color: color.textSecondary },
  sep: { height: 1, backgroundColor: color.hairline },
  pending: { ...type.body14Medium, color: color.green, paddingVertical: 12 },
  edit: { ...type.body15Semi, color: color.green, paddingVertical: 12 },
  note: { ...type.body13, color: color.textSecondary, marginTop: 8, marginHorizontal: 4 },
  body: { ...type.body14, color: color.textSecondary },
});
