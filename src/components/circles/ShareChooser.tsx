import { StyleSheet, Switch, Text, View } from 'react-native';

import { tap } from '@/lib/haptics';
import type { Activity } from '@/logic/types';
import { activityColor, color, radius, type } from '@/theme';

/**
 * Pick what one circle can see. Everything starts off: private by default.
 * Colleagues and gym friends can see different things.
 */
export function ShareChooser({
  activities,
  value,
  onChange,
}: {
  activities: Activity[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        {activities.length === 0 ? <Text style={styles.empty}>You have no activities yet. You can share later.</Text> : null}
        {activities.map((a, i) => {
          const on = value.includes(a.id);
          return (
            <View key={a.id} style={[styles.row, i > 0 && styles.sep]}>
              <View style={[styles.dot, { backgroundColor: activityColor[a.color] }]} />
              <Text style={styles.name} numberOfLines={1}>
                {a.name}
              </Text>
              <Switch
                accessibilityLabel={`Share ${a.name} with this circle`}
                value={on}
                onValueChange={(v) => {
                  tap();
                  onChange(v ? [...value, a.id] : value.filter((id) => id !== a.id));
                }}
                trackColor={{ false: color.surface3, true: color.green }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={color.surface3}
              />
            </View>
          );
        })}
      </View>
      <PrivacyNote />
    </View>
  );
}

export function PrivacyNote() {
  return (
    <View style={styles.note}>
      <Text style={styles.noteText}>
        <Text style={styles.noteStrong}>Friends see</Text> the activity name, which days you met it (✓) and your streak.
      </Text>
      <Text style={styles.noteText}>
        <Text style={styles.noteStrong}>Never</Text> your minutes, your times or anything you don’t switch on.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface1, borderRadius: radius.lg, borderWidth: 1, borderColor: color.hairline, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  sep: { borderTopWidth: 1, borderTopColor: color.hairline },
  dot: { width: 10, height: 10, borderRadius: 5 },
  name: { ...type.body16Semi, color: color.text, flex: 1 },
  empty: { ...type.body14, color: color.textSecondary, paddingVertical: 16 },
  note: { gap: 4, paddingHorizontal: 4 },
  noteText: { ...type.body13, color: color.textSecondary },
  noteStrong: { color: color.text, fontFamily: type.body12Semi.fontFamily },
});
