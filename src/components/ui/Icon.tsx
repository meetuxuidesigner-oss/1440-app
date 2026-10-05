import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { color as palette } from '@/theme';

export type IconName =
  | 'home'
  | 'week'
  | 'circles'
  | 'you'
  | 'play'
  | 'stop'
  | 'plus'
  | 'close'
  | 'back'
  | 'chevron'
  | 'check'
  | 'moon'
  | 'flame'
  | 'clock';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  /** Filled variant (used for the active tab). */
  filled?: boolean;
}

/** Simple line icons drawn to match SF Symbols' weight. */
export function Icon({ name, size = 24, color = palette.text, filled }: Props) {
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  const f = filled ? color : 'none';
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...s} fill={f} d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z" />}
      {name === 'week' && (
        <>
          <Rect {...s} fill={f} x={4} y={5} width={16} height={15} rx={3} />
          <Path {...s} stroke={filled ? palette.bg : color} d="M4 10h16" />
          <Path {...s} d="M8.5 3v4M15.5 3v4" />
        </>
      )}
      {name === 'circles' && (
        <>
          <Circle {...s} fill={f} cx={9} cy={12} r={5} />
          <Circle {...s} cx={15} cy={12} r={5} />
        </>
      )}
      {name === 'you' && (
        <>
          <Circle {...s} fill={f} cx={12} cy={8.5} r={3.8} />
          <Path {...s} fill={f} d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5z" />
        </>
      )}
      {name === 'play' && <Path fill={color} d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z" />}
      {name === 'stop' && <Rect fill={color} x={6.5} y={6.5} width={11} height={11} rx={2.5} />}
      {name === 'plus' && <Path {...s} strokeWidth={2.2} d="M12 5v14M5 12h14" />}
      {name === 'close' && <Path {...s} strokeWidth={2} d="M6 6l12 12M18 6 6 18" />}
      {name === 'back' && <Path {...s} strokeWidth={2.2} d="M15 5l-7 7 7 7" />}
      {name === 'chevron' && <Path {...s} strokeWidth={2} d="M9 5l7 7-7 7" />}
      {name === 'check' && <Path {...s} strokeWidth={2.4} d="M5 12.5l4.5 4.5L19 7.5" />}
      {name === 'moon' && <Path fill={color} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}
      {name === 'flame' && (
        <Path
          fill={color}
          d="M12 2.5c.5 3-1.6 4.6-3 6.4C7.7 10.6 7 12.3 7 14a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.6-4.3-.3 1.2-1 2-2 2.3.6-3.4-.2-6.8-1.4-9.5z"
        />
      )}
      {name === 'clock' && (
        <>
          <Circle {...s} cx={12} cy={12} r={8} />
          <Path {...s} d="M12 7.5V12l3 2" />
        </>
      )}
    </Svg>
  );
}
