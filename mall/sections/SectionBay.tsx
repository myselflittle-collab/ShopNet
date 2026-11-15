"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALF_W, MALL } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { catalog } from "@/lib/catalog/mockCatalog";
import { makeLabelTexture } from "@/mall/scene/labelTexture";
import { BAY_INNER } from "./geometry";
import { Fixture } from "./Fixtures";

const WALL_TONE = { women: "#e4dbd6", men: "#d8dbdf" } as const;
const ACCENT_IDLE = new THREE.Color("#c9c2b5");
const ACCENT_HOT = new THREE.Color("#e3b66b");

function SectionBayImpl({ s }: { s: PlacedSection }) {
  const hovered = useMallStore((st) => st.hoveredId === s.id);
  const frontX = BAY_INNER.frontX(s);
  const centreX = BAY_INNER.centreX(s);
  const d = MALL.bayDepth;

  const sign = useMemo(
    () =>
      makeLabelTexture(
        [
          { text: s.label.toUpperCase(), size: 44, weight: 700, letterSpacing: 6, color: "#24211d" },
          {
            text: s.live ? `${s.gender === "women" ? "WOMEN" : "MEN"} · OPEN` : s.gender === "women" ? "WOMEN" : "MEN",
            size: 18,
            weight: 500,
            letterSpacing: 6,
            color: s.live ? "#9a6a1f" : "#7a746a",
          },
        ],
        { width: 768, height: 128, bg: "#f6f3ee" },
      ),
    [s],
  );
  useEffect(() => () => sign.dispose(), [sign]);

  // Women's Blazers shows the real catalogue colours on its rail.
  const colors = useMemo(
    () => (s.live ? catalog.listBySection(s.id).slice(0, 12).map((p) => p.colours[0].hex) : undefined),
    [s],
  );

  const accentMat = useRef<THREE.MeshStandardMaterial>(null);
  const glow = useRef(0);
  useFrame((_, dt) => {
    const target = hovered ? 1 : 0;
    glow.current += (target - glow.current) * Math.min(1, dt * 8);
    const g = glow.current;
    if (accentMat.current) {
      accentMat.current.emissive.copy(ACCENT_IDLE).lerp(ACCENT_HOT, g);
      accentMat.current.emissiveIntensity = 0.25 + g * 1.6;
    }
  });

  const signRotY = -s.side * (Math.PI / 2);

  return (
    <group>
      {/* side partitions */}
      {[s.z0, s.z1].map((z) => (
        <mesh key={z} position={[centreX, 1.6, z]}>
          <boxGeometry args={[d, 3.2, 0.08]} />
          <meshStandardMaterial color="#d3cfc8" roughness={0.9} />
        </mesh>
      ))}
      {/* back wall panel */}
      <mesh position={[s.side * (HALF_W - 0.13), 1.6, s.cz]}>
        <boxGeometry args={[0.04, 3.2, s.width - 0.1]} />
        <meshStandardMaterial color={WALL_TONE[s.gender]} roughness={0.9} />
      </mesh>
      {/* raised floor */}
      <mesh position={[centreX, 0.03, s.cz]}>
        <boxGeometry args={[d - 0.1, 0.06, s.width - 0.1]} />
        <meshStandardMaterial color="#cdc6bb" roughness={0.7} />
      </mesh>
      {/* fascia + sign */}
      <mesh position={[frontX, 3.55, s.cz]}>
        <boxGeometry args={[0.12, 0.9, s.width]} />
        <meshStandardMaterial color="#ddd8cf" roughness={0.8} />
      </mesh>
      <mesh position={[frontX - s.side * 0.07, 3.5, s.cz]} rotation-y={signRotY}>
        <planeGeometry args={[Math.min(3.2, s.width - 0.4), 0.53]} />
        <meshStandardMaterial map={sign} roughness={0.85} />
      </mesh>
      {/* highlight strip along the opening */}
      <mesh position={[frontX - s.side * 0.02, 3.08, s.cz]}>
        <boxGeometry args={[0.05, 0.05, s.width - 0.2]} />
        <meshStandardMaterial ref={accentMat} color="#d8d1c4" emissive={ACCENT_IDLE} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[frontX - s.side * 0.02, 0.07, s.cz]}>
        <boxGeometry args={[0.05, 0.02, s.width - 0.2]} />
        <meshStandardMaterial color="#bdb5a8" />
      </mesh>
      <Fixture s={s} colors={colors} />
    </group>
  );
}

export const SectionBay = memo(SectionBayImpl);
