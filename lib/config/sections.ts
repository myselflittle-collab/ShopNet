import { BACK_D, FRONT_D, MALL } from "./mall";
import { PATH_BOUNDS, PLAZA, offsetAt, offsetLength, pointAt, sAtOffsetLength } from "./path";

export type Gender = "women" | "men";
export type FixtureKind = "rack" | "shelves" | "table" | "cabinet";

export interface SectionDef {
  id: string;
  gender: Gender;
  slug: string;
  label: string;
  fixture: FixtureKind;
  /** clear frontage between the divider fins, metres */
  width: number;
  /** true when the 2D shop for this section exists */
  live: boolean;
}

export interface Vec2 {
  x: number;
  z: number;
}

export interface PlacedSection extends SectionDef {
  /** W1…W13 / M1…M11 */
  code: string;
  /** -1 = customer's left (women), +1 = customer's right (men) */
  side: 1 | -1;
  /** centreline positions of the two divider fins (start / end of the store along the path) */
  s0: number;
  s1: number;
  /** centreline position facing the middle of the store */
  sMid: number;
  /** clear portal opening, metres */
  opening: number;
  /** store frame: origin on the facade line, rotation so local +Z faces the walkway, local +X along the row */
  origin: Vec2;
  rotationY: number;
  /** back-wall chord ends in the store's local frame (x, z) — the fins are radial so the back is wider */
  backLeft: Vec2;
  backRight: Vec2;
  /** front chord half-width in the local frame (fin centre to fin centre / 2) */
  halfFront: number;
}

const W = MALL.bayWidth;

const women: SectionDef[] = [
  { id: "women-blazers", gender: "women", slug: "blazers", label: "Blazers", fixture: "rack", width: W, live: true },
  { id: "women-trousers", gender: "women", slug: "trousers", label: "Trousers & Pants", fixture: "rack", width: W, live: true },
  { id: "women-tshirts", gender: "women", slug: "t-shirts", label: "T-shirts", fixture: "table", width: W, live: true },
  { id: "women-shirts", gender: "women", slug: "shirts", label: "Shirts", fixture: "rack", width: W, live: true },
  { id: "women-dresses", gender: "women", slug: "dresses", label: "Dresses", fixture: "rack", width: W, live: true },
  { id: "women-jeans", gender: "women", slug: "jeans", label: "Jeans", fixture: "shelves", width: W, live: true },
  { id: "women-ethnic", gender: "women", slug: "ethnic-wear", label: "Ethnic Wear", fixture: "rack", width: W, live: true },
  { id: "women-skirts", gender: "women", slug: "skirts", label: "Skirts", fixture: "rack", width: W, live: true },
  { id: "women-jackets", gender: "women", slug: "jackets", label: "Jackets", fixture: "rack", width: W, live: true },
  { id: "women-innerwear", gender: "women", slug: "innerwear", label: "Innerwear", fixture: "table", width: W, live: true },
  { id: "women-shoes", gender: "women", slug: "shoes", label: "Shoes", fixture: "shelves", width: W, live: true },
  { id: "women-handbags", gender: "women", slug: "handbags", label: "Handbags", fixture: "shelves", width: W, live: true },
  { id: "women-accessories", gender: "women", slug: "accessories", label: "Accessories", fixture: "cabinet", width: W, live: true },
];

const men: SectionDef[] = [
  { id: "men-blazers", gender: "men", slug: "blazers", label: "Blazers", fixture: "rack", width: W, live: true },
  { id: "men-trousers", gender: "men", slug: "trousers", label: "Trousers & Pants", fixture: "rack", width: W, live: true },
  { id: "men-tshirts", gender: "men", slug: "t-shirts", label: "T-shirts", fixture: "table", width: W, live: true },
  { id: "men-shirts", gender: "men", slug: "shirts", label: "Shirts", fixture: "rack", width: W, live: true },
  { id: "men-jeans", gender: "men", slug: "jeans", label: "Jeans", fixture: "shelves", width: W, live: true },
  { id: "men-kurtas", gender: "men", slug: "kurtas", label: "Kurtas", fixture: "rack", width: W, live: true },
  { id: "men-jackets", gender: "men", slug: "jackets", label: "Jackets", fixture: "rack", width: W, live: true },
  { id: "men-innerwear", gender: "men", slug: "innerwear", label: "Innerwear", fixture: "table", width: W, live: true },
  { id: "men-accessories", gender: "men", slug: "accessories", label: "Accessories", fixture: "cabinet", width: W, live: true },
  { id: "men-shoes", gender: "men", slug: "shoes", label: "Shoes", fixture: "shelves", width: W * 2, live: true },
  { id: "men-watches", gender: "men", slug: "watches", label: "Watches", fixture: "cabinet", width: W * 2, live: true },
];

