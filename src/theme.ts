import type { TextStyle } from 'react-native';

import type { ActivityColor } from '@/logic/types';

/** Dark theme values from the Figma "Base Colors" collection (Dark Theme mode). */
export const color = {
  bg: '#0A0A0B',
  surface1: '#141417',
  surface2: '#1B1B1E',
  surface3: '#202024',
  glass: 'rgba(255,255,255,0.08)',
  glassStroke: 'rgba(255,255,255,0.12)',
  hairline: 'rgba(255,255,255,0.08)',
  text: '#F5F5F7',
  textSecondary: '#9A9AA0',
  /** Decorative only: below 4.5:1 for small text. */
  textMuted: '#707076',
  green: '#36D65E',
  greenSoft: 'rgba(54,214,94,0.14)',
  onGreen: '#06210F',
  night: '#2F2C4E',
  nightGlow: '#877DFF',
  danger: '#FF6B5B',
} as const;

export const activityColor: Record<ActivityColor, string> = {
  sky: '#1ACBF0',
  coral: '#FF7A6B',
  amber: '#FFB547',
  sun: '#FFD60A',
  violet: '#B18CFF',
  rose: '#FF5CB6',
  sand: '#BF916E',
  mist: '#B8C4CC',
};

export const activityColorOrder: ActivityColor[] = ['sky', 'coral', 'amber', 'sun', 'violet', 'rose', 'sand', 'mist'];

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Text styles from the Figma typography spec (Inter everywhere). */
export const type = {
  display64: { fontFamily: font.medium, fontSize: 64, lineHeight: 64, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  heading32: { fontFamily: font.semibold, fontSize: 32, lineHeight: 41.6, letterSpacing: -1 },
  heading24: { fontFamily: font.semibold, fontSize: 24, lineHeight: 31.2 },
  heading20: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26 },
  body16: { fontFamily: font.regular, fontSize: 16, lineHeight: 25.6 },
  body16Semi: { fontFamily: font.semibold, fontSize: 16, lineHeight: 25.6 },
  body15: { fontFamily: font.regular, fontSize: 15, lineHeight: 24 },
  body15Semi: { fontFamily: font.semibold, fontSize: 15, lineHeight: 24 },
  body14: { fontFamily: font.regular, fontSize: 14, lineHeight: 22.4 },
  body14Medium: { fontFamily: font.medium, fontSize: 14, lineHeight: 22.4 },
  body13: { fontFamily: font.regular, fontSize: 13, lineHeight: 20.8 },
  body12Semi: { fontFamily: font.semibold, fontSize: 12, lineHeight: 19.2 },
  label10Caps: { fontFamily: font.medium, fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
} satisfies Record<string, TextStyle>;

export const radius = { sm: 10, md: 16, lg: 24, xl: 32, full: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
