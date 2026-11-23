"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { openState } from "@/mall/transitions/openState";
import { pathOffsetAt } from "@/mall/navigation/path";

export function HoverLight() {
  const light = useRef<THREE.PointLight>(null);
  const intensity = useRef(0);

  useFrame((_, delta) => {
    const targetLight = light.current;
    if (!targetLight) return;

    const id = openState.id ?? useMallStore.getState().hoveredId;
    const section = id ? SECTION_BY_ID[id] : null;
    if (section) {
      const point = pathOffsetAt(section.sCenter, section.side * 2.42);
      targetLight.position.set(point.x, 2.65, point.z);
    }

    const desired = section ? (openState.id ? 12 : 7) : 0;
    intensity.current += (desired - intensity.current) * (1 - Math.exp(-delta * 6));
    targetLight.intensity = intensity.current;
  });

  return <pointLight ref={light} intensity={0} distance={7} decay={2} color="#ffe1b4" />;
}
