import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityForm, isDraftValid, type ActivityDraft } from '@/components/ActivityForm';
import { Button } from '@/components/ui/Button';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { activeActivities } from '@/logic/day';
import { VERY_FULL_DAY_MIN } from '@/logic/status';
import { formatDuration } from '@/logic/time';
import { useApp } from '@/store';
import { activityColorOrder, color, type } from '@/theme';

export default function NewActivity() {
  const data = useApp((s) => s.data);
  const addActivity = useApp((s) => s.addActivity);
  const insets = useSafeAreaInsets();
  const used = new Set(data?.activities.map((a) => a.color));
  const [draft, setDraft] = useState<ActivityDraft>({
    name: '',
    color: activityColorOrder.find((c) => !used.has(c)) ?? 'sky',
    dailyTarget: 30,
    daysPerWeek: 5,
  });

  const planned = (data ? activeActivities(data).reduce((s, a) => s + a.dailyTarget, 0) : 0) + draft.dailyTarget;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <SheetHeader title="New activity" />
        <ActivityForm value={draft} onChange={setDraft} autoFocus />
        <View style={styles.total}>
          <Text style={styles.totalText}>
            Your full day becomes <Text style={{ color: color.text }}>{formatDuration(planned)}</Text>.
          </Text>
          {planned > VERY_FULL_DAY_MIN ? <Text style={styles.warn}>That&apos;s a very full day. Fewer, steadier?</Text> : null}
        </View>
        <Button
          label="Add activity"
          disabled={!isDraftValid(draft)}
          onPress={() => {
            addActivity({ ...draft, name: draft.name.trim() });
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  body: { padding: 16, gap: 20 },
  total: { gap: 4, alignItems: 'center' },
  totalText: { ...type.body14, color: color.textSecondary },
  warn: { ...type.body13, color: color.textSecondary },
});
