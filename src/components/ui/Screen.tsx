import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, type } from '@/theme';

interface Props {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  /** Leaves room for the floating tab bar. */
  tabs?: boolean;
}

export function Screen({ title, eyebrow, right, children, tabs = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + (tabs ? 120 : 32), paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}>
      {title ? (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.bg },
  header: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4, marginBottom: 16 },
  eyebrow: { ...type.body13, color: color.textSecondary },
  title: { ...type.heading32, color: color.text },
  card: { backgroundColor: color.surface1, borderRadius: 24, borderWidth: 1, borderColor: color.hairline, padding: 16 },
  section: { ...type.label10Caps, color: color.textSecondary, marginTop: 24, marginBottom: 8, marginLeft: 4 },
});
