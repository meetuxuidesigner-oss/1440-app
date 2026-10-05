import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { color, radius, type } from '@/theme';

export function TextField({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={color.textMuted}
        {...props}
        accessibilityLabel={label}
        style={[styles.input, props.style]}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.body15Semi, color: color.text },
  input: {
    height: 56,
    paddingHorizontal: 18,
    borderRadius: radius.lg,
    backgroundColor: color.surface1,
    borderWidth: 1.5,
    borderColor: color.glassStroke,
    ...type.body16Semi,
    color: color.text,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  hint: { ...type.body13, color: color.textSecondary },
});
