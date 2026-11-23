"use client";

import { useMemo } from "react";
import { pathOffsetAt } from "@/mall/navigation/path";

const LIGHT_STOPS = [15, 31, 47, 78, 96, 113];

export function Lighting() {
  const positions = useMemo(() => LIGHT_STOPS.map((s) => {
    const p = pathOffsetAt(s, 0);
    return [p.x, 3.7, p.z] as [number, number, number];
  }), []);
  return (
    <>
      <hemisphereLight args={["#fff3e3", "#554538", 0.7]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[7, 10, 6]} color="#fff0d8" intensity={0.82} castShadow={false} />
      <directionalLight position={[-6, 7, -18]} color="#d9e4f4" intensity={0.22} castShadow={false} />
      {positions.map((position, i) => (
        <pointLight key={i} position={position} color="#ffddb1" intensity={0.78} distance={8.5} decay={2} />
      ))}
      <fog attach="fog" args={["#c9c0b3", 32, 95]} />
      <color attach="background" args={["#c9c0b3"]} />
    </>
  );
}
