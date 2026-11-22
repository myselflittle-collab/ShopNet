"use client";

import { create } from "zustand";
import type { Pose } from "@/mall/navigation/walker";

export type MallMode = "walking" | "opening" | "shop" | "returning";
export type LookMode = "idle" | "locked" | "steer" | "touch";

interface MallState {
  mode: MallMode;
  hoveredId: string | null;
  savedPose: Pose | null;
  pendingRoute: string | null;
  openRequest: string | null;
  ready: boolean;
  lookMode: LookMode;
  setLookMode: (mode: LookMode) => void;
  shopVisible: boolean;
  setShopVisible: (visible: boolean) => void;
  setMode: (mode: MallMode) => void;
  setHovered: (id: string | null) => void;
  savePose: (pose: Pose) => void;
  requestRoute: (route: string | null) => void;
  requestOpen: (id: string | null) => void;
  setReady: () => void;

  /** 0 = not started, 1..5 = action-gated tutorial, 6 = completed. */
  tutorialStep: number;
  tutorialComplete: boolean;
  tutorialHint: string | null;
  startTutorial: () => void;
  setTutorialStep: (step: number) => void;
  setTutorialComplete: () => void;
  setTutorialHint: (hint: string | null) => void;
}

const POSE_KEY = "shopnet:savedPose";

function loadPose(): Pose | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POSE_KEY);
    return raw ? (JSON.parse(raw) as Pose) : null;
  } catch {
    return null;
  }
}

export const useMallStore = create<MallState>((set) => ({
  mode: "walking",
  hoveredId: null,
  savedPose: loadPose(),
  pendingRoute: null,
  openRequest: null,
  ready: false,
  lookMode: "idle",
  setLookMode: (lookMode) => set({ lookMode }),
  shopVisible: false,
  setShopVisible: (shopVisible) => set({ shopVisible }),
  setMode: (mode) => set({ mode }),
  setHovered: (hoveredId) => set({ hoveredId }),
  savePose: (pose) => {
    try {
      sessionStorage.setItem(POSE_KEY, JSON.stringify(pose));
    } catch {
      // Session storage may be unavailable; the in-memory pose is still retained.
    }
    set({ savedPose: pose });
  },
  requestRoute: (pendingRoute) => set({ pendingRoute }),
  requestOpen: (openRequest) => set({ openRequest }),
  setReady: () => set({ ready: true }),

  tutorialStep: 0,
  tutorialComplete: false,
  tutorialHint: null,
  startTutorial: () => set({ tutorialStep: 1, tutorialComplete: false, tutorialHint: null }),
  setTutorialStep: (tutorialStep) => set({ tutorialStep, tutorialHint: null }),
  setTutorialComplete: () => set({ tutorialStep: 6, tutorialComplete: true, tutorialHint: null }),
  setTutorialHint: (tutorialHint) => set({ tutorialHint }),
}));
