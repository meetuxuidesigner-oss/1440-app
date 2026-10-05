import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { color, type } from '@/theme';

import { Icon } from './Icon';
import { Press } from './Press';

/** Title row for sheets and pushed screens. */
export function SheetHeader({ title, back }: { title: string; back?: boolean }) {
  return (
    <View style={styles.row}>
      <Press
        accessibilityRole="button"
        accessibilityLabel={back ? 'Back' : 'Close'}
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.btn}>
        <Icon name={back ? 'back' : 'close'} size={20} />
      </Press>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  btn: { width: 40, height: 40, borderRadius: 20, backgroundColor: color.surface2, alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 40, height: 40 },
  title: { ...type.body16Semi, color: color.text, flex: 1, textAlign: 'center' },
});
