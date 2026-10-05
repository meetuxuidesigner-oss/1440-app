import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShareChooser } from '@/components/circles/ShareChooser';
import { Button } from '@/components/ui/Button';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { activeActivities } from '@/logic/day';
import { friendlyError } from '@/social/api';
import { useSocial } from '@/social/store';
import { useApp } from '@/store';
import { color, type } from '@/theme';

export default function CircleShare() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const data = useApp((s) => s.data);
  const circle = useSocial((s) => s.circles.find((c) => c.id === id));
  const current = useSocial((s) => s.shares[id] ?? []);
  const setShares = useSocial((s) => s.setShares);
  const [shared, setShared] = useState<string[]>(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activities = data ? activeActivities(data) : [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
      <SheetHeader title="What this circle sees" />
      <Text style={styles.p}>{circle ? `Choose what ${circle.name} can cheer for.` : ''}</Text>
      <ShareChooser activities={activities} value={shared} onChange={setShared} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={{ gap: 10 }}>
        <Button
          label="Save"
          busy={busy}
          onPress={async () => {
            setBusy(true);
            try {
              await setShares(id, shared);
              router.back();
            } catch (e) {
              setError(friendlyError(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 20 },
  p: { ...type.body15, color: color.textSecondary },
  error: { ...type.body14, color: color.danger },
});
