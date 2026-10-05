import { ActivityIndicator, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { color, radius, type } from '@/theme';

import { Press } from './Press';

interface Props {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, kind = 'primary', disabled, busy, style }: Props) {
  return (
    <Press
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled || busy}
      onPress={onPress}
      style={[styles.base, styles[kind], disabled && styles.disabled, style]}>
      {busy ? (
        <ActivityIndicator color={kind === 'primary' ? color.onGreen : color.text} />
      ) : (
        <Text style={[styles.label, kind === 'primary' && styles.labelPrimary, kind === 'danger' && styles.labelDanger]}>{label}</Text>
      )}
    </Press>
  );
}

const styles = StyleSheet.create({
  base: { height: 54, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primary: { backgroundColor: color.green },
  secondary: { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.glassStroke },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(255,107,91,0.12)' },
  disabled: { opacity: 0.4 },
  label: { ...type.body16Semi, color: color.text },
  labelPrimary: { color: color.onGreen },
  labelDanger: { color: color.danger },
});