/** One row of boutiques centred along the storefront line between two centreline positions. */
function placeRow(list: SectionDef[], side: 1 | -1, sStart: number, sEnd: number, prefix: string): PlacedSection[] {
  // lateral offset: the customer's left is +d in path.ts
  const d = side === -1 ? FRONT_D : -FRONT_D;
  const db = side === -1 ? BACK_D : -BACK_D;
  const available = offsetLength(sStart, sEnd, d);
  const total = list.reduce((a, s) => a + s.width, 0) + MALL.fin * (list.length + 1);
  let along = (available - total) / 2 + MALL.fin / 2; // first fin centre
  const finS: number[] = [];
  const out: PlacedSection[] = [];
  const firstFin = sAtOffsetLength(sStart, along, d);
  finS.push(firstFin);
  for (const def of list) {
    along += MALL.fin / 2 + def.width + MALL.fin / 2;
    finS.push(sAtOffsetLength(sStart, along, d));
  }
  list.forEach((def, i) => {
    const s0 = finS[i];
    const s1 = finS[i + 1];
    const f0 = offsetAt(s0, d);
    const f1 = offsetAt(s1, d);
    const b0 = offsetAt(s0, db);
    const b1 = offsetAt(s1, db);
    // the straight facade touches the curved storefront line at its middle and lies behind it elsewhere,
    // so no part of a store ever enters the 4 m walkway
    const sMid = (s0 + s1) / 2;
    const lineMid = offsetAt(sMid, d);
    const chordMid = { x: (f0.x + f1.x) / 2, z: (f0.z + f1.z) / 2 };
    const pm = pointAt(sMid);
    // unit normal from the walkway toward the store
    const nx = lineMid.x - pm.x;
    const nz = lineMid.z - pm.z;
    const nl = Math.hypot(nx, nz);
    const into = { x: nx / nl, z: nz / nl };
    const sag = (lineMid.x - chordMid.x) * into.x + (lineMid.z - chordMid.z) * into.z;
    const origin = { x: chordMid.x + into.x * Math.max(0, sag), z: chordMid.z + into.z * Math.max(0, sag) };
    // local +Z faces the walkway (= -into)
    const rotationY = Math.atan2(-into.x, -into.z);
    const cos = Math.cos(rotationY);
    const sin = Math.sin(rotationY);
    // world → local: inverse rotation about Y
    const toLocal = (p: Vec2): Vec2 => {
      const dx = p.x - origin.x;
      const dz = p.z - origin.z;
      return { x: dx * cos - dz * sin, z: dx * sin + dz * cos };
    };
    const lb0 = toLocal(b0);
    const lb1 = toLocal(b1);
    const lf0 = toLocal(f0);
    const lf1 = toLocal(f1);
    const [backLeft, backRight] = lb0.x < lb1.x ? [lb0, lb1] : [lb1, lb0];
    out.push({
      ...def,
      code: `${prefix}${i + 1}`,
      side,
      s0,
      s1,
      sMid,
      opening: def.width > W ? MALL.portalOpeningWide : MALL.portalOpening,
      origin,
      rotationY,
      backLeft,
      backRight,
      halfFront: Math.abs(lf1.x - lf0.x) / 2,
    });
  });
  return out;
}

/** Women: customer's left, lobe 1 (end of foyer → start of plaza). */
export const WOMEN_ROW = { start: PATH_BOUNDS[1], end: PLAZA.start } as const;
/** Men: customer's right, lobe 2 (end of plaza → start of exit). */
export const MEN_ROW = { start: PLAZA.end, end: PATH_BOUNDS[6] } as const;

export const SECTIONS: PlacedSection[] = [
  ...placeRow(women, -1, WOMEN_ROW.start, WOMEN_ROW.end, "W"),
  ...placeRow(men, 1, MEN_ROW.start, MEN_ROW.end, "M"),
];

export const SECTION_BY_ID: Record<string, PlacedSection> = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

export function sectionByRoute(gender: string, slug: string): PlacedSection | undefined {
  return SECTIONS.find((s) => s.gender === gender && s.slug === slug);
}

export function sectionHref(s: SectionDef): string {
  return `/shop/${s.gender}/${s.slug}`;
}

/** Local (store frame) point → world. */
export function storeToWorld(s: PlacedSection, lx: number, lz: number): Vec2 {
  const c = Math.cos(s.rotationY);
  const n = Math.sin(s.rotationY);
  return { x: s.origin.x + lx * c + lz * n, z: s.origin.z - lx * n + lz * c };
}

/** Where the LCD sits in the store frame (centre of the back wall, facing the walkway). */
export function lcdLocal(s: PlacedSection) {
  const z = (s.backLeft.z + s.backRight.z) / 2 + 0.16;
  return { x: (s.backLeft.x + s.backRight.x) / 2, y: 2.04, z };
}

/** Camera pose on the centreline facing the middle of a store (deep links). */
export function viewingPose(s: PlacedSection) {
  const p = pointAt(s.sMid);
  const target = storeToWorld(s, 0, lcdLocal(s).z);
  const worldYaw = Math.atan2(-(target.x - p.x), -(target.z - p.z));
  const head = Math.atan2(Math.sin(worldYaw - p.yaw), Math.cos(worldYaw - p.yaw));
  return { s: s.sMid, headYaw: head, pitch: -0.03 };
}
