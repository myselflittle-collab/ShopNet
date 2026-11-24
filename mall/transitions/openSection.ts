import * as THREE from "three";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { transitionOrigin } from "@/lib/bridge/transitionBridge";
import { SECTION_BY_ID, lcdLocal, sectionHref, storeToWorld, viewingPose, type PlacedSection } from "@/lib/config/sections";
import { alignedHeadYaw, getPose, setPose, walker } from "@/mall/navigation/walker";
import { openState } from "./openState";

/**
 * Entering a boutique keeps the customer exactly where they stand on the centreline:
 * no camera movement, no turn, no FOV change. The 2D catalogue grows out of the store's screen
 * and closing it restores the exact saved pose (s, head yaw, pitch).
 */
export const REVEAL_DELAY_MS = 120;

let camRef: THREE.Camera | null = null;
let sizeRef = { w: 1, h: 1 };
export function registerTransitionCamera(cam: THREE.Camera, w: number, h: number) {
  camRef = cam;
  sizeRef = { w, h };
}

/** Screen point of the store's campaign screen — the shop grows from here. */
function displayScreenPoint(s: PlacedSection) {
  if (!camRef) return { x: sizeRef.w / 2, y: sizeRef.h / 2 };
  camRef.updateMatrixWorld();
  const l = lcdLocal(s);
  const w = storeToWorld(s, l.x, l.z);
  const p = new THREE.Vector3(w.x, l.y, w.z).project(camRef);
  if (p.z > 1) return { x: sizeRef.w / 2, y: sizeRef.h / 2 };
  return { x: (p.x * 0.5 + 0.5) * sizeRef.w, y: (-p.y * 0.5 + 0.5) * sizeRef.h };
}

export function openSection(id: string) {
  const s = SECTION_BY_ID[id];
  const st = useMallStore.getState();
  if (!s || !s.live || st.mode !== "walking") return;
  st.savePose(getPose());
  openState.facing = walker.facing;
  st.setMode("opening");
  lookBridge.unlock();
  openState.id = s.id;
  openState.target = 1;
  const o = displayScreenPoint(s);
  transitionOrigin.x = o.x;
  transitionOrigin.y = o.y;
  transitionOrigin.fromMall = true;
  setTimeout(() => {
    useMallStore.getState().requestRoute(sectionHref(s));
    useMallStore.getState().setMode("shop");
  }, REVEAL_DELAY_MS);
}

/**
 * Shop closed: back on the same spot of the centreline, looking straight down the path
 * (the way the customer was facing), with free-look running again.
 */
export function returnToMall() {
  const st = useMallStore.getState();
  if (st.mode === "walking") return;
  if (st.savedPose) {
    const c = Math.cos(st.savedPose.headYaw);
    const facing = Math.abs(c) > 0.17 ? Math.sign(c) : openState.facing;
    walker.facing = facing;
    setPose({ s: st.savedPose.s, headYaw: alignedHeadYaw(st.savedPose.headYaw, facing), pitch: 0 });
  }
  openState.id = null;
  openState.target = 0;
  openState.value = 0;
  st.setMode("walking");
  st.setLookMode("free");
  // the mall released the mouse itself when the shop opened, so it may capture it again without a click
  lookBridge.lock();
}

/** Arriving directly on a shop URL: stand on the centreline facing that boutique, behind the shop panel. */
export function enterFromDeepLink(id: string) {
  const s = SECTION_BY_ID[id];
  if (!s) return;
  const st = useMallStore.getState();
  const pose = viewingPose(s);
  setPose(pose);
  openState.id = s.id;
  if (!st.savedPose) st.savePose(pose);
  transitionOrigin.fromMall = false;
  st.setMode("shop");
}
