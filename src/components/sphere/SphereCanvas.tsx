import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Skia,
  SweepGradient,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useRef } from 'react';
import {
  Easing,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

export interface SphereLayer {
  key: string;
  /** Activity colour, full strength. */
  color: string;
  /** Liquid body colour (darkened so white text stays readable on it). */
  body: string;
  /** Share of the sphere's full height, 0–1. */
  fraction: number;
}

export interface SphereArcSegment {
  key: string;
  color: string;
  from: number;
  to: number;
}

export interface SphereCanvasProps {
  size: number;
  /** 0–1. The sphere can't overfill. */
  level: number;
  layers: SphereLayer[];
  full: boolean;
  dim?: boolean;
  /** Awake-day arc: 0 at wake time, 1 at bedtime. */
  arc?: { now: number; segments: SphereArcSegment[] };
  motion: boolean;
}

const GREEN = '#36D65E';
const ARC_START = 150;
const ARC_SWEEP = 240;

const BUBBLES = [
  { x: -0.55, r: 2.2, speed: 0.07, offset: 0.1 },
  { x: -0.2, r: 1.6, speed: 0.09, offset: 0.55 },
  { x: 0.1, r: 2.6, speed: 0.06, offset: 0.3 },
  { x: 0.35, r: 1.8, speed: 0.1, offset: 0.8 },
  { x: 0.6, r: 2, speed: 0.08, offset: 0.45 },
  { x: -0.4, r: 1.4, speed: 0.11, offset: 0.95 },
  { x: 0.48, r: 1.3, speed: 0.12, offset: 0.2 },
];

/** One wavy liquid surface, from the left edge to the right edge of the sphere. */
function wave(
  cx: number,
  cy: number,
  r: number,
  y0: number,
  amp: number,
  t: number,
  speed: number,
  phase: number,
  tilt: number,
  closed: boolean,
): SkPath {
  'worklet';
  const p = Skia.PathBuilder.Make();
  const x0 = cx - r - 4;
  const x1 = cx + r + 4;
  for (let x = x0; x <= x1 + 0.01; x += 4) {
    const u = (x - x0) / (x1 - x0);
    const y =
      y0 +
      amp * Math.sin(u * Math.PI * 2.4 + t * speed + phase) +
      amp * 0.45 * Math.sin(u * Math.PI * 4.6 - t * speed * 1.4 + phase) +
      tilt * (u - 0.5);
    if (x === x0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  if (closed) {
    p.lineTo(x1, cy + r + 6);
    p.lineTo(x0, cy + r + 6);
    p.close();
  }
  return p.build();
}

function LiquidLayer(props: {
  cx: number;
  cy: number;
  r: number;
  /** Top of this layer as a share of the current liquid height (0–1). */
  share: number;
  isTop: boolean;
  index: number;
  layer: SphereLayer;
  clock: SharedValue<number>;
  level: SharedValue<number>;
  slosh: SharedValue<number>;
}) {
  const { cx, cy, r, share, isTop, index, layer, clock, level, slosh } = props;
  const amp = isTop ? 5 : 2.5;
  const speed = 0.9 + index * 0.25;
  const phase = index * 1.7;

  const body = useDerivedValue(() => {
    const lv = level.value;
    const calm = lv >= 0.999 ? 0.35 : 1;
    const y0 = cy + r - share * lv * 2 * r;
    const tilt = slosh.value * 18 * Math.sin(clock.value * 3.2);
    return wave(cx, cy, r, y0, amp * calm * (1 + slosh.value * 1.5), clock.value, speed, phase, tilt, true);
  });
  const crest = useDerivedValue(() => {
    const lv = level.value;
    const calm = lv >= 0.999 ? 0.35 : 1;
    const y0 = cy + r - share * lv * 2 * r;
    const tilt = slosh.value * 18 * Math.sin(clock.value * 3.2);
    return wave(cx, cy, r, y0, amp * calm * (1 + slosh.value * 1.5), clock.value, speed, phase, tilt, false);
  });

  return (
    <Group>
      <Path path={body} color={layer.body} />
      <Path path={crest} color={layer.color} style="stroke" strokeWidth={isTop ? 2 : 1.2} opacity={isTop ? 0.95 : 0.55} />
      {isTop ? (
        <Path path={crest} color={layer.color} style="stroke" strokeWidth={6} opacity={0.35}>
          <BlurMask blur={6} style="normal" />
        </Path>
      ) : null}
    </Group>
  );
}

export default function SphereCanvas({ size, level: target, layers, full, dim, arc, motion }: SphereCanvasProps) {
  const cx = size / 2;
  const cy = size / 2;
  const RA = size / 2 - 10;
  const R = size * 0.355;
  const r = R - 5;

  const clock = useSharedValue(0);
  const level = useSharedValue(motion ? 0 : target);
  const slosh = useSharedValue(0);

  useFrameCallback((frame) => {
    clock.value = (frame.timeSinceFirstFrame ?? 0) / 1000;
  }, motion);

  const previous = useRef(motion ? 0 : target);
  useEffect(() => {
    const delta = Math.abs(target - previous.current);
    previous.current = target;
    if (!motion) {
      level.value = target;
      slosh.value = 0;
      return;
    }
    if (delta < 0.0005) return;
    // A big pour sloshes a lot; the slow minute-by-minute rise barely moves the surface.
    const strength = Math.min(1, 0.15 + delta * 5);
    level.value = withTiming(target, { duration: delta > 0.05 ? 1500 : 900, easing: Easing.out(Easing.cubic) });
    slosh.value = withSequence(withTiming(strength, { duration: 250 }), withTiming(0, { duration: 2200, easing: Easing.out(Easing.quad) }));
  }, [target, motion, level, slosh]);

  const total = layers.reduce((s, l) => s + l.fraction, 0) || 1;
  const shares = layers.map((_, i) => layers.slice(0, i + 1).reduce((s, l) => s + l.fraction, 0) / total);

  const clip = useMemo(() => Skia.PathBuilder.Make().addCircle(cx, cy, r).build(), [cx, cy, r]);
  const arcRect = useMemo(() => Skia.XYWHRect(cx - RA, cy - RA, RA * 2, RA * 2), [cx, cy, RA]);
  const track = useMemo(() => Skia.PathBuilder.Make().addArc(arcRect, ARC_START, ARC_SWEEP).build(), [arcRect]);
  const elapsed = useMemo(
    () => (arc && arc.now > 0 ? Skia.PathBuilder.Make().addArc(arcRect, ARC_START, ARC_SWEEP * arc.now).build() : null),
    [arc, arcRect],
  );
  const specular = useMemo(() => {
    const k = r * 0.78;
    return Skia.PathBuilder.Make().addArc(Skia.XYWHRect(cx - k, cy - k, k * 2, k * 2), 198, 52).build();
  }, [cx, cy, r]);

  const bubbles = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    const lv = level.value;
    if (lv < 0.06) return p.build();
    const bottom = cy + r;
    const surface = bottom - lv * 2 * r;
    for (let i = 0; i < BUBBLES.length; i++) {
      const b = BUBBLES[i];
      const prog = (clock.value * b.speed + b.offset) % 1;
      const y = bottom - prog * (bottom - surface);
      const x = cx + b.x * r * 0.8 + Math.sin(clock.value * 2 + i) * 2;
      if (y > surface + 8) p.addCircle(x, y, b.r);
    }
    return p.build();
  });

  const nowAngle = arc ? ((ARC_START + ARC_SWEEP * arc.now) * Math.PI) / 180 : 0;
  const glowColor = full ? GREEN : layers[layers.length - 1]?.color ?? GREEN;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group opacity={dim ? 0.55 : 1}>
        {/* Awake-day arc: wake (bottom left) to bedtime (bottom right); the gap at the bottom is sleep */}
        {arc ? (
          <Group>
            <Path path={track} color="rgba(255,255,255,0.10)" style="stroke" strokeWidth={4} strokeCap="round" />
            {elapsed ? <Path path={elapsed} color="rgba(255,255,255,0.42)" style="stroke" strokeWidth={4} strokeCap="round" /> : null}
            {arc.segments.map((s) => (
              <Path
                key={s.key}
                path={Skia.PathBuilder.Make().addArc(arcRect, ARC_START + ARC_SWEEP * s.from, Math.max(0.6, ARC_SWEEP * (s.to - s.from))).build()}
                color={s.color}
                style="stroke"
                strokeWidth={7}
                strokeCap="round"
              />
            ))}
            <Circle cx={cx + RA * Math.cos(nowAngle)} cy={cy + RA * Math.sin(nowAngle)} r={9} color="rgba(255,255,255,0.35)">
              <BlurMask blur={6} style="normal" />
            </Circle>
            <Circle cx={cx + RA * Math.cos(nowAngle)} cy={cy + RA * Math.sin(nowAngle)} r={5.5} color="#F5F5F7" />
          </Group>
        ) : null}

        {/* Soft glow around the sphere in the liquid's colour */}
        <Circle cx={cx} cy={cy} r={R + 2} color={glowColor} opacity={target > 0 ? 0.22 : 0.06}>
          <BlurMask blur={26} style="normal" />
        </Circle>

        {/* Glass body */}
        <Circle cx={cx} cy={cy} r={R} color="#0E0E10" />
        <Circle cx={cx} cy={cy} r={r} color="#121215" />

        {/* Liquid */}
        <Group clip={clip}>
          {layers
            .map((layer, i) => ({ layer, i }))
            .reverse()
            .map(({ layer, i }) => (
              <LiquidLayer
                key={layer.key}
                cx={cx}
                cy={cy}
                r={r}
                share={shares[i]}
                isTop={i === layers.length - 1}
                index={i}
                layer={layer}
                clock={clock}
                level={level}
                slosh={slosh}
              />
            ))}
          <Path path={bubbles} color="rgba(255,255,255,0.32)" />
          <Rect x={cx - r} y={cy - r} width={r * 2} height={r * 2}>
            <LinearGradient start={vec(cx, cy - r)} end={vec(cx, cy + r)} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.38)']} />
          </Rect>
          {/* Inner shadow: darker towards the edge, so it reads as a ball */}
          <Circle cx={cx} cy={cy} r={r}>
            <RadialGradient
              c={vec(cx - r * 0.18, cy - r * 0.22)}
              r={r * 1.25}
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
              positions={[0, 0.55, 1]}
            />
          </Circle>
        </Group>

        {/* Rim: brighter at the top left, where the light comes from */}
        <Circle cx={cx} cy={cy} r={R - 2.5} style="stroke" strokeWidth={1.5}>
          <SweepGradient
            c={vec(cx, cy)}
            colors={[
              'rgba(255,255,255,0.07)',
              'rgba(255,255,255,0.10)',
              'rgba(255,255,255,0.14)',
              'rgba(255,255,255,0.22)',
              'rgba(255,255,255,0.40)',
              'rgba(255,255,255,0.60)',
              'rgba(255,255,255,0.32)',
              'rgba(255,255,255,0.10)',
              'rgba(255,255,255,0.07)',
            ]}
          />
        </Circle>
        <Circle cx={cx} cy={cy} r={R} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.10)" />
        {full ? (
          <Circle cx={cx} cy={cy} r={R} style="stroke" strokeWidth={2} color={GREEN} opacity={0.7}>
            <BlurMask blur={4} style="solid" />
          </Circle>
        ) : null}

        {/* Specular reflection */}
        <Path path={specular} color="rgba(255,255,255,0.30)" style="stroke" strokeWidth={7} strokeCap="round">
          <BlurMask blur={3} style="normal" />
        </Path>
        <Circle cx={cx - r * 0.42} cy={cy - r * 0.6} r={3} color="rgba(255,255,255,0.5)">
          <BlurMask blur={2} style="normal" />
        </Circle>
      </Group>
    </Canvas>
  );
}
