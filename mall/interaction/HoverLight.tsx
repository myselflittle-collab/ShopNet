"use client";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { pathOffsetAt } from "@/mall/navigation/path";
import { openState } from "@/mall/transitions/openState";

export function HoverLight() {
  const light = useRef<THREE.PointLight>(null);
  const level = useRef(0);
  useFrame((_, dt) => {
    const target = light.current;
    if (!target) return;
    const id = openState.id ?? useMallStore.getState().hoveredId;
    const section = id ? SECTION_BY_ID[id] : null;
    if (section) {
      const point = pathOffsetAt(section.sCenter, section.side * 3.7);
      target.position.set(point.x, 2.6, point.z);
    }
    const desired = section ? (openState.id ? 14 : 10) : 0;
    level.current += (desired - level.current) * (1 - Math.exp(-dt * 6));
    target.intensity = level.current;
  });
  return <pointLight ref={light} intensity={0} distance={6} decay={2} color="#ffe0ad" />;
}
