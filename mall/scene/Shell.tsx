"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CORE_D, FRONT_D, MALL } from "@/lib/config/mall";
import { PATH_BOUNDS, PATH_LENGTH, PLAZA, pointAt } from "@/lib/config/path";
import { WALLS, leftEdge, rightEdge, type WallKind, type WallRun } from "@/lib/config/architecture";
import { placements, stripGeometry, wallGeometry } from "./ribbons";
import { Foliage } from "./Foliage";
import { getFlutedStone, getPolishedStoneTexture, getShopnetWallpaper, getStoreWallpaper } from "./materialTextures";

const H = MALL.ceiling;

function useDisposable<T extends { dispose: () => void }>(make: () => T, deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const v = useMemo(make, deps);
  useEffect(() => () => v.dispose(), [v]);
  return v;
}

function textured(t: THREE.Texture | null, repeat: [number, number] = [1, 1]) {
  if (!t) return null;
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(...repeat);
  c.needsUpdate = true;
  return c;
}

/** Materials shared by every architectural surface. */
function useMaterials() {
  return useMemo(() => {
    const stone = getPolishedStoneTexture();
    const wallpaper = getShopnetWallpaper();
    const fluted = getFlutedStone("warm");
    const limestone = getStoreWallpaper("women", "mall-limestone");
    return {
      floor: new THREE.MeshStandardMaterial({ map: stone, color: "#ddd6cb", roughness: 0.22, metalness: 0.06, envMapIntensity: 0.9 }),
      walkway: new THREE.MeshStandardMaterial({ map: textured(stone, [0.7, 0.7]), color: "#cfc6b8", roughness: 0.16, metalness: 0.1, envMapIntensity: 1.1 }),
      brass: new THREE.MeshStandardMaterial({ color: "#c2a06a", metalness: 0.85, roughness: 0.25, envMapIntensity: 1.2 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#f7f3ec", emissive: "#e8dfd0", emissiveIntensity: 0.55, roughness: 0.92 }),
      lightLine: new THREE.MeshBasicMaterial({ color: "#fff6e4", toneMapped: false }),
      coveWarm: new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }),
      skirting: new THREE.MeshStandardMaterial({ color: "#3a332b", roughness: 0.4, metalness: 0.3 }),
      wall: {
        wallpaper: new THREE.MeshStandardMaterial({ map: wallpaper, color: "#ffffff", roughness: 0.62, metalness: 0.04, envMapIntensity: 0.5 }),
        stone: new THREE.MeshStandardMaterial({ map: limestone, color: "#efe9e0", roughness: 0.6 }),
        core: new THREE.MeshStandardMaterial({ map: fluted, color: "#ffffff", roughness: 0.48, envMapIntensity: 0.6 }),
        plaza: new THREE.MeshStandardMaterial({ map: fluted, color: "#f6efe3", roughness: 0.42, envMapIntensity: 0.7 }),
      } as Record<WallKind, THREE.MeshStandardMaterial>,
      planter: new THREE.MeshStandardMaterial({ map: limestone, color: "#e7dfd2", roughness: 0.5 }),
      hedge: new THREE.MeshStandardMaterial({ color: "#1d2a17", roughness: 1 }),
      pillar: new THREE.MeshStandardMaterial({ map: fluted, color: "#fbf6ee", roughness: 0.4, envMapIntensity: 0.7 }),
    };
  }, []);
}

