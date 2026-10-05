import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Card, Screen } from '@/components/ui/Screen';
import { color, type } from '@/theme';

/** Circles (small private groups, kudos) need accounts, so they arrive in milestone 3. */
export default function Circles() {
  return (
    <Screen title="Circles">
      <Card style={styles.card}>
        <View style={styles.icon}>
          <Icon name="circles" size={30} color={color.green} />
        </View>
        <Text style={styles.heading}>Small, private, kind</Text>
        <Text style={styles.body}>
          Share your week with up to 8 people. They see if your sphere filled, never your exact minutes, and can send kudos. No leaderboards.
        </Text>
        <Text style={styles.soon}>Coming soon</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: 32, gap: 10 },
  icon: { width: 64, height: 64, borderRadius: 32, backgroundColor: color.greenSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  heading: { ...type.heading20, color: color.text },
  body: { ...type.body15, color: color.textSecondary, textAlign: 'center', paddingHorizontal: 8 },
  soon: { ...type.label10Caps, color: color.green, marginTop: 8 },
});
