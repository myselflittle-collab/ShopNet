"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BACK_D, FRONT_D, MALL } from "@/lib/config/mall";
import { offsetAt, pointAt } from "@/lib/config/path";
import { SECTIONS, lcdLocal, type PlacedSection } from "@/lib/config/sections";
import { facadeReturns } from "@/lib/config/architecture";
import { useMallStore } from "@/lib/bridge/mallStore";
import { useTutorial } from "@/lib/bridge/tutorialStore";
import { getStoreWallpaper } from "@/mall/scene/materialTextures";
import { LcdScreen } from "@/mall/video/LcdScreen";

const H = MALL.ceiling;
const PORTAL_H = MALL.portalHeight;
const W1_ID = SECTIONS[0].id;

const shared = (() => {
  if (typeof document === "undefined") return null;
  return {
    facade: new THREE.MeshStandardMaterial({ color: "#efe8dc", roughness: 0.38, metalness: 0.02, envMapIntensity: 0.7 }),
    brass: new THREE.MeshStandardMaterial({ color: "#c9a56a", metalness: 0.88, roughness: 0.22, envMapIntensity: 1.3 }),
    lacquer: {
      women: new THREE.MeshPhysicalMaterial({ color: "#2a2023", roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 }),
      men: new THREE.MeshPhysicalMaterial({ color: "#1b2026", roughness: 0.18, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.2 }),
    },
    fin: new THREE.MeshStandardMaterial({ color: "#e6ddd0", roughness: 0.42, envMapIntensity: 0.6 }),
    floor: {
      women: new THREE.MeshStandardMaterial({ color: "#c9b49a", roughness: 0.35, metalness: 0.02 }),
      men: new THREE.MeshStandardMaterial({ color: "#8f8a82", roughness: 0.35, metalness: 0.02 }),
    },
    light: new THREE.MeshBasicMaterial({ color: "#ffe7c2", toneMapped: false }),
    rail: new THREE.MeshStandardMaterial({ color: "#b8955c", metalness: 0.9, roughness: 0.25 }),
    garment: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85 }),
  };
})();

