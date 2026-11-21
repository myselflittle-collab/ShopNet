"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MALL, pathCenterX, pathYawAt } from "@/lib/config/mall";
import { QUALITY_LIMITS, type MallQuality } from "@/mall/performance/quality";

const PALETTE = ["#38dfff", "#bb65ff", "#ff5cbd", "#e9bb66", "#55e8bf", "#648bff"];

interface Chunk {
  x: number;
  z: number;
  width: number;
  length: number;
  color: string;
}

function createChunks(count: number): Chunk[] {
  let seed = 91273;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const start = MALL.entranceZ + 2.5;
  const end = -MALL.length - 2.5;
  return Array.from({ length: count }, () => {
    const z = start + (end - start) * random();
    const side = random() > 0.5 ? 1 : -1;
    const offset = 0.38 + random() * 1.1;
    return {
      x: pathCenterX(z) + side * offset,
      z,
      width: 0.022 + random() * 0.035,
      length: 0.18 + random() * 0.62,
      color: PALETTE[Math.floor(random() * PALETTE.length)],
    };
  });
}

/** One instanced draw call replaces dozens of meshes, materials and animation callbacks. */
export function AmbientPathLights({ quality }: { quality: MallQuality }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const chunks = useMemo(() => createChunks(QUALITY_LIMITS[quality].pathLights), [quality]);

  useEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const dummy = new THREE.Object3D();

    chunks.forEach((chunk, index) => {
      dummy.position.set(chunk.x, 0.016, chunk.z);
      dummy.rotation.set(0, pathYawAt(chunk.z), 0);
      dummy.scale.set(chunk.width, 0.012, chunk.length);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
      instanced.setColorAt(index, new THREE.Color(chunk.color));
    });

    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  }, [chunks]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, chunks.length]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
