/**
 * The S-shaped walking route (locked geometry GEO-004).
 *
 * Plan coordinates (metres): x east, y north. The customer enters at (0, 0) heading north.
 *   foyer 8 m straight → 5 m clothoid → R14 arc (right turn) → 10 m reversal clothoid (the plaza)
 *   → R14 arc (left turn) → 5 m clothoid → 6 m exit straight.          Each lobe turns 210°.
 * three.js world: X = x, Z = -y, so walking "north" is walking toward -Z (the old corridor direction).
 *
 * Everything else (stores, walls, floor, camera) is placed from this one centreline, so the
 * architecture always follows the walking path exactly and never leaves gaps.
 */

export const PATH_SPEC = {
  radius: 14,
  turnDeg: 210,
  clothoid: 5,
  foyer: 8,
  exit: 6,
} as const;

const DS = 0.02;

interface Built {
  s: Float64Array;
  x: Float64Array;
  y: Float64Array;
  th: Float64Array;
  kappa: Float64Array;
  /** segment boundaries in s: [0, foyerEnd, arc1Start, arc1End, arc2Start, arc2End, exitStart, end] */
  bounds: number[];
  arcLength: number;
}

function build(): Built {
  const { radius: R, turnDeg, clothoid: Lc, foyer, exit } = PATH_SPEC;
  const k = 1 / R;
  const arc = ((turnDeg * Math.PI) / 180 - k * Lc) * R;
  // right turn first (negative curvature), left turn second
  const segs: [number, number, number][] = [
    [foyer, 0, 0],
    [Lc, 0, -k],
    [arc, -k, -k],
    [2 * Lc, -k, k],
    [arc, k, k],
    [Lc, k, 0],
    [exit, 0, 0],
  ];
  const n = segs.reduce((a, [L]) => a + Math.round(L / DS), 0) + 1;
  const s = new Float64Array(n);
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const th = new Float64Array(n);
  const kappa = new Float64Array(n);
  const bounds = [0];
  let cx = 0;
  let cy = 0;
  let ct = Math.PI / 2;
  let cs = 0;
  let i = 0;
  s[0] = 0;
  x[0] = 0;
  y[0] = 0;
  th[0] = ct;
  for (const [L, k0, k1] of segs) {
    const steps = Math.round(L / DS);
    const h = L / steps;
    for (let j = 0; j < steps; j++) {
      const kap = k0 + ((k1 - k0) * (j + 0.5)) / steps;
      const mid = ct + (kap * h) / 2;
      cx += Math.cos(mid) * h;
      cy += Math.sin(mid) * h;
      ct += kap * h;
      cs += h;
      i++;
      s[i] = cs;
      x[i] = cx;
      y[i] = cy;
      th[i] = ct;
      kappa[i] = kap;
    }
    bounds.push(cs);
  }
  return { s, x, y, th, kappa, bounds, arcLength: arc };
}

const P = build();

export const PATH_LENGTH = P.s[P.s.length - 1];
export const PATH_BOUNDS = P.bounds;
export const PATH_ARC_LENGTH = P.arcLength;
/** The inflection point in the middle of the plaza. */
export const S_INFLECTION = (P.bounds[3] + P.bounds[4]) / 2;
/** 10 m store-free plaza = the whole reversal clothoid. */
export const PLAZA = { start: P.bounds[3], end: P.bounds[4] } as const;

export interface PathPoint {
  /** three.js world position on the floor */
  x: number;
  z: number;
  /** plan heading (radians, unwrapped; PI/2 = north) */
  heading: number;
  /** camera yaw that looks along the path (three.js: 0 looks toward -Z) */
  yaw: number;
  curvature: number;
}

function index(s: number) {
  const f = Math.max(0, Math.min(P.s.length - 1.000001, s / DS));
  const i = Math.floor(f);
  return { i, t: f - i };
}

export function pointAt(s: number): PathPoint {
  const { i, t } = index(s);
  const j = Math.min(P.s.length - 1, i + 1);
  const px = P.x[i] + (P.x[j] - P.x[i]) * t;
  const py = P.y[i] + (P.y[j] - P.y[i]) * t;
  const th = P.th[i] + (P.th[j] - P.th[i]) * t;
  return { x: px, z: -py, heading: th, yaw: th - Math.PI / 2, curvature: P.kappa[i] };
}

/**
 * World point at lateral offset d from the centreline.
 * d > 0 is the customer's LEFT (women's side in lobe 1), d < 0 the RIGHT (men's side in lobe 2).
 */
export function offsetAt(s: number, d: number): { x: number; z: number } {
  const p = pointAt(s);
  const ox = -Math.sin(p.heading) * d;
  const oy = Math.cos(p.heading) * d;
  return { x: p.x + ox, z: p.z - oy };
}

/** Arc length of the offset line between two centreline positions. */
export function offsetLength(s0: number, s1: number, d: number, step = 0.02): number {
  let len = 0;
  let prev = offsetAt(s0, d);
  for (let s = s0 + step; s <= s1 + 1e-9; s += step) {
    const p = offsetAt(Math.min(s, s1), d);
    len += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
  }
  return len;
}

/** Inverse of offsetLength: the centreline s whose offset point lies `len` metres along the offset line from s0. */
export function sAtOffsetLength(s0: number, len: number, d: number, step = 0.01): number {
  let acc = 0;
  let prev = offsetAt(s0, d);
  let s = s0;
  while (acc < len && s < PATH_LENGTH) {
    const ns = Math.min(PATH_LENGTH, s + step);
    const p = offsetAt(ns, d);
    const seg = Math.hypot(p.x - prev.x, p.z - prev.z);
    if (acc + seg >= len) {
      const f = seg > 0 ? (len - acc) / seg : 0;
      return s + (ns - s) * f;
    }
    acc += seg;
    prev = p;
    s = ns;
  }
  return s;
}

/** Nearest centreline position to a world point (used by tests and the visibility helper). */
export function nearestS(x: number, z: number): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < P.s.length; i += 5) {
    const d = (P.x[i] - x) ** 2 + (-P.y[i] - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = P.s[i];
    }
  }
  return best;
}