/** Floor, ceiling, light lines and every wall, all swept along the S-shaped path. */
export function Shell() {
  const m = useMaterials();
  const L = PATH_LENGTH;

  const floor = useDisposable(() => stripGeometry(0, L, leftEdge, rightEdge, 0, { uvScale: 3 }));
  const walkway = useDisposable(() => stripGeometry(0, L, () => 1.82, () => -1.82, 0.002, { uvScale: 3 }));
  const inlays = useDisposable(() => {
    const a = stripGeometry(0, L, () => 1.87, () => 1.82, 0.004, { step: 0.2 });
    const b = stripGeometry(0, L, () => -1.82, () => -1.87, 0.004, { step: 0.2 });
    return mergeTwo(a, b);
  });
  const ceiling = useDisposable(() => stripGeometry(0, L, leftEdge, rightEdge, H, { facing: "down", uvScale: 3 }));
  const centreLight = useDisposable(() => stripGeometry(0.4, L - 0.4, () => 0.09, () => -0.09, H - 0.01, { facing: "down", step: 0.2 }));
  const coves = useDisposable(() => {
    const a = stripGeometry(0, L, () => 1.98, () => 1.9, H - 0.012, { facing: "down", step: 0.2 });
    const b = stripGeometry(0, L, () => -1.9, () => -1.98, H - 0.012, { facing: "down", step: 0.2 });
    return mergeTwo(a, b);
  });

  return (
    <group>
      <mesh geometry={floor} material={m.floor} />
      <mesh geometry={walkway} material={m.walkway} />
      <mesh geometry={inlays} material={m.brass} />
      <mesh name="ceiling" geometry={ceiling} material={m.ceiling} />
      <mesh geometry={centreLight} material={m.lightLine} />
      <mesh geometry={coves} material={m.coveWarm} />
      {WALLS.map((w) => (
        <WallPiece key={w.key} run={w} materials={m} />
      ))}
      <AtriumEdge materials={m} />
      <Entrances materials={m} />
    </group>
  );
}

function mergeTwo(a: THREE.BufferGeometry, b: THREE.BufferGeometry) {
  const pos = [...(a.getAttribute("position").array as Float32Array), ...(b.getAttribute("position").array as Float32Array)];
  const nrm = [...(a.getAttribute("normal").array as Float32Array), ...(b.getAttribute("normal").array as Float32Array)];
  const uv = [...(a.getAttribute("uv").array as Float32Array), ...(b.getAttribute("uv").array as Float32Array)];
  const off = a.getAttribute("position").count;
  const idx = [...Array.from(a.getIndex()!.array), ...Array.from(b.getIndex()!.array).map((i) => i + off)];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  a.dispose();
  b.dispose();
  return g;
}

type Mats = ReturnType<typeof useMaterials>;

function WallPiece({ run, materials: m }: { run: WallRun; materials: Mats }) {
  const inward = (s: number) => {
    const d = run.d(s);
    return d - Math.sign(d) * 0.012;
  };
  const scale = run.kind === "wallpaper" ? 1.6 : run.kind === "core" || run.kind === "plaza" ? 1.6 : 3.8;
  const wall = useDisposable(() => wallGeometry(run.s0, run.s1, run.d, 0, H, { uScale: scale, vScale: H }), [run]);
  const skirting = useDisposable(() => wallGeometry(run.s0, run.s1, inward, 0, 0.12, { uScale: 1 }), [run]);
  const crown = useDisposable(() => wallGeometry(run.s0, run.s1, inward, H - 0.16, H - 0.12, { uScale: 1 }), [run]);
  return (
    <group>
      <mesh geometry={wall} material={m.wall[run.kind]} />
      <mesh geometry={skirting} material={m.skirting} />
      <mesh geometry={crown} material={run.kind === "core" || run.kind === "plaza" ? m.coveWarm : m.brass} />
    </group>
  );
}

