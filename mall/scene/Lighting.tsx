"use client";

import { MALL } from "@/lib/config/mall";

/** Greybox lighting. Final lighting will be baked in Blender (see visual quality pipeline). */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={["#fffaf2", "#bfb8ab", 1.15]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 8, 4]} intensity={0.9} />
      <directionalLight position={[-4, 6, -20]} intensity={0.35} />
      <fog attach="fog" args={["#e9e6e0", 18, MALL.length + 10]} />
      <color attach="background" args={["#e9e6e0"]} />
    </>
  );
}
