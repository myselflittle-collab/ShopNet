"use client";

import { create } from "zustand";
import type { Pose } from "@/mall/navigation/walker";

export type MallMode = "walking" | "opening" | "shop" | "returning";
/** how looking around works right now: idle = mouse free (click to start), locked = mouse captured, steer = fallback, touch */
export type LookMode = "idle" | "locked" | "steer" | "touch";

interface MallState {
  mode: MallMode;
  /** section highlighted and previewed (after the show delay) */
  hoveredId: string | null;
  /** pose saved when a section was opened; restored on return */
  savedPose: Pose | null;
  /** route the mall wants to navigate to; consumed by RouteSync */
  pendingRoute: string | null;
  /** a request from outside the 3D scene (preview button) to open a section */
  openRequest: string | null;
  /** the mall has drawn its first frame */
  ready: boolean;
  lookMode: LookMode;
  setLookMode: (m: LookMode) => void;
  /** the shop panel is on screen (drives the mall's blur); set by the shop overlay */
  shopVisible: boolean;
  setShopVisible: (v: boolean) => void;
  setMode: (m: MallMode) => void;
  setHovered: (id: string | null) => void;
  savePose: (p: Pose) => void;
  requestRoute: (r: string | null) => void;
  requestOpen: (id: string | null) => void;
  setReady: () => void;
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
  savePose: (p) => {
    try {
      sessionStorage.setItem(POSE_KEY, JSON.stringify(p));
    } catch {
      /* storage unavailable: pose stays in memory */
    }
    set({ savedPose: p });
  },
  requestRoute: (pendingRoute) => set({ pendingRoute }),
  requestOpen: (openRequest) => set({ openRequest }),
  setReady: () => set({ ready: true }),
}));
