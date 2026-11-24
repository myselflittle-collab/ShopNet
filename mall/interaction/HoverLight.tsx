"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SECTION_BY_ID, storeToWorld } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";

/** One shared warm light that moves into the boutique being aimed at or featured. */
export function HoverLight() {
  const light = useRef<THREE.PointLight>(null);
  const level = useRef(0);
  useFrame((_, dt) => {
    const l = light.current;
    if (!l) return;
    const st = useMallStore.getState();
    const id = st.hoveredId ?? st.featuredId;
    const s = id ? SECTION_BY_ID[id] : null;
    if (s) {
      const p = storeToWorld(s, 0, -1.4);
      l.position.set(p.x, 3.2, p.z);
    }
    const want = s ? (st.hoveredId ? 9 : 6) : 0;
    level.current += (want - level.current) * Math.min(1, dt * 5);
    l.intensity = level.current;
  });
  return <pointLight ref={light} intensity={0} distance={7} decay={2} color="#ffe0ad" />;
}