/** Glowing category text with a baked halo, drawn once per store (no full-screen bloom). */
function signTexture(s: PlacedSection) {
  const w = 1024;
  const h = 192;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, w, h);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const title = s.label.toUpperCase();
  const draw = (blur: number, alpha: number) => {
    g.save();
    g.shadowColor = `rgba(255,196,120,${alpha})`;
    g.shadowBlur = blur;
    g.fillStyle = "#ffe2b0";
    g.font = '600 78px Georgia, "Times New Roman", serif';
    if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "10px";
    g.fillText(title, w / 2, 82);
    g.restore();
  };
  draw(34, 0.9);
  draw(12, 0.9);
  draw(0, 0);
  g.font = '500 24px "Helvetica Neue", Arial, sans-serif';
  if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "9px";
  g.fillStyle = "rgba(226,190,130,0.95)";
  g.fillText(s.gender === "women" ? "WOMEN  ·  SHOPNET" : "MEN  ·  SHOPNET", w / 2, 150);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function quadGeometry(pts: [number, number][], y: number) {
  const g = new THREE.BufferGeometry();
  const [a, b, c, d] = pts;
  g.setAttribute("position", new THREE.Float32BufferAttribute([a[0], y, a[1], b[0], y, b[1], c[0], y, c[1], d[0], y, d[1]], 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  return g;
}

function StoreUnitImpl({ s }: { s: PlacedSection }) {
  const m = shared!;
  const hf = s.halfFront - MALL.fin / 2;
  const back = { l: s.backLeft, r: s.backRight };
  const backMid = { x: (back.l.x + back.r.x) / 2, z: (back.l.z + back.r.z) / 2 };
  const backLen = Math.hypot(back.r.x - back.l.x, back.r.z - back.l.z) - MALL.fin;
  const backAngle = -Math.atan2(back.r.z - back.l.z, back.r.x - back.l.x);
  const wallpaper = useMemo(() => getStoreWallpaper(s.gender, s.id), [s.gender, s.id]);
  const backMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: wallpaper, color: s.gender === "women" ? "#efe4dc" : "#d9dbdd", roughness: 0.7 }),
    [wallpaper, s.gender],
  );
  const sign = useMemo(() => signTexture(s), [s]);
  const signMat = useMemo(() => new THREE.MeshBasicMaterial({ map: sign, transparent: true, toneMapped: false, depthWrite: false }), [sign]);
  const floor = useMemo(
    () =>
      quadGeometry(
        [
          [-hf, 0.02],
          [hf, 0.02],
          [back.r.x - 0.1, back.r.z + 0.05],
          [back.l.x + 0.1, back.l.z + 0.05],
        ],
        0.006,
      ),
    [hf, back.l.x, back.l.z, back.r.x, back.r.z],
  );
  useEffect(
    () => () => {
      sign.dispose();
      signMat.dispose();
      backMat.dispose();
      floor.dispose();
    },
    [sign, signMat, backMat, floor],
  );

  // W1 stays softly lit behind its scrim until the tutorial's last step
  const isW1 = s.id === W1_ID;
  const signRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!isW1) return;
    const t = useTutorial.getState();
    const k = t.revealed ? Math.min(1, (performance.now() - t.revealAt) / 1600) : 0;
    const level = 0.35 + 0.65 * k;
    if (signRef.current) (signRef.current.material as THREE.MeshBasicMaterial).opacity = level;
    if (lightRef.current) (lightRef.current.material as THREE.MeshBasicMaterial).color.setScalar(level);
  });
  const lightMat = useMemo(() => (isW1 ? m.light.clone() : m.light), [isW1, m.light]);
  const signMatFinal = useMemo(() => (isW1 ? signMat.clone() : signMat), [isW1, signMat]);

  return (
    <group position={[s.origin.x, 0, s.origin.z]} rotation-y={s.rotationY}>
      {/* facade returns (each store's own framing, never across the entrance) */}
      {facadeReturns(s).map(([x0, x1]) => (
        <mesh key={x0} position={[(x0 + x1) / 2, PORTAL_H / 2, -0.11]} material={m.facade}>
          <boxGeometry args={[x1 - x0 + 0.02, PORTAL_H, 0.22]} />
        </mesh>
      ))}
      {/* brass jambs */}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[(k * s.opening) / 2, PORTAL_H / 2, -0.11]} material={m.brass}>
          <boxGeometry args={[0.05, PORTAL_H, 0.24]} />
        </mesh>
      ))}
      {/* glossy header board with glowing category name */}
      <mesh position={[0, PORTAL_H + (H - PORTAL_H) / 2, -0.15]} material={m.lacquer[s.gender]}>
        <boxGeometry args={[hf * 2 + 0.02, H - PORTAL_H, 0.3]} />
      </mesh>
      <mesh position={[0, PORTAL_H + 0.015, -0.15]} material={m.brass}>
        <boxGeometry args={[hf * 2 + 0.02, 0.03, 0.32]} />
      </mesh>
      <mesh ref={signRef} position={[0, PORTAL_H + 0.58, 0.006]} material={signMatFinal}>
        <planeGeometry args={[Math.min(3.6, hf * 2 - 0.3), Math.min(3.6, hf * 2 - 0.3) * (192 / 1024)]} />
      </mesh>
      {/* interior */}
      <mesh geometry={floor} material={m.floor[s.gender]} />
      <mesh position={[backMid.x, H / 2, backMid.z + 0.02]} rotation-y={backAngle} material={backMat}>
        <planeGeometry args={[backLen, H]} />
      </mesh>
      <mesh ref={lightRef} position={[backMid.x, H - 0.08, backMid.z + 0.35]} rotation-y={backAngle} material={lightMat}>
        <boxGeometry args={[backLen - 0.5, 0.04, 0.05]} />
      </mesh>
      <LcdScreen section={s} position={lcdLocal(s)} rotationY={backAngle} />
      {isW1 && <Scrim s={s} />}
    </group>
  );
}

export const StoreUnit = memo(StoreUnitImpl);

/** Translucent fashion scrim inside W1's portal; it rises into the portal header when the tour ends. */
function Scrim({ s }: { s: PlacedSection }) {
  const ref = useRef<THREE.Mesh>(null);
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    for (let x = 0; x < 256; x++) {
      const v = 0.5 + 0.5 * Math.sin((x / 256) * Math.PI * 14);
      g.fillStyle = `rgba(250,244,234,${0.45 + v * 0.35})`;
      g.fillRect(x, 0, 1, 256);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex, transparent: true, opacity: 0.72, roughness: 0.9, side: THREE.DoubleSide, depthWrite: false }),
    [tex],
  );
  useEffect(() => () => (tex.dispose(), mat.dispose()), [tex, mat]);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const t = useTutorial.getState();
    const k = t.revealed ? Math.min(1, (performance.now() - t.revealAt) / 1600) : 0;
    const e = k * k * (3 - 2 * k);
    const h = PORTAL_H * (1 - e);
    m.visible = h > 0.01;
    m.scale.y = Math.max(0.0001, 1 - e);
    m.position.y = PORTAL_H - h / 2;
  });
  return (
    <mesh ref={ref} position={[0, PORTAL_H / 2, -0.17]} material={mat}>
      <planeGeometry args={[s.opening - 0.02, PORTAL_H]} />
    </mesh>
  );
}

