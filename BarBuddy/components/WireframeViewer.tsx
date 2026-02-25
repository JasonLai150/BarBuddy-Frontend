import { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PanResponder,
  type LayoutChangeEvent,
} from 'react-native';
import Svg, { Circle, Line as SvgLine } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BarBuddyColors } from '@/constants/theme';
import { getJobResults } from '@/services/api-service';
import type { LocalJob } from '@/services/api-service';

// ── Types ──────────────────────────────────────────────────────────
interface Landmark {
  idx: number;
  name: string;
  x: number;
  y: number;
  z: number;
  conf: number;
}

interface LandmarkFrame {
  t: number;
  landmarks: Landmark[];
  confidence: number;
}

interface LandmarksData {
  version: number;
  jobId: string;
  sampleFps: number;
  frames: LandmarkFrame[];
  metrics?: any;
}

interface WireframeViewerProps {
  job: LocalJob;
}

interface Point2D {
  x: number;
  y: number;
  visible: boolean;
  conf: number;
}

// ── COCO-17 skeleton ───────────────────────────────────────────────
const COCO_LIMBS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],       // Face
  [5, 6], [11, 12], [5, 11], [6, 12],   // Torso
  [5, 7], [7, 9],                         // Left arm
  [6, 8], [8, 10],                        // Right arm
  [11, 13], [13, 15],                     // Left leg
  [12, 14], [14, 16],                     // Right leg
  [0, 5], [0, 6],                         // Neck
];

const LEFT_IDX = new Set([1, 3, 5, 7, 9, 11, 13, 15]);
const RIGHT_IDX = new Set([2, 4, 6, 8, 10, 12, 14, 16]);

const C_JOINT = { left: '#7ED9CF', right: '#F87171', center: '#E5E7EB' };
const C_LIMB = { left: '#5FBFB6', right: '#E05555', center: '#888888' };
const CONF_MIN = 0.2;

function jColor(i: number) {
  return LEFT_IDX.has(i) ? C_JOINT.left : RIGHT_IDX.has(i) ? C_JOINT.right : C_JOINT.center;
}
function lColor(a: number, b: number) {
  if (LEFT_IDX.has(a) && LEFT_IDX.has(b)) return C_LIMB.left;
  if (RIGHT_IDX.has(a) && RIGHT_IDX.has(b)) return C_LIMB.right;
  return C_LIMB.center;
}

// ── 3D → 2D projection (orthographic with camera orbit) ───────────
function project(
  landmarks: Landmark[],
  theta: number,
  phi: number,
  w: number,
  h: number,
): Point2D[] {
  // Centroid of confident joints
  let cx = 0, cy = 0, cz = 0, n = 0;
  for (const lm of landmarks) {
    if (lm.conf > CONF_MIN) { cx += lm.x; cy += lm.y; cz += lm.z; n++; }
  }
  if (n > 0) { cx /= n; cy /= n; cz /= n; }

  const cosT = Math.cos(theta), sinT = Math.sin(theta);
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const scale = Math.min(w, h) * 0.7;

  return landmarks.map((lm) => {
    const x = lm.x - cx;
    const y = -(lm.y - cy); // flip Y
    const z = lm.z - cz;

    // Rotate Y (horizontal orbit), then X (vertical tilt)
    const rx = x * cosT + z * sinT;
    const rz = -x * sinT + z * cosT;
    const ry = y * cosP - rz * sinP;

    return {
      x: w / 2 + rx * scale,
      y: h / 2 - ry * scale,
      visible: lm.conf > CONF_MIN,
      conf: lm.conf,
    };
  });
}

