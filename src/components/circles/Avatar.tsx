import { StyleSheet, Text, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { initials } from '@/social/snapshot';
import { activityColor, activityColorOrder, color, type } from '@/theme';

const tintOf = (id: string) => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return activityColor[activityColorOrder[h % activityColorOrder.length]];
};

export function Avatar({ id, name, size = 36, ring }: { id: string; name: string; size?: number; ring?: boolean }) {
  const tint = tintOf(id);
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: withAlpha(tint, 0.18) },
        ring && { borderWidth: 2, borderColor: color.bg },
      ]}>
      <Text style={[styles.text, { color: tint, fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

export function AvatarStack({ people, max = 5, size = 30 }: { people: { id: string; name: string }[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((p, i) => (
        <View key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3 }}>
          <Avatar id={p.id} name={p.name} size={size} ring />
        </View>
      ))}
      {extra > 0 ? <Text style={styles.extra}>+{extra}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: type.body15Semi.fontFamily },
  stack: { flexDirection: 'row', alignItems: 'center' },
  extra: { ...type.body12Semi, color: color.textSecondary, marginLeft: 6 },
});
