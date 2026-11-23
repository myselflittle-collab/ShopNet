"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export function BenchTelemetry({ enabled }: { enabled: boolean }) {
  const gl = useThree((state) => state.gl);
  const lastSample = useRef(0);

  useFrame((_, delta) => {
    if (!enabled || typeof window === "undefined" || !window.__shopnetBenchRecording) return;

    // This is the R3F render-loop delta, not an unrelated page-level animation frame.
    const frameMs = delta * 1000;
    if (Number.isFinite(frameMs) && frameMs > 0) {
      window.__shopnetBenchFrameTimes?.push(frameMs);
    }

    const now = performance.now();
    if (now - lastSample.current < 250) return;
    lastSample.current = now;

    const info = gl.info;
    window.__shopnetBenchStats = {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      sampledAt: now,
    };
  });

  return null;
}
