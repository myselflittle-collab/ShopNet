"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { SECTIONS } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { Shell } from "./scene/Shell";
import { Lighting } from "./scene/Lighting";
import { SectionBay } from "./sections/SectionBay";
import { Controls } from "./navigation/Controls";
import { HoverController } from "./interaction/HoverController";
import { HoverLight } from "./interaction/HoverLight";
import { AmbientPathLights } from "./scene/AmbientPathLights";
import { VideoPlaybackSystem } from "./sections/VideoPlaybackSystem";

function ReadySignal() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    useMallStore.getState().setReady();
  });
  return null;
}

/** The 3D mall. Mounted once and kept alive while the shop opens over it. */
export default function MallCanvas() {
  const mode = useMallStore((s) => s.mode);
  return (
    <Canvas
      className="mall-canvas"
      frameloop={mode === "shop" ? "demand" : "always"}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 62, near: 0.05, far: 120, position: [0, 1.62, 3.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
      }}
    >
      <Lighting />
      <Shell />
      <AmbientPathLights />
      {SECTIONS.map((s) => (
        <SectionBay key={s.id} s={s} />
      ))}
      <HoverLight />
      <VideoPlaybackSystem />
      <Controls />
      <HoverController />
      <ReadySignal />
    </Canvas>
  );
}
