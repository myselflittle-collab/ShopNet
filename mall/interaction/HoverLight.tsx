"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { pathCenterX } from "@/lib/config/mall";
import { useMallStore } from "@/lib/bridge/mallStore";
import { BAY_INNER } from "@/mall/sections/geometry";
import { openState } from "@/mall/transitions/openState";

/** One shared light that moves to the highlighted bay (cheaper than a light per bay). */
export function HoverLight() {
  const light = useRef<THREE.PointLight>(null);
  const level = useRef(0);
  useFrame((_, dt) => {
    const l = light.current;
    if (!l) return;
    const id = openState.id ?? useMallStore.getState().hoveredId;
    const s = id ? SECTION_BY_ID[id] : null;
    if (s) l.position.set(pathCenterX(s.cz) + BAY_INNER.centreX(s) - s.side * (0.3 + openState.value * 1.2), 2.6, s.cz);
    const want = s ? (openState.id ? 14 : 10) : 0;
    level.current += (want - level.current) * Math.min(1, dt * 6);
    l.intensity = level.current;
  });
  return <pointLight ref={light} intensity={0} distance={6} decay={2} color="#ffe0ad" />;
}
