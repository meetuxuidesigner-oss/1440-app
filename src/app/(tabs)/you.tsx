import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card, Screen, SectionLabel } from '@/components/ui/Screen';
import { awakeMinutes, formatClockMin, formatDuration } from '@/logic/time';
import { useApp } from '@/store';
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
  if (!data) return null;
  const { settings } = data;

  return (
    <Screen title="You">
      <SectionLabel>Your day</SectionLabel>
      <Card style={{ paddingVertical: 4 }}>
        <Row label="Wake" value={formatClockMin(settings.wake)} />
        <View style={styles.sep} />
        <Row label="Sleep" value={formatClockMin(settings.sleep)} />
        <View style={styles.sep} />
        <Row label="Awake time" value={formatDuration(awakeMinutes(settings))} />
        <View style={styles.sep} />
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
  note: { ...type.body13, color: color.textSecondary, marginTop: 8, marginHorizontal: 4 },
  body: { ...type.body14, color: color.textSecondary },
});
