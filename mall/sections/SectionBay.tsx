"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MALL, STORE_BACK_OFFSET, STORE_FRONT_OFFSET } from "@/lib/config/mall";
import { SECTIONS, type PlacedSection } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { openState } from "@/mall/transitions/openState";
import { pathFrameAt } from "@/mall/navigation/path";
import { makeLabelTexture } from "@/mall/scene/labelTexture";
import { SectionVideoPanel } from "./SectionVideoPanel";
import { getStoreWallpaper } from "@/mall/scene/materialTextures";

const TONES = { women: "#dfd0bf", men: "#aaa59c" } as const;
const BRASS = "#b99a6a";
const IDLE = new THREE.Color("#b7a38a");
const ACTIVE = new THREE.Color("#e4bb76");

function SectionBayImpl({ s }: { s: PlacedSection }) {
  const hovered = useMallStore((state) => state.hoveredId === s.id);
  const tutorialComplete = useMallStore((state) => state.tutorialComplete);
  const frame = useMemo(() => pathFrameAt(s.sCenter), [s.sCenter]);
  const returnWidth = s.width >= 7 ? 1.2 : 0.6;
  const portalWidth = s.width >= 7 ? 5.6 : 2.8;
  const fasciaWidth = portalWidth + returnWidth * 2;
  const depth = STORE_BACK_OFFSET - STORE_FRONT_OFFSET;
  const centreX = s.side * ((STORE_FRONT_OFFSET + STORE_BACK_OFFSET) / 2);
  const wallpaper = useMemo(() => getStoreWallpaper(s.gender, `${s.id}-portal`), [s.gender, s.id]);
  const sign = useMemo(() => makeLabelTexture([
    { text: s.label.toUpperCase(), size: 46, weight: 700, letterSpacing: 5, color: "#24211d" },
    { text: s.gender === "women" ? "WOMEN  ·  SHOPNET" : "MEN  ·  SHOPNET", size: 16, weight: 600, letterSpacing: 4, color: "#8c673d" },
  ], { width: 768, height: 128, bg: "#f5f0e7" }), [s.id, s.label, s.gender]);
  const accent = useRef<THREE.MeshStandardMaterial>(null);
  const floorGlow = useRef<THREE.MeshBasicMaterial>(null);
  const revealScrim = useRef<THREE.Mesh>(null);
  const reveal = useRef(0);
  const glow = useRef(0);

  useEffect(() => () => sign.dispose(), [sign]);

  useFrame((_, dt) => {
    const active = hovered || openState.id === s.id;
    glow.current += (Number(active) - glow.current) * (1 - Math.exp(-dt * 8));
    if (accent.current) {
      accent.current.emissive.copy(IDLE).lerp(ACTIVE, glow.current);
      accent.current.emissiveIntensity = 0.16 + glow.current * 1.45;
    }
    if (floorGlow.current) floorGlow.current.opacity = glow.current * 0.32;

    if (s.id === "women-blazers" && revealScrim.current) {
      const goal = tutorialComplete ? 1 : 0;
      reveal.current += (goal - reveal.current) * (1 - Math.exp(-dt / 1.6));
      revealScrim.current.position.y = 1.78 + reveal.current * 1.95;
      revealScrim.current.visible = reveal.current < 0.995;
    }
  });

  const portalRotation = -s.side * Math.PI / 2;
  const localZ = fasciaWidth / 2;
  return (
    <group position={[frame.x, 0, frame.z]} rotation-y={frame.yaw}>
      {/* Thin full-depth 0.6 m (or 1.2 m) side returns create the specified open portal. */}
      {[-1, 1].map((edge) => (
        <group key={edge}>
          <mesh position={[centreX, MALL.ceiling / 2, edge * localZ]}>
            <boxGeometry args={[depth, MALL.ceiling, returnWidth]} />
            <meshStandardMaterial map={wallpaper ?? undefined} color={TONES[s.gender]} roughness={0.66} />
          </mesh>
          <mesh position={[s.side * (STORE_BACK_OFFSET - 0.03), MALL.ceiling / 2, edge * localZ]}>
            <boxGeometry args={[0.06, MALL.ceiling, returnWidth]} />
            <meshStandardMaterial color={BRASS} metalness={0.64} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Open portal header; no thick wall spans the entrance. */}
      <mesh position={[s.side * (STORE_FRONT_OFFSET + 0.04), 3.72, 0]}>
        <boxGeometry args={[0.16, 0.42, portalWidth]} />
        <meshStandardMaterial color={TONES[s.gender]} roughness={0.5} metalness={0.12} />
      </mesh>
      <mesh position={[s.side * (STORE_FRONT_OFFSET - 0.055), 3.72, 0]} rotation-y={portalRotation}>
        <planeGeometry args={[portalWidth - 0.16, 0.32]} />
        <meshStandardMaterial map={sign} emissive="#9a6e35" emissiveMap={sign} emissiveIntensity={0.2} metalness={0.2} roughness={0.34} side={THREE.DoubleSide} />
      </mesh>

      {/* Threshold light is flush with the aisle floor and only activates for this store. */}
      <mesh position={[s.side * 1.98, 0.016, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[0.22, portalWidth - 0.15]} />
        <meshBasicMaterial ref={floorGlow} color="#f2c67b" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh position={[s.side * 2.02, 3.22, 0]}>
        <boxGeometry args={[0.035, 0.035, portalWidth - 0.15]} />
        <meshStandardMaterial ref={accent} color="#c9c2b5" emissive={IDLE} emissiveIntensity={0.16} />
      </mesh>

      <SectionVideoPanel section={s} />

      {/* W1 scrim hangs inside its 2.8 m portal; it retracts upward and never crosses the walkway. */}
      {s.id === "women-blazers" && (
        <mesh ref={revealScrim} position={[s.side * 2.16, 1.78, 0]} rotation-y={portalRotation}>
          <planeGeometry args={[2.8, 3.25]} />
          <meshStandardMaterial color="#bda58c" transparent opacity={0.56} roughness={0.65} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
export const SectionBay = memo(SectionBayImpl);

/** Full-height thin divider fins bridge every interval between neighbouring store portals. */
export function SectionDividerFins() {
  const fins = useMemo(() => {
    const items: Array<{ s: number; side: -1 | 1; id: string }> = [];
    for (const side of [-1, 1] as const) {
      const row = SECTIONS.filter((section) => section.side === side).sort((a, b) => a.sCenter - b.sCenter);
      for (let i = 0; i < row.length - 1; i++) {
        items.push({ s: (row[i].s1 + row[i + 1].s0) / 2, side, id: `${row[i].id}-${row[i + 1].id}` });
      }
    }
    return items;
  }, []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#655646", roughness: 0.66 }), []);
  return (
    <group>
      {fins.map((fin) => {
        const frame = pathFrameAt(fin.s);
        return (
          <group key={fin.id} position={[frame.x, 0, frame.z]} rotation-y={frame.yaw}>
            <mesh position={[fin.side * ((STORE_FRONT_OFFSET + STORE_BACK_OFFSET) / 2), MALL.ceiling / 2, 0]}>
              <boxGeometry args={[STORE_BACK_OFFSET - STORE_FRONT_OFFSET, MALL.ceiling, 0.16]} />
              <meshStandardMaterial color="#695845" roughness={0.68} />
            </mesh>
            <mesh position={[fin.side * (STORE_FRONT_OFFSET + 0.025), MALL.ceiling / 2, 0]}>
              <boxGeometry args={[0.05, MALL.ceiling, 0.2]} />
              <meshStandardMaterial color={BRASS} metalness={0.68} roughness={0.28} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
