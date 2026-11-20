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
import { SectionPhotoPanel } from "./SectionPhotoPanel";
import { getPolishedStoneTexture, getStoreWallpaper } from "@/mall/scene/materialTextures";

const WALL_TONE = { women: "#e4dbd6", men: "#d8dbdf" } as const;
const ACCENT_IDLE = new THREE.Color("#c9c2b5");
const ACCENT_HOT = new THREE.Color("#e3b66b");

function SectionBayImpl({ s }: { s: PlacedSection }) {
  const hovered = useMallStore((st) => st.hoveredId === s.id);
  const frontX = BAY_INNER.frontX(s);
  const centreX = BAY_INNER.centreX(s);
  const d = MALL.bayDepth;
  const wallpaper = useMemo(() => getStoreWallpaper(s.gender), [s.gender]);
  const stone = useMemo(() => getPolishedStoneTexture(), []);

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

  const accentMat = useRef<THREE.MeshStandardMaterial>(null);
  const floorGlow = useRef<THREE.MeshBasicMaterial>(null);
  const display = useRef<THREE.Group>(null);
  const doorL = useRef<THREE.Group>(null);
  const doorR = useRef<THREE.Group>(null);
  const glow = useRef(0);
  useFrame((_, dt) => {
    const opening = openState.id === s.id;
    const target = hovered || opening ? 1 : 0;
    glow.current += (target - glow.current) * Math.min(1, dt * 8);
    const g = glow.current;
    if (accentMat.current) {
      accentMat.current.emissive.copy(ACCENT_IDLE).lerp(ACCENT_HOT, g);
      accentMat.current.emissiveIntensity = 0.25 + g * 2.2;
    }
    if (floorGlow.current) floorGlow.current.opacity = g * 0.55;

    // opening: doors swing open, then the rail glides toward the corridor and spreads out
    if (s.live) {
      const tgt = opening ? openState.target : 0;
      if (opening) {
        openState.value += (tgt - openState.value) * (1 - Math.exp(-dt * 3.2));
        if (Math.abs(tgt - openState.value) < 0.001) openState.value = tgt;
      }
      const v = opening ? openState.value : 0;
      const doors = Math.min(1, v * 1.8);
      const glide = Math.max(0, (v - 0.25) / 0.75);
      const eased = glide * glide * (3 - 2 * glide);
      if (doorL.current) doorL.current.rotation.y = -s.side * doors * 1.45;
      if (doorR.current) doorR.current.rotation.y = s.side * doors * 1.45;
      if (display.current) {
        display.current.position.x = -s.side * eased * 1.25;
        display.current.position.y = eased * 0.06;
        display.current.scale.z = 1 + eased * 0.12;
      }
    }
  });

  const signRotY = -s.side * (Math.PI / 2);

  return (
    <group>
      {/* side partitions */}
      {[s.z0, s.z1].map((z) => (
        <mesh key={z} position={[centreX, 1.6, z]}>
          <boxGeometry args={[d, 3.2, 0.08]} />
          <meshStandardMaterial map={wallpaper ?? undefined} color={WALL_TONE[s.gender]} roughness={0.82} />
        </mesh>
      ))}
      {/* back wall panel */}
      <mesh position={[s.side * (HALF_W - 0.13), 1.6, s.cz]}>
        <boxGeometry args={[0.04, 3.2, s.width - 0.1]} />
        <meshStandardMaterial map={wallpaper ?? undefined} color={WALL_TONE[s.gender]} roughness={0.82} />
      </mesh>
      {/* raised floor */}
      <mesh position={[centreX, 0.03, s.cz]}>
        <boxGeometry args={[d - 0.1, 0.06, s.width - 0.1]} />
        <meshStandardMaterial map={stone ?? undefined} color="#ddd5c9" roughness={0.34} metalness={0.04} />
      </mesh>
      {/* fascia + sign */}
      <mesh position={[frontX, 3.55, s.cz]}>
        <boxGeometry args={[0.12, 0.9, s.width]} />
        <meshStandardMaterial map={wallpaper ?? undefined} color={WALL_TONE[s.gender]} roughness={0.82} />
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
      {/* targeting glow on the floor at the opening */}
      <mesh position={[frontX - s.side * 0.55, 0.012, s.cz]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.1, s.width - 0.3]} />
        <meshBasicMaterial ref={floorGlow} color="#f2c27a" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* the display: moved as one piece when the section opens (scaled around the bay centre) */}
      <group position={[0, 0, s.cz]}>
        <group ref={display}>
          <group position={[0, 0, -s.cz]}>
            <SectionPhotoPanel section={s} />
          </group>
        </group>
      </group>
      {s.live && (
        <>
          {/* glass boutique doors across the opening; they swing open when you enter */}
          <group ref={doorL} position={[frontX, 0, s.z0 - 0.08]}>
            <GlassDoor width={s.width / 2 - 0.08} dir={-1} />
          </group>
          <group ref={doorR} position={[frontX, 0, s.z1 + 0.08]}>
            <GlassDoor width={s.width / 2 - 0.08} dir={1} />
          </group>
        </>
      )}
    </group>
  );
}

/** One glass door leaf hinged at its outer edge; dir = which way it extends along z from the hinge. */
function GlassDoor({ width, dir }: { width: number; dir: 1 | -1 }) {
  const h = 2.9;
  const cz = (dir * width) / 2;
  return (
    <group>
      <mesh position={[0, h / 2 + 0.04, cz]}>
        <boxGeometry args={[0.025, h, width]} />
        <meshStandardMaterial color="#dfe9ec" transparent opacity={0.16} roughness={0.05} metalness={0.1} depthWrite={false} />
      </mesh>
      {[0.04, h + 0.04].map((y) => (
        <mesh key={y} position={[0, y, cz]}>
          <boxGeometry args={[0.025, 0.025, width]} />
          <meshStandardMaterial color="#cdb684" metalness={0.3} roughness={0.45} />
        </mesh>
      ))}
      {/* slim handle near the meeting edge (no full-height post, so the closed doors don't split the view) */}
      <mesh position={[0, 1.15, dir * (width - 0.1)]}>
        <boxGeometry args={[0.04, 0.42, 0.018]} />
        <meshStandardMaterial color="#cdb684" metalness={0.3} roughness={0.45} />
      </mesh>
    </group>
  );
}

export const SectionBay = memo(SectionBayImpl);
