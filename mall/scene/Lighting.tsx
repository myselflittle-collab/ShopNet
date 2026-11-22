"use client";
import { useMemo } from "react";
import { MALL } from "@/lib/config/mall";
import { pathOffsetAt } from "@/mall/navigation/path";

/** Fixed light budget: positions follow the S-path; lights are never added or removed while walking. */
export function Lighting() {
  const lights = useMemo(() => [16, 30, 44, 56, 78, 92, 106, 118].map((s, index) =>
    pathOffsetAt(s, index % 2 === 0 ? -1.35 : 1.35)
  ), []);
  return (
    <>
      <hemisphereLight args={["#fff5e7", "#6e6255", 0.72]} />
      <ambientLight intensity={0.22} />
      <directionalLight position={[3, 9, 5]} color="#fff1d8" intensity={1.05} castShadow={false} />
      <directionalLight position={[-5, 5, -24]} color="#e6efff" intensity={0.28} castShadow={false} />
      {lights.map((point, index) => (
        <pointLight key={index} position={[point.x, MALL.ceiling - 0.45, point.z]}
          color={index < 4 ? "#ffdfad" : "#e7edf4"} intensity={0.82} distance={9} decay={2} />
      ))}
      <fog attach="fog" args={["#dcd5ca", 27, MALL.length + 12]} />
      <color attach="background" args={["#dcd5ca"]} />
    </>
  );
}