/** The 1.344 m atrium edge: printed-stone pillars every 5.6 m and a clipped boxwood planter between them. */
function AtriumEdge({ materials: m }: { materials: Mats }) {
  const runs = useMemo(() => {
    const [, foyerEnd, , , , , exitStart] = PATH_BOUNDS;
    return [
      { s0: foyerEnd + 2.2, s1: PLAZA.start - 0.4, sign: -1 },
      { s0: PLAZA.end + 0.6, s1: exitStart - 0.8, sign: 1 },
    ];
  }, []);

  const planterFront = useDisposable(() => mergeMany(runs.map((r) => wallGeometry(r.s0, r.s1, () => r.sign * 2.26, 0, 0.5, { uScale: 3.8 }))));
  const planterCap = useDisposable(() =>
    mergeMany(runs.map((r) => (r.sign > 0 ? stripGeometry(r.s0, r.s1, () => 2.36, () => 2.22, 0.5) : stripGeometry(r.s0, r.s1, () => -2.22, () => -2.36, 0.5)))),
  );
  const hedgeFront = useDisposable(() => mergeMany(runs.map((r) => wallGeometry(r.s0, r.s1, () => r.sign * 2.47, 0.5, 0.88, { uScale: 0.8, vScale: 0.8 }))));
  const hedgeTop = useDisposable(() =>
    mergeMany(
      runs.map((r) =>
        r.sign > 0
          ? stripGeometry(r.s0, r.s1, () => CORE_D - 0.02, () => 2.47, 0.88, { uvScale: 0.8 })
          : stripGeometry(r.s0, r.s1, () => -2.47, () => -(CORE_D - 0.02), 0.88, { uvScale: 0.8 }),
      ),
    ),
  );

  const pillars = useMemo(() => runs.flatMap((r) => placements(r.s0, r.s1, () => r.sign * 2.78, 5.6)), [runs]);
  const shaft = useRef<THREE.InstancedMesh>(null);
  const ring = useRef<THREE.InstancedMesh>(null);
  const shaftGeo = useDisposable(() => new THREE.CylinderGeometry(0.22, 0.22, H, 24, 1, true));
  const ringGeo = useDisposable(() => new THREE.CylinderGeometry(0.27, 0.27, 0.14, 24));
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    pillars.forEach((p, i) => {
      o.position.set(p.x, H / 2, p.z);
      o.rotation.set(0, p.yaw, 0);
      o.updateMatrix();
      shaft.current?.setMatrixAt(i, o.matrix);
      for (const [k, y] of [0.07, H - 0.07].entries()) {
        o.position.set(p.x, y, p.z);
        o.updateMatrix();
        ring.current?.setMatrixAt(i * 2 + k, o.matrix);
      }
    });
    if (shaft.current) shaft.current.instanceMatrix.needsUpdate = true;
    if (ring.current) ring.current.instanceMatrix.needsUpdate = true;
  }, [pillars]);

  return (
    <group>
      <mesh geometry={planterFront} material={m.planter} />
      <mesh geometry={planterCap} material={m.brass} />
      <mesh geometry={hedgeFront} material={m.hedge} />
      <mesh geometry={hedgeTop} material={m.hedge} />
      <Foliage runs={runs} />
      <instancedMesh ref={shaft} args={[shaftGeo, m.pillar, pillars.length]} />
      <instancedMesh ref={ring} args={[ringGeo, m.brass, pillars.length * 2]} />
    </group>
  );
}

function mergeMany(list: THREE.BufferGeometry[]) {
  return list.reduce((a, b) => mergeTwo(a, b));
}

/** Glass entrance and exit with daylight beyond, framed in bronze; the walkway is never blocked inside. */
function Entrances({ materials: m }: { materials: Mats }) {
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#cfe0e6", transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2, depthWrite: false }),
    [],
  );
  const daylight = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f4f1ea", toneMapped: false }), []);
  const ends = useMemo(() => {
    return [
      { s: 0, flip: false },
      { s: PATH_LENGTH, flip: true },
    ];
  }, []);
  return (
    <group>
      {ends.map((e) => (
        <EndPortal key={e.s} s={e.s} flip={e.flip} glass={glass} daylight={daylight} frame={m.skirting} brass={m.brass} />
      ))}
    </group>
  );
}


function EndPortal({
  s,
  flip,
  glass,
  daylight,
  frame,
  brass,
}: {
  s: number;
  flip: boolean;
  glass: THREE.Material;
  daylight: THREE.Material;
  frame: THREE.Material;
  brass: THREE.Material;
}) {
  const p = pointAt(s);
  const yaw = p.yaw + (flip ? 0 : Math.PI);
  const w = FRONT_D * 2;
  return (
    <group position={[p.x, 0, p.z]} rotation-y={yaw}>
      {/* local -Z points out of the mall */}
      <mesh position={[0, H / 2, -0.02]} material={glass}>
        <planeGeometry args={[w, H]} />
      </mesh>
      <mesh position={[0, H / 2, -2.2]} material={daylight}>
        <planeGeometry args={[w + 6, H + 2]} />
      </mesh>
      {[-1.4, -0.02, 1.38].map((x) => (
        <mesh key={x} position={[x + 0.01, 1.55, 0]} material={frame}>
          <boxGeometry args={[0.05, 3.1, 0.08]} />
        </mesh>
      ))}
      <mesh position={[0, 3.1, 0]} material={brass}>
        <boxGeometry args={[w, 0.06, 0.1]} />
      </mesh>
      <mesh position={[0, 3.65, 0.02]} material={frame}>
        <boxGeometry args={[w, 1.1, 0.06]} />
      </mesh>
    </group>
  );
}
