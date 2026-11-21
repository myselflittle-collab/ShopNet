"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BAY_FRONT_X, HALF_W, MALL } from "@/lib/config/mall";
import { makeLabelTexture } from "./labelTexture";
import { getPolishedStoneTexture, getStoreWallpaper } from "./materialTextures";
import { StarryCeiling } from "./StarryCeiling";
import { MallWallContent } from "./MallWallContent";

const FLOOR = "#d7d0c5";
const CORRIDOR = "#c7beb0";
const WALL = "#e7e4de";
const CEIL = "#f1efeb";

/** Greybox architecture: floor, ceiling, outer walls, end wall, entrance frame and zone signs. */
export function Shell() {
  const len = MALL.length + MALL.entranceZ + 4;
  const zMid = (MALL.entranceZ + 4 - MALL.length) / 2;
  const stone = useMemo(() => getPolishedStoneTexture(), []);
  const wallFinish = useMemo(() => getStoreWallpaper("women", "mall-limestone"), []);

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

  return (
    <group>
      {/* floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, zMid]}>
        <planeGeometry args={[MALL.width, len]} />
        <meshStandardMaterial map={stone ?? undefined} color={FLOOR} roughness={0.28} metalness={0.08} />
      </mesh>
      {/* corridor inlay */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, zMid]}>
        <planeGeometry args={[BAY_FRONT_X * 2 - 0.4, len]} />
        <meshStandardMaterial map={stone ?? undefined} color={CORRIDOR} roughness={0.22} metalness={0.12} />
      </mesh>
      {/* live star ceiling replaces the blank roof and harsh fluorescent bars */}
      <StarryCeiling width={MALL.width} length={len} zMid={zMid} height={MALL.ceiling - 0.012} />
      {/* warm gold perimeter coves frame the sky */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * (HALF_W - 0.12), MALL.ceiling - 0.025, zMid]}>
          <boxGeometry args={[0.055, 0.04, len - 0.5]} />
          <meshStandardMaterial color="#f4d9a6" emissive="#d6a969" emissiveIntensity={0.75} metalness={0.55} roughness={0.3} />
        </mesh>
      ))}
      {/* warm recessed cove lighting above both retail walls */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * (BAY_FRONT_X + 0.65), MALL.ceiling - 0.035, zMid]}>
            <boxGeometry args={[0.12, 0.035, len - 0.8]} />
            <meshStandardMaterial color="#fff0d4" emissive="#f5c98b" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[side * (BAY_FRONT_X + 0.1), MALL.ceiling - 0.035, zMid]}>
            <boxGeometry args={[0.08, 0.035, len - 0.8]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff7e8" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
      {/* small brass inlay lines make the central walkway read as polished retail stone */}
      {([-1, 1] as const).map((side) => (
        <mesh key={side} position={[side * (BAY_FRONT_X - 0.22), 0.006, zMid]}>
          <boxGeometry args={[0.025, 0.008, len - 0.5]} />
          <meshStandardMaterial color="#b99a6a" metalness={0.68} roughness={0.28} />
        </mesh>
      ))}
      {/* outer walls behind the bays */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * HALF_W, MALL.ceiling / 2, zMid]}>
          <boxGeometry args={[0.2, MALL.ceiling, len]} />
          <meshStandardMaterial map={wallFinish ?? undefined} color={WALL} roughness={0.82} />
        </mesh>
      ))}
      {/* campaign, offer and mall-information boards cover the long corridor walls */}
      <MallWallContent />
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
