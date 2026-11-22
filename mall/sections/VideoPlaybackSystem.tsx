"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useMallStore } from "@/lib/bridge/mallStore";
import { walker } from "@/mall/navigation/walker";
import { updateVideoPlayback, releaseAllVideos } from "./videoPlayback";

export function VideoPlaybackSystem() {
  const camera = useThree((state) => state.camera);
  const elapsed = useRef(0);
  const mobile = useRef(false);

  useEffect(() => {
    mobile.current = window.matchMedia("(pointer: coarse)").matches;
    const onVisibility = () => {
      if (document.hidden) releaseAllVideos();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const unsubscribe = useMallStore.subscribe((state, previous) => {
      if (state.mode !== "walking" || state.shopVisible || previous.mode !== state.mode) {
        if (state.mode !== "walking" || state.shopVisible) releaseAllVideos();
      }
    });
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe();
      releaseAllVideos();
    };
  }, []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (elapsed.current < 0.1) return;
    elapsed.current = 0;
    const state = useMallStore.getState();
    updateVideoPlayback(
      camera,
      walker.s,
      state.mode === "walking" && !state.shopVisible,
      !document.hidden,
      mobile.current,
      walker.vel,
    );
  }, -2);

  return null;
}
