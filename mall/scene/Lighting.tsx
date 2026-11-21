"use client";

import { MALL, pathCenterX } from "@/lib/config/mall";
import type { MallQuality } from "@/mall/performance/quality";

/** Warm boutique pools with cool cyan/blue fill that complements the galaxy canopy. */
export function Lighting({ quality }: { quality: MallQuality }) {
  const zones = quality === "high" ? [-8, -24, -40] : quality === "balanced" ? [-14, -38] : [];
  return (
    <>
      <hemisphereLight args={["#d9eaff", "#27313d", 0.58]} />
      <ambientLight intensity={quality === "low" ? 0.42 : 0.3} />
      <directionalLight
        position={[3, 9, 5]}
        color="#d7e8ff"
        intensity={quality === "low" ? 0.65 : 0.82}
        castShadow={false}
      />
      <directionalLight
        position={[-5, 5, -24]}
        color="#68bfff"
        intensity={quality === "low" ? 0.18 : 0.32}
        castShadow={false}
      />
      {zones.flatMap((z) => ([-3.0, 3.0] as const).map((offset) => {
        const x = pathCenterX(z) + offset;
        return (
          <pointLight
            key={`retail-${offset}-${z}`}
            position={[x, MALL.ceiling - 0.4, z]}
            color={offset < 0 ? "#ffe0bd" : "#a2dcff"}
            intensity={quality === "high" ? 0.72 : 0.55}
            distance={8.5}
            decay={2}
          />
        );
      }))}
      <fog attach="fog" args={["#172434", 34, MALL.length + 18]} />
      <color attach="background" args={["#101d31"]} />
    </>
  );
}
