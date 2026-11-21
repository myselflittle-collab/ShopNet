"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MALL, pathCenterX, pathYawAt } from "@/lib/config/mall";

const PALETTE = ["#38dfff", "#bb65ff", "#ff5cbd", "#e9bb66", "#55e8bf", "#648bff"];

interface Chunk {
  id: number;
  x: number;
  z: number;
  width: number;
  length: number;
  color: string;
  phase: number;
}

function createChunks(): Chunk[] {
  let seed = 91273;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const start = MALL.entranceZ + 2.5;
  const end = -MALL.length - 2.5;
  return Array.from({ length: 54 }, (_, id) => {
    const t = random();
    const z = start + (end - start) * t;
    const side = random() > 0.5 ? 1 : -1;
    const offset = 0.34 + random() * 1.14;
    return {
      id,
      x: pathCenterX(z) + side * offset,
      z,
      width: 0.022 + random() * 0.035,
      length: 0.18 + random() * 0.62,
      color: PALETTE[Math.floor(random() * PALETTE.length)],
      phase: random() * Math.PI * 2,
    };
  });
}

function LightChunk({ chunk }: { chunk: Chunk }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!material.current) return;
    material.current.emissiveIntensity = 0.65 + (0.28 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.1 + chunk.phase)));
  });
  return (
    <group position={[chunk.x, 0.016, chunk.z]} rotation-y={pathYawAt(chunk.z)}>
      <mesh>
        <boxGeometry args={[chunk.width, 0.012, chunk.length]} />
        <meshStandardMaterial
          ref={material}
          color={chunk.color}
          emissive={chunk.color}
          emissiveIntensity={0.75}
          metalness={0.18}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[0, -0.001, 0]}>
        <boxGeometry args={[chunk.width * 2.6, 0.004, chunk.length * 1.6]} />
        <meshBasicMaterial color={chunk.color} transparent opacity={0.11} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Short, asymmetrical multicolour in-floor lights. No continuous parallel LED lines. */
export function AmbientPathLights() {
  const chunks = useMemo(createChunks, []);
  return (
    <group>
      {chunks.map((chunk) => <LightChunk key={chunk.id} chunk={chunk} />)}
    </group>
  );
}
