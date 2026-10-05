import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { mix } from '@/lib/color';
import type { ArcSegment, DailyFill } from '@/logic/day';
import { formatClockMin, formatDuration } from '@/logic/time';
import type { Settings } from '@/logic/types';
import { activityColor, color, type } from '@/theme';

import type { SphereLayer } from './SphereCanvas';
import SphereCanvasHost from './SphereCanvasHost';

interface Props {
  size: number;
  fill: DailyFill;
  settings: Settings;
  segments?: ArcSegment[];
  /** 0 at wake time, 1 at bedtime. */
  now?: number;
  bedtime?: boolean;
  /** Wake time that starts tomorrow (it can differ after a schedule change). */
  nextWake?: number;
  /** Replaces the centre text (e.g. onboarding preview). */
  center?: ReactNode;
}

const ARC_START = 150;
const ARC_SWEEP = 240;

/** Liquid body colours are darkened so white text on top stays readable. */
const bodyOf = (hex: string) => mix(hex, '#121215', 0.58);

export function DaySphere({ size, fill, settings, segments = [], now, bedtime, nextWake, center }: Props) {
  const reduced = useReducedMotion();
  const layers: SphereLayer[] = fill.layers.map((l) => ({
    key: l.activityId,
    color: activityColor[l.color],
    body: bodyOf(activityColor[l.color]),
    fraction: l.fraction,
  }));

  const ra = size / 2 - 10;
  const point = (deg: number, dr = 0) => {
    const a = (deg * Math.PI) / 180;
    return { x: size / 2 + (ra + dr) * Math.cos(a), y: size / 2 + (ra + dr) * Math.sin(a) };
  };
  const wakePt = point(ARC_START, 4);
  const sleepPt = point(ARC_START + ARC_SWEEP, 4);

  const target = formatDuration(fill.target);
  const spent = formatDuration(fill.wellSpent);
  let big = spent;
  let label = 'well spent today';
  let sub: string | null = fill.target > 0 ? `of ${target}` : null;
  if (fill.state === 'full') sub = 'Enough for today';
  if (fill.state === 'empty' && !bedtime) sub = `${target} planned`;
  if (fill.state === 'noActivities') {
    label = 'well spent today';
    sub = 'Add an activity to start';
  }
  if (fill.state === 'allResting') sub = 'A rest day. Nothing to fill.';
  if (fill.state === 'dayOff') {
    big = 'Day off';
    label = 'streaks are paused';
    sub = null;
  }
  if (bedtime && fill.state !== 'dayOff') {
    label = 'well spent · day done';
    sub = `New day at ${formatClockMin(nextWake ?? settings.wake)}`;
  }

  // Scales with the sphere so "1h 35m" always fits inside the glass (web can't auto-shrink text).
  const bigSize = Math.round(size * (big.length > 6 ? 0.135 : big.length > 4 ? 0.155 : 0.17));

  const summary =
    fill.state === 'dayOff'
      ? 'Day off. Streaks are paused.'
      : `${spent} well spent today${fill.target ? `, ${Math.round(fill.fraction * 100)} percent of today's ${target} plan` : ''}.`;

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="image" accessibilityLabel={summary}>
      <SphereCanvasHost
        size={size}
        level={fill.fraction}
        layers={layers}
        full={fill.state === 'full'}
        dim={fill.state === 'dayOff'}
        motion={!reduced}
        arc={now === undefined ? undefined : { now, segments: segments.map((s) => ({ key: s.sessionId, color: activityColor[s.color], from: s.from, to: s.to })) }}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, { paddingHorizontal: size * 0.17 }]}>
        {center ?? (
          <>
            <Text style={[styles.big, { fontSize: bigSize, lineHeight: bigSize * 1.05 }]} numberOfLines={1} adjustsFontSizeToFit>
              {big}
            </Text>
            <Text style={styles.label}>{label}</Text>
            {sub ? <Text style={[styles.sub, fill.state === 'full' && styles.subFull]}>{sub}</Text> : null}
          </>
        )}
      </View>
      {now !== undefined ? (
        <>
          <Text style={[styles.arcLabel, { left: wakePt.x - 24, top: wakePt.y + 6 }]}>{formatClockMin(settings.wake)}</Text>
          <Text style={[styles.arcLabel, { left: sleepPt.x - 24, top: sleepPt.y + 6 }]}>{formatClockMin(settings.sleep)}</Text>
          <View style={[styles.sleep, { top: size - 30 }]}>
            <View style={styles.moon}>
              <View style={styles.moonCut} />
            </View>
            <Text style={styles.sleepText}>Sleep</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 };

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  big: { ...type.display64, color: color.text, ...shadow },
  label: { ...type.body14Medium, color: color.text, marginTop: 4, ...shadow },
  sub: { ...type.body13, color: 'rgba(245,245,247,0.78)', marginTop: 2, ...shadow },
  subFull: { color: color.green, fontFamily: type.body12Semi.fontFamily },
  arcLabel: { position: 'absolute', width: 48, textAlign: 'center', ...type.body12Semi, color: color.textSecondary },
  sleep: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  moon: { width: 12, height: 12, borderRadius: 6, backgroundColor: color.nightGlow, overflow: 'hidden' },
  moonCut: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: color.bg, left: 4, top: -3 },
  sleepText: { ...type.body12Semi, color: color.textSecondary },
});
