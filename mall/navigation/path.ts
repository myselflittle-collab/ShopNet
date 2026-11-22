import * as THREE from "three";

export const MALL_PATH_LENGTH = 126.626;
export const MALL_FOYER_END = 8;
export const MALL_WOMEN_END = 59.313;
export const MALL_PLAZA_END = 69.313;
export const MALL_MEN_END = 120.626;
export const MALL_PATH_STEP = 0.02;

export interface PathFrame {
  s: number;
  x: number;
  z: number;
  /** World yaw of the forward path tangent. Starts at zero and remains unwrapped. */
  yaw: number;
  curvature: number;
  rightX: number;
  rightZ: number;
}

interface Segment {
  length: number;
  k0: number;
  k1: number;
}

const R = 14;
const K = 1 / R;
const CLOTHOID = 5;
const ARC = (210 * Math.PI) / 180 * R - K * CLOTHOID * R;

const SEGMENTS: Segment[] = [
  { length: 8, k0: 0, k1: 0 },
  { length: CLOTHOID, k0: 0, k1: -K },
  { length: ARC, k0: -K, k1: -K },
  { length: 10, k0: -K, k1: K },
  { length: ARC, k0: K, k1: K },
  { length: CLOTHOID, k0: K, k1: 0 },
  { length: 6, k0: 0, k1: 0 },
];

function makeFrame(s: number, x: number, planY: number, planHeading: number, curvature: number): PathFrame {
  const yaw = planHeading - Math.PI / 2;
  return {
    s,
    x,
    z: -planY,
    yaw,
    curvature,
    rightX: Math.cos(yaw),
    rightZ: -Math.sin(yaw),
  };
}

function buildPathTable(): PathFrame[] {
  const table: PathFrame[] = [];
  let s = 0;
  let x = 0;
  let y = 0;
  let heading = Math.PI / 2;
  table.push(makeFrame(s, x, y, heading, 0));

  for (const segment of SEGMENTS) {
    const count = Math.max(1, Math.ceil(segment.length / MALL_PATH_STEP));
    const h = segment.length / count;
    for (let i = 0; i < count; i++) {
      const u = (i + 0.5) / count;
      const curvature = segment.k0 + (segment.k1 - segment.k0) * u;
      const midHeading = heading + curvature * h * 0.5;
      x += Math.cos(midHeading) * h;
      y += Math.sin(midHeading) * h;
      heading += curvature * h;
      s += h;
      table.push(makeFrame(s, x, y, heading, curvature));
    }
  }
  return table;
}

const PATH_TABLE = buildPathTable();

export function pathLength() {
  return PATH_TABLE[PATH_TABLE.length - 1].s;
}

export function pathFrameAt(distance: number): PathFrame {
  const s = THREE.MathUtils.clamp(distance, 0, pathLength());
  let low = 0;
  let high = PATH_TABLE.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (PATH_TABLE[mid].s < s) low = mid + 1;
    else high = mid;
  }
  const upper = PATH_TABLE[low];
  const lower = PATH_TABLE[Math.max(0, low - 1)];
  const span = Math.max(1e-9, upper.s - lower.s);
  const t = THREE.MathUtils.clamp((s - lower.s) / span, 0, 1);
  const x = THREE.MathUtils.lerp(lower.x, upper.x, t);
  const z = THREE.MathUtils.lerp(lower.z, upper.z, t);
  const yaw = THREE.MathUtils.lerp(lower.yaw, upper.yaw, t);
  return {
    s,
    x,
    z,
    yaw,
    curvature: THREE.MathUtils.lerp(lower.curvature, upper.curvature, t),
    rightX: Math.cos(yaw),
    rightZ: -Math.sin(yaw),
  };
}

/** Lateral distance is measured along the customer's local right axis; negative is left. */
export function pathOffsetAt(distance: number, lateral: number) {
  const frame = pathFrameAt(distance);
  return {
    x: frame.x + frame.rightX * lateral,
    z: frame.z + frame.rightZ * lateral,
    yaw: frame.yaw,
    s: frame.s,
  };
}

export function pathSamples(start: number, end: number, maxStep = 0.25): PathFrame[] {
  const a = THREE.MathUtils.clamp(Math.min(start, end), 0, pathLength());
  const b = THREE.MathUtils.clamp(Math.max(start, end), 0, pathLength());
  const count = Math.max(1, Math.ceil((b - a) / maxStep));
  return Array.from({ length: count + 1 }, (_, i) => pathFrameAt(a + ((b - a) * i) / count));
}
