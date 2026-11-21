"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HALF_W, MALL } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { openState } from "@/mall/transitions/openState";
import { makeLabelTexture } from "@/mall/scene/labelTexture";
import { BAY_INNER } from "./geometry";
import { SectionVideoPanel } from "./SectionVideoPanel";
import { getPolishedStoneTexture, getStoreWallpaper } from "@/mall/scene/materialTextures";

const WALL_TONE = { women: "#e4dbd6", men: "#d8dbdf" } as const;
const PIER_TONE = { women: "#bda88f", men: "#77736b" } as const;
const ACCENT_IDLE = new THREE.Color("#c9c2b5");
const ACCENT_HOT = new THREE.Color("#e3b66b");

function SectionBayImpl({ s }: { s: PlacedSection }) {
  const hovered = useMallStore((st) => st.hoveredId === s.id);
  const frontX = BAY_INNER.frontX(s);
  const centreX = BAY_INNER.centreX(s);
  const rearX = s.side * (HALF_W - 0.13);
  const d = MALL.bayDepth;
  const wallpaper = useMemo(() => getStoreWallpaper(s.gender, s.id), [s.gender, s.id]);
  const stone = useMemo(() => getPolishedStoneTexture(), []);

  const sign = useMemo(
    () =>
      makeLabelTexture(
        [
          { text: s.label.toUpperCase(), size: 44, weight: 700, letterSpacing: 6, color: "#24211d" },
          {
            text: s.gender === "women" ? "WOMEN  ·  SHOPNET" : "MEN  ·  SHOPNET",
            size: 18,
            weight: 500,
            letterSpacing: 5,
            color: "#9a6a1f",
          },
        ],
        { width: 768, height: 128, bg: "#f6f3ee" },
      ),
    [s],
  );
  useEffect(() => () => sign.dispose(), [sign]);

  const accentMat = useRef<THREE.MeshStandardMaterial>(null);
  const floorGlow = useRef<THREE.MeshBasicMaterial>(null);
  const display = useRef<THREE.Group>(null);
  const glow = useRef(0);

  useFrame((_, dt) => {
    const opening = openState.id === s.id;
    const target = hovered || opening ? 1 : 0;
    glow.current += (target - glow.current) * Math.min(1, dt * 8);
    const g = glow.current;

    if (accentMat.current) {
      accentMat.current.emissive.copy(ACCENT_IDLE).lerp(ACCENT_HOT, g);
      accentMat.current.emissiveIntensity = 0.22 + g * 1.7;
    }
    if (floorGlow.current) floorGlow.current.opacity = g * 0.38;

    if (s.live && opening) {
      openState.value += (openState.target - openState.value) * (1 - Math.exp(-dt * 3.2));
      if (Math.abs(openState.target - openState.value) < 0.001) {
        openState.value = openState.target;
      }
    }

    const v = opening ? openState.value : 0;
    const eased = v * v * (3 - 2 * v);
    if (display.current) {
      display.current.position.x = -s.side * eased * 0.52;
      display.current.position.y = eased * 0.035;
      display.current.scale.set(1 + eased * 0.025, 1 + eased * 0.025, 1);
    }
  });

  const signRotY = -s.side * (Math.PI / 2);
  const pierXs = [frontX + s.side * 0.12, rearX];

  return (
    <group>
      {/* Open boutique frontage: tall decorative piers replace the old full-height cubicle partitions. */}
      {[s.z0, s.z1].map((z) =>
        pierXs.map((x, index) => (
          <group key={`${z}-${index}`} position={[x, 0, z]}>
            <mesh position={[0, 1.62, 0]}>
              <boxGeometry args={[0.2, 3.24, 0.22]} />
              <meshStandardMaterial color={PIER_TONE[s.gender]} roughness={0.48} metalness={0.08} />
            </mesh>
            <mesh position={[0, 1.62, -s.side * 0.116]}>
              <boxGeometry args={[0.215, 3.28, 0.018]} />
              <meshStandardMaterial color="#b99a6a" metalness={0.72} roughness={0.28} />
            </mesh>
            <mesh position={[0, 3.28, 0]}>
              <boxGeometry args={[0.27, 0.055, 0.29]} />
              <meshStandardMaterial color="#d8c6a6" metalness={0.5} roughness={0.35} emissive="#9c7440" emissiveIntensity={0.08} />
            </mesh>
          </group>
        )),
      )}

      {/* Deep feature wall: store-specific mineral / fluted finish, no repeated arch motif. */}
      <mesh position={[rearX, 1.98, s.cz]}>
        <boxGeometry args={[0.12, 3.96, s.width - 0.12]} />
        <meshStandardMaterial map={wallpaper ?? undefined} color={WALL_TONE[s.gender]} roughness={0.78} />
      </mesh>

      {/* Stone floor is flush with the mall floor: no raised display plinth or table. */}
      <mesh position={[centreX, 0.009, s.cz]}>
        <boxGeometry args={[d - 0.06, 0.018, s.width - 0.08]} />
        <meshStandardMaterial map={stone ?? undefined} color="#ddd5c9" roughness={0.3} metalness={0.04} />
      </mesh>

      {/* Brass boundary inlay defines the store without closing it with a wall or door. */}
      {[s.z0, s.z1].map((z) => (
        <mesh key={z} position={[centreX, 0.022, z]}>
          <boxGeometry args={[d - 0.16, 0.018, 0.035]} />
          <meshStandardMaterial color="#b99a6a" metalness={0.76} roughness={0.24} />
        </mesh>
      ))}

      {/* Full-width overhead fascia: the sign floats above an open storefront. */}
      <mesh position={[frontX, 3.62, s.cz]}>
        <boxGeometry args={[0.24, 0.62, s.width + 0.12]} />
        <meshStandardMaterial color={WALL_TONE[s.gender]} roughness={0.58} />
      </mesh>
      <mesh position={[frontX - s.side * 0.132, 3.62, s.cz]} rotation-y={signRotY}>
        <planeGeometry args={[Math.min(3.45, s.width - 0.25), 0.46]} />
        <meshStandardMaterial map={sign} roughness={0.82} />
      </mesh>

      {/* Warm linear light washes the feature wall rather than leaving a flat box. */}
      <mesh position={[rearX - s.side * 0.085, 3.78, s.cz]}>
        <boxGeometry args={[0.035, 0.055, s.width - 0.55]} />
        <meshStandardMaterial color="#fff1d8" emissive="#ffcf87" emissiveIntensity={1.25} />
      </mesh>
      <mesh position={[rearX - s.side * 0.085, 0.24, s.cz]}>
        <boxGeometry args={[0.025, 0.025, s.width - 0.55]} />
        <meshStandardMaterial color="#c4a574" metalness={0.68} roughness={0.28} />
      </mesh>

      {/* Subtle animated trim and floor wash for intentional category targeting. */}
      <mesh position={[frontX - s.side * 0.17, 3.22, s.cz]}>
        <boxGeometry args={[0.04, 0.035, s.width - 0.28]} />
        <meshStandardMaterial ref={accentMat} color="#d8d1c4" emissive={ACCENT_IDLE} emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[frontX + s.side * 0.5, 0.016, s.cz]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.82, s.width - 0.35]} />
        <meshBasicMaterial ref={floorGlow} color="#e8bd79" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Large editorial lightbox / campaign wall is pulled forward by the existing section transition. */}
      <group position={[0, 0, s.cz]}>
        <group ref={display}>
          <group position={[0, 0, -s.cz]}>
            <SectionVideoPanel section={s} />
          </group>
        </group>
      </group>
    </group>
  );
}

export const SectionBay = memo(SectionBayImpl);
