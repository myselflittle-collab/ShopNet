"use client";

import { create } from "zustand";
import type { Pose } from "@/mall/navigation/walker";

export type MallMode = "walking" | "opening" | "shop" | "returning";
/**
 * free    = head follows mouse / trackpad movement (pointer lock when the browser grants it)
 * stopped = free-look paused (double-click / double-tap); the cursor selects stores
 */
export type LookMode = "free" | "stopped";

interface MallState {
  mode: MallMode;
  hoveredId: string | null;
  savedPose: Pose | null;
  pendingRoute: string | null;
  openRequest: string | null;
  ready: boolean;
  /** the welcome screen has been dismissed */
  entered: boolean;
  lookMode: LookMode;
  /** pointer lock is currently held */
  locked: boolean;
  /** the store whose campaign is featured (playing) */
  featuredId: string | null;
  shopVisible: boolean;
  setEntered: () => void;
  setLookMode: (m: LookMode) => void;
  setLocked: (v: boolean) => void;
  setFeatured: (id: string | null) => void;
  setShopVisible: (v: boolean) => void;
  setMode: (m: MallMode) => void;
  setHovered: (id: string | null) => void;
  savePose: (p: Pose) => void;
  requestRoute: (r: string | null) => void;
  requestOpen: (id: string | null) => void;
  setReady: () => void;
}

const POSE_KEY = "shopnet:savedPose:v2";

function loadPose(): Pose | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(POSE_KEY);
    const p = raw ? (JSON.parse(raw) as Pose) : null;
    return p && typeof p.s === "number" ? p : null;
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
  entered: false,
  lookMode: "free",
  locked: false,
  featuredId: null,
  shopVisible: false,
  setEntered: () => set({ entered: true }),
  setLookMode: (lookMode) => set({ lookMode }),
  setLocked: (locked) => set({ locked }),
  setFeatured: (featuredId) => set({ featuredId }),
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
