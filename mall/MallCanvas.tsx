"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useMallStore } from "@/lib/bridge/mallStore";
import { useTutorial } from "@/lib/bridge/tutorialStore";
import { Shell } from "./scene/Shell";
import { Plaza } from "./scene/Plaza";
import { Lighting } from "./scene/Lighting";
import { Stores } from "./sections/Stores";
import { Controls } from "./navigation/Controls";
import { HoverController } from "./interaction/HoverController";
import { HoverLight } from "./interaction/HoverLight";
import { walker } from "./navigation/walker";
import { registerTutorialCamera, tickTutorial } from "./navigation/tutorialLogic";
import { configureVideo, pauseAll, releaseAll, updateVideos } from "./video/videoManager";

function ReadySignal() {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    useMallStore.getState().setReady();
  });
  return null;
}

/** Keeps the portrait-phone view wide enough to see a whole storefront (horizontal FOV ≥ 64°). */
function ResponsiveFov() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const minH = (64 * Math.PI) / 180;
    const vForMinH = (2 * Math.atan(Math.tan(minH / 2) / aspect) * 180) / Math.PI;
    camera.fov = Math.min(100, Math.max(62, vForMinH));
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/** Tutorial progress + featured-campaign selection, after the camera has moved this frame. */
function Director() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useEffect(() => {
    registerTutorialCamera();
    configureVideo();
    const onVis = () => pauseAll(document.hidden || useMallStore.getState().mode === "shop");
    document.addEventListener("visibilitychange", onVis);
    const unsub = useMallStore.subscribe((st, prev) => {
      if (st.mode !== prev.mode) pauseAll(st.mode !== "walking" || document.hidden);
    });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      unsub();
      releaseAll();
    };
  }, [camera]);
  useFrame(() => {
    const st = useMallStore.getState();
    const tut = useTutorial.getState();
    if (st.entered && tut.step >= 1 && tut.step <= 5 && st.mode === "walking") tickTutorial();
    const featured = updateVideos(camera, {
      paused: st.mode !== "walking" || document.hidden,
      enabled: st.entered && tut.revealed,
      direction: walker.vel,
      s: walker.s,
    });
    if (featured !== st.featuredId) st.setFeatured(featured);
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
      camera={{ fov: 62, near: 0.05, far: 90, position: [0, 1.62, -2] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        // If the GPU drops the context, release the videos and let the browser restore it instead of crashing.
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          releaseAll();
        });
      }}
    >
      <Lighting />
      <ResponsiveFov />
      <Shell />
      <Plaza />
      <Stores />
      <HoverLight />
      <Controls />
      <Director />
      <HoverController />
      <ReadySignal />
    </Canvas>
  );
}
