"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { SECTIONS } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { detectMallQuality, QUALITY_LIMITS, type MallQuality } from "./performance/quality";
import { Shell } from "./scene/Shell";
import { Lighting } from "./scene/Lighting";
import { SectionBay } from "./sections/SectionBay";
import { Controls } from "./navigation/Controls";
import { HoverController } from "./interaction/HoverController";
import { HoverLight } from "./interaction/HoverLight";
import { AmbientPathLights } from "./scene/AmbientPathLights";

function ReadySignal() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    useMallStore.getState().setReady();
  });
  return null;
}

/** Manually render at a capped rate on low/balanced devices to reduce GPU load. */
function CappedRenderer({ fps }: { fps: number }) {
  const elapsed = useRef(0);
  useFrame((state, delta) => {
    elapsed.current += delta;
    const frameInterval = 1 / fps;
    if (elapsed.current < frameInterval) return;
    elapsed.current %= frameInterval;
    state.gl.render(state.scene, state.camera);
  }, 1);
  return null;
}

/** The mall stays mounted behind the shop; rendering quality adapts to the device. */
export default function MallCanvas() {
  const mode = useMallStore((s) => s.mode);
  const [quality] = useState<MallQuality>(() => detectMallQuality());
  const limits = QUALITY_LIMITS[quality];

  return (
    <Canvas
      className="mall-canvas"
      frameloop={mode === "shop" ? "demand" : "always"}
      dpr={limits.dpr}
      gl={{
        antialias: quality === "high",
        powerPreference: quality === "high" ? "high-performance" : "low-power",
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
      }}
      camera={{ fov: 62, near: 0.05, far: 100, position: [0, 1.62, 3.5] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = quality === "low" ? 0.95 : 1.05;
        gl.domElement.addEventListener("webglcontextlost", (e) => e.preventDefault());
      }}
    >
      <Lighting quality={quality} />
      <Shell quality={quality} />
      <AmbientPathLights quality={quality} />
      {SECTIONS.map((s) => (
        <SectionBay key={s.id} s={s} quality={quality} />
      ))}
      <HoverLight />
      <Controls />
      <HoverController />
      {quality !== "high" && <CappedRenderer fps={limits.fps} />}
      <ReadySignal />
    </Canvas>
  );
}
