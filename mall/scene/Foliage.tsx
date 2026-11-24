"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CORE_D } from "@/lib/config/mall";
import { offsetAt, pointAt } from "@/lib/config/path";
import { getLeafCluster } from "./materialTextures";

/**
 * Realistic clipped boxwood / laurel: thousands of small leaf-cluster cards (three crossed,
 * alpha-tested quads each) scattered over a dark core with irregular height, size, rotation and
 * colour, so the hedge has depth, a soft uneven top and individual leaves instead of a flat pattern.
 * One instanced draw call for every hedge and topiary in the mall.
 */

function cardGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const p = new THREE.PlaneGeometry(1, 1);
    p.rotateY((i * Math.PI) / 3);
    p.rotateX((i - 1) * 0.35);
    parts.push(p);
  }
  const pos: number[] = [];
  const uv: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  let off = 0;
  for (const p of parts) {
    const a = p.getAttribute("position").array as Float32Array;
    const u = p.getAttribute("uv").array as Float32Array;
    for (let i = 0; i < a.length / 3; i++) {
      pos.push(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]);
      // foliage lighting: normals point mostly up and out, so every card shades like a leaf mass
      const n = new THREE.Vector3(a[i * 3] * 0.9, 0.8, a[i * 3 + 2] * 0.9).normalize();
      nrm.push(n.x, n.y, n.z);
    }
    uv.push(...u);
    idx.push(...Array.from(p.getIndex()!.array).map((k) => k + off));
    off += a.length / 3;
    p.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

interface Leaf {
  x: number;
  y: number;
  z: number;
  s: number;
}

function rng(seed: number) {
  let v = seed;
  return () => ((v = (v * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Leaf positions for a planter hedge running along the atrium edge. */
function hedgeLeaves(run: { s0: number; s1: number; sign: number }, r: () => number): Leaf[] {
  const out: Leaf[] = [];
  for (let s = run.s0 + 0.05; s < run.s1 - 0.05; s += 0.07) {
    // soft, slightly wavy clipped top
    const wave = Math.sin(s * 1.7) * 0.025 + Math.sin(s * 4.3) * 0.015;
    for (let k = 0; k < 4; k++) {
      const d = run.sign * (2.42 + r() * (CORE_D - 2.5));
      const p = offsetAt(s + (r() - 0.5) * 0.08, d);
      out.push({ x: p.x, y: 0.93 + wave + (r() - 0.5) * 0.08, z: p.z, s: 0.24 + r() * 0.14 });
    }
    for (let k = 0; k < 3; k++) {
      const p = offsetAt(s + (r() - 0.5) * 0.08, run.sign * (2.4 + r() * 0.06));
      out.push({ x: p.x, y: 0.56 + r() * 0.36, z: p.z, s: 0.22 + r() * 0.12 });
    }
  }
  return out;
}

/** Leaves for a round topiary ball (plaza planters). */
export function ballLeaves(cx: number, cy: number, cz: number, radius: number, r: () => number): Leaf[] {
  const out: Leaf[] = [];
  const n = Math.round(radius * radius * 520);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    const k = Math.sqrt(1 - u * u);
    const rr = radius * (0.9 + r() * 0.12);
    out.push({ x: cx + Math.cos(a) * k * rr, y: cy + u * rr, z: cz + Math.sin(a) * k * rr, s: 0.2 + r() * 0.12 });
  }
  return out;
}

export function Foliage({
  runs,
  balls = [],
}: {
  runs: { s0: number; s1: number; sign: number }[];
  balls?: { x: number; y: number; z: number; r: number }[];
}) {
  const leaves = useMemo(() => {
    const r = rng(1234);
    const all = runs.flatMap((run) => hedgeLeaves(run, r));
    for (const b of balls) all.push(...ballLeaves(b.x, b.y, b.z, b.r, r));
    return all;
  }, [runs, balls]);
  const geo = useMemo(() => cardGeometry(), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: getLeafCluster(),
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0,
        envMapIntensity: 0.15,
      }),
    [],
  );
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const r = rng(99);
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    leaves.forEach((l, i) => {
      o.position.set(l.x, l.y, l.z);
      o.rotation.set((r() - 0.5) * 0.9, r() * Math.PI * 2, (r() - 0.5) * 0.9);
      o.scale.setScalar(l.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // natural variation: new growth lighter, inner leaves darker
      const v = 0.7 + r() * 0.35;
      c.setRGB(v * (0.92 + r() * 0.1), v, v * (0.85 + r() * 0.1));
      m.setColorAt(i, c);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [leaves]);
  return <instancedMesh ref={ref} args={[geo, mat, leaves.length]} frustumCulled={false} />;
}

/** Plan point helper for callers that place topiary by path position. */
export function pathPoint(s: number, d: number) {
  const p = offsetAt(s, d);
  return { ...p, yaw: pointAt(s).yaw };
}
