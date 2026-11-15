"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { HALF_W, MALL } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";

const METAL = "#9a9890";
const WOOD = "#b8a68e";
const GARMENT_TONES = ["#7d7a73", "#a29d92", "#5f6168", "#c4bdb0", "#8e8577", "#6f6a62"];

interface Item {
  pos: [number, number, number];
  scale: [number, number, number];
  color: string;
}

/** One instanced mesh per fixture keeps greybox draw calls low. */
function Instances({ items }: { items: Item[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const mat = new THREE.Matrix4();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      mat.compose(
        new THREE.Vector3(...it.pos),
        new THREE.Quaternion(),
        new THREE.Vector3(...it.scale),
      );
      m.setMatrixAt(i, mat);
      m.setColorAt(i, c.set(it.color));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.85} />
    </instancedMesh>
  );
}

/** Face-out garment rail against the back wall, plus a mannequin. */
function Rack({ s, colors }: { s: PlacedSection; colors?: string[] }) {
  const railX = s.side * (HALF_W - 0.55);
  const len = s.width - 0.8;
  const items = useMemo(() => {
    const n = Math.floor(len / 0.48);
    const out: Item[] = [];
    for (let i = 0; i < n; i++) {
      const z = s.z0 - 0.4 - 0.24 - i * 0.48;
      const col = colors ? colors[i % colors.length] : GARMENT_TONES[i % GARMENT_TONES.length];
      out.push({ pos: [railX + s.side * -0.06, 1.28, z], scale: [0.06, 0.95, 0.42], color: col });
    }
    return out;
  }, [s, colors, len, railX]);
  return (
    <group>
      <mesh position={[railX, 1.8, s.cz]}>
        <boxGeometry args={[0.03, 0.03, len]} />
        <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.35} />
      </mesh>
      <Instances items={items} />
      {/* greybox mannequin */}
      <group position={[s.side * (HALF_W - MALL.bayDepth + 0.8), 0, s.z1 + 0.75]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.22, 0.25, 0.06, 24]} />
          <meshStandardMaterial color="#8f8b84" />
        </mesh>
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
          <meshStandardMaterial color={METAL} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <capsuleGeometry args={[0.17, 0.55, 6, 16]} />
          <meshStandardMaterial color={colors ? colors[0] : "#d8d4cc"} roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.1, 20, 16]} />
          <meshStandardMaterial color="#e2ded7" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

/** Wall shelving with folded stacks. */
function Shelves({ s }: { s: PlacedSection }) {
  const x = s.side * (HALF_W - 0.35);
  const len = s.width - 0.6;
  const levels = [0.45, 0.95, 1.45, 1.95];
  const items = useMemo(() => {
    const out: Item[] = [];
    levels.forEach((y, li) => {
      const n = Math.floor(len / 0.5);
      for (let i = 0; i < n; i++) {
        out.push({
          pos: [x, y + 0.11, s.z0 - 0.55 - i * 0.5],
          scale: [0.3, 0.2, 0.32],
          color: GARMENT_TONES[(i + li) % GARMENT_TONES.length],
        });
      }
    });
    return out;
  }, [s, x, len]);
  return (
    <group>
      {levels.map((y) => (
        <mesh key={y} position={[x, y, s.cz]}>
          <boxGeometry args={[0.45, 0.04, len]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      ))}
      <Instances items={items} />
    </group>
  );
}

/** Centre table with folded stacks. */
function Table({ s }: { s: PlacedSection }) {
  const x = s.side * (HALF_W - MALL.bayDepth / 2 - 0.1);
  const items = useMemo(() => {
    const out: Item[] = [];
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 2; k++)
        out.push({
          pos: [x + (k - 0.5) * 0.5, 0.86, s.cz - 0.9 + i * 0.6],
          scale: [0.38, 0.12, 0.32],
          color: GARMENT_TONES[(i * 2 + k) % GARMENT_TONES.length],
        });
    return out;
  }, [s, x]);
  return (
    <group>
      <mesh position={[x, 0.4, s.cz]}>
        <boxGeometry args={[1.2, 0.8, 2.6]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <Instances items={items} />
    </group>
  );
}

/** Glass display cabinets for small items. */
function Cabinet({ s }: { s: PlacedSection }) {
  const x = s.side * (HALF_W - MALL.bayDepth / 2);
  const count = Math.max(1, Math.round(s.width / 2));
  const cases = Array.from({ length: count }, (_, i) => s.z0 - (s.width / count) * (i + 0.5));
  return (
    <group>
      {cases.map((z) => (
        <group key={z} position={[x, 0, z]}>
          <mesh position={[0, 0.45, 0]}>
            <boxGeometry args={[0.9, 0.9, 1.4]} />
            <meshStandardMaterial color="#cfc9bf" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.15, 0]}>
            <boxGeometry args={[0.88, 0.5, 1.38]} />
            <meshStandardMaterial color="#dfe8ea" transparent opacity={0.28} roughness={0.05} />
          </mesh>
          {[-0.4, 0, 0.4].map((dz) => (
            <mesh key={dz} position={[0, 0.98, dz]}>
              <boxGeometry args={[0.18, 0.16, 0.18]} />
              <meshStandardMaterial color="#8a8378" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Fixture({ s, colors }: { s: PlacedSection; colors?: string[] }) {
  switch (s.fixture) {
    case "rack":
      return <Rack s={s} colors={colors} />;
    case "shelves":
      return <Shelves s={s} />;
    case "table":
      return <Table s={s} />;
    case "cabinet":
      return <Cabinet s={s} />;
  }
}