/** Radial divider fins (floor to ceiling) with brass nosings, plus row-end pilasters: one draw call each. */
export function Fins() {
  const fins = useMemo(() => {
    const out: { s: number; d0: number; d1: number }[] = [];
    for (const st of SECTIONS) {
      const d0 = st.side === -1 ? FRONT_D : -FRONT_D;
      const d1 = st.side === -1 ? BACK_D : -BACK_D;
      for (const sf of [st.s0, st.s1]) if (!out.some((f) => Math.abs(f.s - sf) < 0.05 && Math.sign(f.d0) === Math.sign(d0))) out.push({ s: sf, d0, d1 });
    }
    return out;
  }, []);
  const body = useRef<THREE.InstancedMesh>(null);
  const nose = useRef<THREE.InstancedMesh>(null);
  const bodyGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    fins.forEach((f, i) => {
      const a = offsetAt(f.s, f.d0);
      const b = offsetAt(f.s, f.d1);
      const yaw = pointAt(f.s).yaw;
      o.position.set((a.x + b.x) / 2, H / 2, (a.z + b.z) / 2);
      o.rotation.set(0, yaw, 0);
      o.scale.set(Math.hypot(b.x - a.x, b.z - a.z), H, MALL.fin);
      o.updateMatrix();
      body.current?.setMatrixAt(i, o.matrix);
      const n = offsetAt(f.s, f.d0 - Math.sign(f.d0) * 0.012);
      o.position.set(n.x, H / 2, n.z);
      o.scale.set(0.04, H, MALL.fin + 0.04);
      o.updateMatrix();
      nose.current?.setMatrixAt(i, o.matrix);
    });
    if (body.current) body.current.instanceMatrix.needsUpdate = true;
    if (nose.current) nose.current.instanceMatrix.needsUpdate = true;
  }, [fins]);
  if (!shared) return null;
  return (
    <group>
      <instancedMesh ref={body} args={[bodyGeo, shared.fin, fins.length]} />
      <instancedMesh ref={nose} args={[bodyGeo, shared.brass, fins.length]} />
    </group>
  );
}

/** Two brass rails of garments in every boutique, as one instanced draw call. */
export function Garments() {
  const items = useMemo(() => {
    const out: { m: THREE.Matrix4; c: THREE.Color }[] = [];
    const rails: THREE.Matrix4[] = [];
    const o = new THREE.Object3D();
    const parent = new THREE.Object3D();
    const palettes = {
      women: ["#e9d5c9", "#b7808a", "#f3eee6", "#8c6f86", "#d8b98e", "#40343b", "#c5a7a0"],
      men: ["#2f3a46", "#8b8f93", "#e8e4dc", "#5b4a3c", "#1f242a", "#a3896a", "#6f7c86"],
    };
    let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    for (const s of SECTIONS) {
      parent.position.set(s.origin.x, 0, s.origin.z);
      parent.rotation.set(0, s.rotationY, 0);
      parent.updateMatrixWorld(true);
      const hf = s.halfFront - MALL.fin / 2;
      const backZ = (s.backLeft.z + s.backRight.z) / 2;
      for (const side of [-1, 1]) {
        const x = side * (hf - 0.32);
        const z0 = -0.7;
        const z1 = Math.max(backZ + 1.4, -2.2);
        o.position.set(x, 1.47, (z0 + z1) / 2);
        o.rotation.set(Math.PI / 2, 0, 0);
        o.scale.set(1, Math.abs(z1 - z0), 1);
        o.updateMatrix();
        rails.push(new THREE.Matrix4().multiplyMatrices(parent.matrixWorld, o.matrix));
        const n = Math.floor(Math.abs(z1 - z0) / 0.17);
        const pal = palettes[s.gender];
        for (let i = 0; i < n; i++) {
          o.position.set(x, 0.98, z0 - 0.08 - i * 0.17);
          o.rotation.set(0, 0, 0);
          o.scale.set(0.46, 0.95, 0.05);
          o.updateMatrix();
          out.push({ m: new THREE.Matrix4().multiplyMatrices(parent.matrixWorld, o.matrix), c: new THREE.Color(pal[Math.floor(rnd() * pal.length)]) });
        }
      }
    }
    return { out, rails };
  }, []);
  const g = useRef<THREE.InstancedMesh>(null);
  const r = useRef<THREE.InstancedMesh>(null);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const rod = useMemo(() => new THREE.CylinderGeometry(0.014, 0.014, 1, 8), []);
  useLayoutEffect(() => {
    items.out.forEach((it, i) => {
      g.current?.setMatrixAt(i, it.m);
      g.current?.setColorAt(i, it.c);
    });
    items.rails.forEach((m, i) => r.current?.setMatrixAt(i, m));
    if (g.current) {
      g.current.instanceMatrix.needsUpdate = true;
      if (g.current.instanceColor) g.current.instanceColor.needsUpdate = true;
    }
    if (r.current) r.current.instanceMatrix.needsUpdate = true;
  }, [items]);
  if (!shared) return null;
  return (
    <group>
      <instancedMesh ref={g} args={[box, shared.garment, items.out.length]} />
      <instancedMesh ref={r} args={[rod, shared.rail, items.rails.length]} />
    </group>
  );
}

/** All boutiques. Featured state is read inside each LCD; nothing here re-renders per frame. */
export function Stores() {
  useMallStore((st) => st.ready);
  return (
    <group>
      {SECTIONS.map((s) => (
        <StoreUnit key={s.id} s={s} />
      ))}
      <Fins />
      <Garments />
    </group>
  );
}
