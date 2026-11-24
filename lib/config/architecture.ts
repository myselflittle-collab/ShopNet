import { BACK_D, CORE_D, FRONT_D, MALL } from "./mall";
import { PATH_BOUNDS, PATH_LENGTH, PLAZA, offsetAt } from "./path";
import { SECTIONS, storeToWorld, type PlacedSection } from "./sections";

/**
 * One description of every wall the customer can see, shared by the renderer and the
 * video-visibility test, so what is drawn and what is "visible" can never disagree.
 * d(s) is the lateral offset from the centreline (+ = customer's left).
 */
export type WallKind = "wallpaper" | "stone" | "core" | "plaza";

export interface WallRun {
  key: string;
  s0: number;
  s1: number;
  d: (s: number) => number;
  kind: WallKind;
}

const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/** Piecewise smooth profile through (u, d) keys, u ∈ [0, 1]. */
function profile(keys: [number, number][]) {
  return (u: number) => {
    for (let i = 0; i < keys.length - 1; i++) {
      const [u0, d0] = keys[i];
      const [u1, d1] = keys[i + 1];
      if (u <= u1 || i === keys.length - 2) return d0 + (d1 - d0) * smooth((u - u0) / (u1 - u0));
    }
    return keys[keys.length - 1][1];
  };
}

const women = SECTIONS.filter((s) => s.gender === "women");
const men = SECTIONS.filter((s) => s.gender === "men");
export const ROWS = {
  women: { first: women[0].s0, last: women[women.length - 1].s1 },
  men: { first: men[0].s0, last: men[men.length - 1].s1 },
};

const PLAZA_WIDE = 4.5;
const plazaLeft = profile([
  [0, FRONT_D],
  [0.18, PLAZA_WIDE],
  [0.82, PLAZA_WIDE],
  [1, CORE_D],
]);
const plazaRight = profile([
  [0, -CORE_D],
  [0.18, -PLAZA_WIDE],
  [0.82, -PLAZA_WIDE],
  [1, -FRONT_D],
]);
const u = (s: number, a: number, b: number) => (s - a) / (b - a);
const [, FOYER_END, , , , , EXIT_START] = PATH_BOUNDS;

export const WALLS: WallRun[] = [
  // customer's LEFT
  { key: "L-foyer", s0: 0, s1: ROWS.women.first, d: () => FRONT_D, kind: "wallpaper" },
  { key: "L-women-end", s0: ROWS.women.last, s1: PLAZA.start, d: () => FRONT_D, kind: "stone" },
  { key: "L-plaza", s0: PLAZA.start, s1: PLAZA.end, d: (s) => plazaLeft(u(s, PLAZA.start, PLAZA.end)), kind: "plaza" },
  { key: "L-core", s0: PLAZA.end, s1: EXIT_START, d: () => CORE_D, kind: "core" },
  {
    key: "L-exit",
    s0: EXIT_START,
    s1: PATH_LENGTH,
    d: (s) => CORE_D + (FRONT_D - CORE_D) * smooth(u(s, EXIT_START, EXIT_START + 1.6)),
    kind: "wallpaper",
  },
  // customer's RIGHT
  { key: "R-foyer", s0: 0, s1: FOYER_END, d: () => -FRONT_D, kind: "wallpaper" },
  {
    key: "R-core",
    s0: FOYER_END,
    s1: PLAZA.start,
    d: (s) => -(FRONT_D + (CORE_D - FRONT_D) * smooth(u(s, FOYER_END, FOYER_END + 1.6))),
    kind: "core",
  },
  { key: "R-plaza", s0: PLAZA.start, s1: PLAZA.end, d: (s) => plazaRight(u(s, PLAZA.start, PLAZA.end)), kind: "plaza" },
  { key: "R-men-start", s0: PLAZA.end, s1: ROWS.men.first, d: () => -FRONT_D, kind: "stone" },
  { key: "R-men-end", s0: ROWS.men.last, s1: EXIT_START, d: () => -FRONT_D, kind: "stone" },
  { key: "R-exit", s0: EXIT_START, s1: PATH_LENGTH, d: () => -FRONT_D, kind: "wallpaper" },
];

/** Floor and ceiling extend under the stores and to the walls on the other side. */
export function leftEdge(s: number): number {
  if (s >= ROWS.women.first - 0.3 && s <= ROWS.women.last + 0.3) return BACK_D;
  const w = WALLS.find((r) => r.key.startsWith("L-") && s >= r.s0 && s <= r.s1);
  return (w ? w.d(s) : FRONT_D) + 0.05;
}
export function rightEdge(s: number): number {
  if (s >= ROWS.men.first - 0.3 && s <= ROWS.men.last + 0.3) return -BACK_D;
  const w = WALLS.find((r) => r.key.startsWith("R-") && s >= r.s0 && s <= r.s1);
  return (w ? w.d(s) : -FRONT_D) - 0.05;
}

/** Facade return pieces of a store, in its local frame: [x0, x1] spans either side of the portal. */
export function facadeReturns(s: PlacedSection): [number, number][] {
  const h = s.halfFront - MALL.fin / 2;
  const o = s.opening / 2;
  return [
    [-h, -o],
    [o, h],
  ];
}

export interface Segment {
  ax: number;
  az: number;
  bx: number;
  bz: number;
}

/** Full-height occluders in plan (walls, fins, facade returns) for the LCD visibility test. */
export function occluderSegments(step = 0.5): Segment[] {
  const out: Segment[] = [];
  for (const w of WALLS) {
    for (let s = w.s0; s < w.s1 - 1e-6; s += step) {
      const e = Math.min(w.s1, s + step);
      const a = offsetAt(s, w.d(s));
      const b = offsetAt(e, w.d(e));
      out.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
  }
  for (const st of SECTIONS) {
    const d0 = st.side === -1 ? FRONT_D : -FRONT_D;
    const d1 = st.side === -1 ? BACK_D : -BACK_D;
    for (const sf of [st.s0, st.s1]) {
      const a = offsetAt(sf, d0);
      const b = offsetAt(sf, d1);
      out.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
    for (const [x0, x1] of facadeReturns(st)) {
      const a = storeToWorld(st, x0, 0);
      const b = storeToWorld(st, x1, 0);
      out.push({ ax: a.x, az: a.z, bx: b.x, bz: b.z });
    }
  }
  return out;
}

/** True when the straight line from p to q crosses any occluder. */
export function blocked(px: number, pz: number, qx: number, qz: number, segs: Segment[]): boolean {
  const rx = qx - px;
  const rz = qz - pz;
  for (const g of segs) {
    const sx = g.bx - g.ax;
    const sz = g.bz - g.az;
    const den = rx * sz - rz * sx;
    if (Math.abs(den) < 1e-12) continue;
    const qpx = g.ax - px;
    const qpz = g.az - pz;
    const t = (qpx * sz - qpz * sx) / den;
    const v = (qpx * rz - qpz * rx) / den;
    if (t > 1e-6 && t < 1 - 1e-3 && v >= 0 && v <= 1) return true;
  }
  return false;
}
