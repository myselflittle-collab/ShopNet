"use client";

import { MALL } from "@/lib/config/mall";

/**
 * Mall illumination: warm retail ambience, cool corridor fill and a small number
 * of practical lights placed by zone. Keep runtime light count modest; future
 * Blender lightmaps should replace these lights for final photoreal rendering.
 */
export function Lighting() {
  const zones = [ -5, -18, -31, -44 ];
  return (
    <>
      <hemisphereLight args={["#fff5e7", "#6e6255", 0.72]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[3, 9, 5]}
        color="#fff1d8"
        intensity={1.05}
        castShadow={false}
      />
      <directionalLight
        position={[-5, 5, -24]}
        color="#e6efff"
        intensity={0.28}
        castShadow={false}
      />
      {zones.flatMap((z) => ([-3.1, 3.1] as const).map((x) => (
        <pointLight
          key={`retail-${x}-${z}`}
          position={[x, MALL.ceiling - 0.45, z]}
          color="#ffdfad"
          intensity={0.82}
          distance={9}
          decay={2}
        />
      )))}
      <fog attach="fog" args={["#dcd5ca", 27, MALL.length + 12]} />
      <color attach="background" args={["#dcd5ca"]} />
    </>
  );
}
