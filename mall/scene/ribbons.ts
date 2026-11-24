import * as THREE from "three";
import { offsetAt, pointAt } from "@/lib/config/path";

/**
 * Geometry that follows the S-shaped centreline exactly. Walls, floor, ceiling, light lines and
 * planters are all swept along the same path, so neighbouring pieces always meet without gaps.
 */

function steps(s0: number, s1: number, step: number) {
  const n = Math.max(1, Math.ceil((s1 - s0) / step));
  return Array.from({ length: n + 1 }, (_, i) => s0 + ((s1 - s0) * i) / n);
}

/** Horizontal strip between two lateral offsets (floor, ceiling, inlays). UVs are in metres / scale. */
export function stripGeometry(
  s0: number,
  s1: number,
  dA: (s: number) => number,
  dB: (s: number) => number,
  y: number,
  opts: { step?: number; uvScale?: number; facing?: "up" | "down" } = {},
) {
  const { step = 0.25, uvScale = 2, facing = "up" } = opts;
  const ss = steps(s0, s1, step);
  const pos: number[] = [];
  const uv: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const ny = facing === "up" ? 1 : -1;
  ss.forEach((s, i) => {
    const a = dA(s);
    const b = dB(s);
    const pa = offsetAt(s, a);
    const pb = offsetAt(s, b);
    pos.push(pa.x, y, pa.z, pb.x, y, pb.z);
    uv.push(s / uvScale, a / uvScale, s / uvScale, b / uvScale);
    nrm.push(0, ny, 0, 0, ny, 0);
    if (i > 0) {
      const k = i * 2;
      // winding chosen so the visible face points along `facing` (a = left of b when d grows to the left)
      // dA is the left (larger) offset: this order faces up
      if (facing === "up") idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
      else idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Vertical wall following offset d(s), visible from the walkway side. */
export function wallGeometry(
  s0: number,
  s1: number,
  d: (s: number) => number,
  y0: number,
  y1: number,
  opts: { step?: number; uScale?: number; vScale?: number } = {},
) {
  const { step = 0.25, uScale = 2, vScale } = opts;
  const vs = vScale ?? uScale;
  const ss = steps(s0, s1, step);
  const pos: number[] = [];
  const uv: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  let along = 0;
  let prev: { x: number; z: number } | null = null;
  const leftSide = d((s0 + s1) / 2) > 0;
  ss.forEach((s, i) => {
    const p = offsetAt(s, d(s));
    if (prev) along += Math.hypot(p.x - prev.x, p.z - prev.z);
    prev = p;
    const c = pointAt(s);
    let nx = c.x - p.x;
    let nz = c.z - p.z;
    const l = Math.hypot(nx, nz) || 1;
    nx /= l;
    nz /= l;
    pos.push(p.x, y0, p.z, p.x, y1, p.z);
    uv.push(along / uScale, y0 / vs, along / uScale, y1 / vs);
    nrm.push(nx, 0, nz, nx, 0, nz);
    if (i > 0) {
      const k = i * 2;
      if (leftSide) idx.push(k - 2, k, k - 1, k - 1, k, k + 1);
      else idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Evenly spaced positions along an offset line (pillars, light fittings, reveals). */
export function placements(s0: number, s1: number, d: (s: number) => number, spacing: number) {
  const out: { x: number; z: number; yaw: number; s: number }[] = [];
  const n = Math.max(1, Math.floor((s1 - s0) / spacing));
  const pad = (s1 - s0 - n * spacing) / 2 + spacing / 2;
  for (let i = 0; i < n; i++) {
    const s = s0 + pad + i * spacing;
    const p = offsetAt(s, d(s));
    out.push({ x: p.x, z: p.z, yaw: pointAt(s).yaw, s });
  }
  return out;
}

/** Flat quad across the path at position s (an end cap), visible from both sides. */
export function capGeometry(s: number, dA: number, dB: number, y0: number, y1: number) {
  const a = offsetAt(s, dA);
  const b = offsetAt(s, dB);
  const t = pointAt(s);
  // tangent along the path (direction of travel) in world XZ
  const tx = -Math.sin(t.yaw);
  const tz = -Math.cos(t.yaw);
  const pos = [a.x, y0, a.z, b.x, y0, b.z, b.x, y1, b.z, a.x, y1, a.z];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute([...pos, ...pos], 3));
  const n: number[] = [];
  for (let i = 0; i < 4; i++) n.push(tx, 0, tz);
  for (let i = 0; i < 4; i++) n.push(-tx, 0, -tz);
  g.setAttribute("normal", new THREE.Float32BufferAttribute(n, 3));
  const w = Math.abs(dA - dB);
  const uv = [0, y0, w, y0, w, y1, 0, y1];
  g.setAttribute("uv", new THREE.Float32BufferAttribute([...uv, ...uv], 2));
  g.setIndex([0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6]);
  return g;
}

/**
 * A solid swept block between two lateral offsets (planters, skirting, caps): top face,
 * the face toward the walkway and both end caps, so it never reads as a paper-thin strip.
 * dNear is the offset closer to the centreline.
 */
export function sweptBox(s0: number, s1: number, dNear: number, dFar: number, y0: number, y1: number, opts: { step?: number; uScale?: number } = {}) {
  const { step = 0.25, uScale = 2 } = opts;
  const hi = Math.max(dNear, dFar);
  const lo = Math.min(dNear, dFar);
  return mergeGeometries([
    stripGeometry(s0, s1, () => hi, () => lo, y1, { step, uvScale: uScale }),
    wallGeometry(s0, s1, () => dNear, y0, y1, { step, uScale, vScale: uScale }),
    capGeometry(s0, dNear, dFar, y0, y1),
    capGeometry(s1, dNear, dFar, y0, y1),
  ]);
}

export function mergeGeometries(list: THREE.BufferGeometry[]) {
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const g of list) {
    pos.push(...(g.getAttribute("position").array as Float32Array));
    nrm.push(...(g.getAttribute("normal").array as Float32Array));
    uv.push(...(g.getAttribute("uv").array as Float32Array));
    idx.push(...Array.from(g.getIndex()!.array).map((i) => i + off));
    off += g.getAttribute("position").count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  out.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  out.setIndex(idx);
  return out;
}