// ── Component ──────────────────────────────────────────────────────
export function WireframeViewer({ job }: WireframeViewerProps) {
  const [data, setData] = useState<LandmarksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState({ w: 300, h: 400 });

  // Mutable refs for animation loop
  const dataRef = useRef<LandmarksData | null>(null);
  const frameRef = useRef(0);
  const playRef = useRef(true);
  const rafRef = useRef(0);
  const lastTick = useRef(0);

  // Camera orbit refs
  const theta = useRef(0);
  const phi = useRef(0.3);
  const savedTheta = useRef(0);
  const savedPhi = useRef(0.3);

  // ── Fetch data ────────────────────────────────────────────────
  useEffect(() => {
    let dead = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getJobResults(job.jobId);
        const lm = res.urls.find((u) => u.name === 'landmarks');
        if (!lm?.url) throw new Error('Landmarks not available for this job');
        const resp = await fetch(lm.url);
        if (!resp.ok) throw new Error('Failed to download landmarks');
        const json: LandmarksData = await resp.json();
        if (dead) return;
        dataRef.current = json;
        setData(json);
        frameRef.current = 0;
        setFrame(0);
      } catch (e: any) {
        if (!dead) setError(e.message ?? 'Unknown error');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [job.jobId]);

  // ── Animation loop ────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    const fps = data.sampleFps || 12;
    const dur = 1000 / fps;
    lastTick.current = performance.now();

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const now = performance.now();
      if (!playRef.current || !dataRef.current) return;
      if (now - lastTick.current >= dur) {
        lastTick.current = now - ((now - lastTick.current) % dur);
        const next = (frameRef.current + 1) % dataRef.current.frames.length;
        frameRef.current = next;
        setFrame(next);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [data]);

  // Sync state → refs
  useEffect(() => { playRef.current = playing; }, [playing]);

  // ── Pan to orbit ──────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        savedTheta.current = theta.current;
        savedPhi.current = phi.current;
      },
      onPanResponderMove: (_, g) => {
        theta.current = savedTheta.current - g.dx * 0.01;
        phi.current = Math.max(
          -Math.PI / 2 + 0.1,
          Math.min(Math.PI / 2 - 0.1, savedPhi.current + g.dy * 0.01),
        );
      },
    }),
  ).current;

  // ── Scrub ─────────────────────────────────────────────────────
  const scrub = useCallback((locX: number, trackW: number) => {
    const d = dataRef.current;
    if (!d || trackW <= 0) return;
    const f = Math.round(Math.max(0, Math.min(1, locX / trackW)) * (d.frames.length - 1));
    frameRef.current = f;
    setFrame(f);
    lastTick.current = performance.now();
  }, []);

  // ── Reset camera ──────────────────────────────────────────────
  const resetCam = useCallback(() => {
    theta.current = 0;
    phi.current = 0.3;
    setFrame((f) => f); // force re-render
  }, []);

  // ── Layout ────────────────────────────────────────────────────
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setSize({ w: width, h: height });
  }, []);

  // ── Derived ───────────────────────────────────────────────────
  const total = data?.frames.length ?? 0;
  const curFrame = data?.frames[frame];
  const pts = curFrame
    ? project(curFrame.landmarks, theta.current, phi.current, size.w, size.h)
    : null;

  const fmtTime = (i: number) => {
    const f = dataRef.current?.frames[i];
    return f ? `${f.t.toFixed(1)}s` : '0.0s';
  };
  const endTime = () => {
    const d = dataRef.current;
    return d && d.frames.length > 0
      ? `${d.frames[d.frames.length - 1].t.toFixed(1)}s`
      : '0.0s';
  };

  // ── Loading / Error ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={BarBuddyColors.primary} />
        <ThemedText style={s.loadingTxt}>Loading pose data...</ThemedText>
      </View>
    );
  }
  if (error) {
    return (
      <View style={s.center}>
        <IconSymbol name="exclamationmark.triangle" size={48} color={BarBuddyColors.error} />
        <ThemedText style={s.errTitle}>Error Loading Pose Data</ThemedText>
        <ThemedText style={s.errTxt}>{error}</ThemedText>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Canvas */}
      <View style={s.canvas} onLayout={onLayout} {...panResponder.panHandlers}>
        <Svg width={size.w} height={size.h}>
          {pts &&
            COCO_LIMBS.map(([a, b], i) => {
              const pA = pts[a], pB = pts[b];
              if (!pA.visible || !pB.visible) return null;
              return (
                <SvgLine
                  key={`l${i}`}
                  x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                  stroke={lColor(a, b)}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  opacity={Math.max(0.3, Math.min(pA.conf, pB.conf))}
                />
              );
            })}
          {pts?.map((p, i) => {
            if (!p.visible) return null;
            return (
              <Circle
                key={`j${i}`}
                cx={p.x} cy={p.y}
                r={p.conf > 0.5 ? 5 : p.conf > 0.3 ? 4 : 3}
                fill={jColor(i)}
                opacity={Math.max(0.4, p.conf)}
              />
            );
          })}
        </Svg>
      </View>

      {/* Controls */}
      <View style={s.controls}>
        <View style={s.timeRow}>
          <ThemedText style={s.timeTxt}>{fmtTime(frame)}</ThemedText>
          <ThemedText style={s.timeTxt}>{endTime()}</ThemedText>
        </View>

        <View style={s.scrubRow}>
          <View style={s.scrubTrack}>
            <View
              style={[s.scrubFill, {
                width: total > 1 ? `${(frame / (total - 1)) * 100}%` : '0%',
              }]}
            />
            <View
              style={s.scrubHit}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => scrub(e.nativeEvent.locationX, size.w - 32)}
              onResponderMove={(e) => scrub(e.nativeEvent.locationX, size.w - 32)}
            />
          </View>
        </View>

        <View style={s.btnRow}>
          <TouchableOpacity style={s.btn} onPress={resetCam} activeOpacity={0.7}>
            <IconSymbol name="arrow.counterclockwise" size={20} color={BarBuddyColors.whiteText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btn, s.playBtn]}
            onPress={() => setPlaying(!playing)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={playing ? 'pause.fill' : 'play.fill'}
              size={24}
              color={BarBuddyColors.dark}
            />
          </TouchableOpacity>

          <View style={s.frameInfo}>
            <ThemedText style={s.frameTxt}>{frame + 1} / {total}</ThemedText>
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={s.legend}>
        {(['left', 'right', 'center'] as const).map((side) => (
          <View key={side} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: C_JOINT[side] }]} />
            <ThemedText style={s.legendTxt}>
              {side.charAt(0).toUpperCase() + side.slice(1)}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1F2224' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingTxt: { marginTop: 12, color: BarBuddyColors.textSecondary, fontSize: 16 },
  errTitle: { fontSize: 18, fontWeight: '600', color: BarBuddyColors.whiteText, marginTop: 16 },
  errTxt: { fontSize: 14, color: BarBuddyColors.textSecondary, textAlign: 'center', marginTop: 8 },
  canvas: { flex: 1, backgroundColor: '#1A1D1F' },
  controls: {
    backgroundColor: BarBuddyColors.cardBackground,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: BarBuddyColors.border,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  timeTxt: { fontSize: 11, color: BarBuddyColors.textSecondary, fontVariant: ['tabular-nums'] },
  scrubRow: { marginBottom: 12 },
  scrubTrack: {
    height: 6, backgroundColor: BarBuddyColors.innerBackground,
    borderRadius: 3, overflow: 'hidden', position: 'relative',
  },
  scrubFill: { height: '100%', backgroundColor: BarBuddyColors.primary, borderRadius: 3 },
  scrubHit: { position: 'absolute', top: -12, left: 0, right: 0, bottom: -12 },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  btn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: BarBuddyColors.innerBackground,
    justifyContent: 'center', alignItems: 'center',
  },
  playBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: BarBuddyColors.primary },
  frameInfo: { minWidth: 80, alignItems: 'center' },
  frameTxt: { fontSize: 12, color: BarBuddyColors.textSecondary, fontVariant: ['tabular-nums'] },
  legend: {
    flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 8,
    backgroundColor: BarBuddyColors.cardBackground,
    borderTopWidth: 1, borderTopColor: BarBuddyColors.border,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 11, color: BarBuddyColors.textSecondary },
});
