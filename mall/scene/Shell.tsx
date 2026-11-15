"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BAY_FRONT_X, HALF_W, MALL } from "@/lib/config/mall";
import { makeLabelTexture } from "./labelTexture";

const FLOOR = "#d9d6d0";
const CORRIDOR = "#cfcbc3";
const WALL = "#e7e4de";
const CEIL = "#f1efeb";

/** Greybox architecture: floor, ceiling, outer walls, end wall, entrance frame and zone signs. */
export function Shell() {
  const len = MALL.length + MALL.entranceZ + 4;
  const zMid = (MALL.entranceZ + 4 - MALL.length) / 2;

  const signs = useMemo(() => {
    const w = makeLabelTexture([{ text: "WOMEN", size: 64, weight: 700, letterSpacing: 18 }], {
      width: 512,
      height: 128,
      bg: "#f7f5f1",
    });
    const m = makeLabelTexture([{ text: "MEN", size: 64, weight: 700, letterSpacing: 18 }], {
      width: 512,
      height: 128,
      bg: "#f7f5f1",
    });
    const brand = makeLabelTexture(
      [
        { text: "SHOPNET", size: 80, weight: 800, letterSpacing: 20, color: "#1d1b18" },
        { text: "FASHION MALL", size: 26, weight: 500, letterSpacing: 12, color: "#6b665d" },
      ],
      { width: 1024, height: 256, bg: "#f7f5f1" },
    );
    return { w, m, brand };
  }, []);

  useEffect(
    () => () => {
      signs.w.dispose();
      signs.m.dispose();
      signs.brand.dispose();
    },
    [signs],
  );

  const lightStrips = useMemo(() => {
    const out: number[] = [];
    for (let z = MALL.entranceZ; z > -MALL.length; z -= 4) out.push(z - 2);
    return out;
  }, []);

  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, zMid]}>
        <planeGeometry args={[MALL.width, len]} />
        <meshStandardMaterial color={FLOOR} roughness={0.85} />
      </mesh>
      {/* corridor inlay */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, zMid]}>
        <planeGeometry args={[BAY_FRONT_X * 2 - 0.4, len]} />
        <meshStandardMaterial color={CORRIDOR} roughness={0.6} />
      </mesh>
      {/* ceiling */}
      <mesh rotation-x={Math.PI / 2} position={[0, MALL.ceiling, zMid]}>
        <planeGeometry args={[MALL.width, len]} />
        <meshStandardMaterial color={CEIL} roughness={1} />
      </mesh>
      {/* ceiling light strips over the corridor */}
      {lightStrips.map((z) => (
        <mesh key={z} position={[0, MALL.ceiling - 0.02, z]}>
          <boxGeometry args={[1.6, 0.03, 0.25]} />
          <meshStandardMaterial color="#ffffff" emissive="#fff6e6" emissiveIntensity={1.4} />
        </mesh>
      ))}
      {/* outer walls behind the bays */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * HALF_W, MALL.ceiling / 2, zMid]}>
          <boxGeometry args={[0.2, MALL.ceiling, len]} />
          <meshStandardMaterial color={WALL} roughness={0.95} />
        </mesh>
      ))}
      {/* far end wall */}
      <mesh position={[0, MALL.ceiling / 2, -MALL.length - 0.1]}>
        <boxGeometry args={[MALL.width, MALL.ceiling, 0.2]} />
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      {/* brand panel on the far wall */}
      <mesh position={[0, 2.4, -MALL.length + 0.01]}>
        <planeGeometry args={[4, 1]} />
        <meshStandardMaterial map={signs.brand} roughness={0.8} />
      </mesh>
      {/* entrance frame */}
      <group position={[0, 0, MALL.entranceZ + 0.6]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * (BAY_FRONT_X + 0.25), MALL.ceiling / 2, 0]}>
            <boxGeometry args={[0.5, MALL.ceiling, 0.5]} />
            <meshStandardMaterial color="#c9c4ba" roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, MALL.ceiling - 0.3, 0]}>
          <boxGeometry args={[BAY_FRONT_X * 2 + 1, 0.6, 0.5]} />
          <meshStandardMaterial color="#c9c4ba" roughness={0.7} />
        </mesh>
      </group>
      {/* gender signs hanging near the entrance */}
      <mesh position={[-BAY_FRONT_X + 0.9, 3.35, MALL.entranceZ - 0.5]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial map={signs.w} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[BAY_FRONT_X - 0.9, 3.35, MALL.entranceZ - 0.5]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial map={signs.m} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
