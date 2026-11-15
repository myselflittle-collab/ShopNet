import * as THREE from "three";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { transitionOrigin } from "@/lib/bridge/transitionBridge";
import { SECTION_BY_ID, sectionHref, viewingPose, type PlacedSection } from "@/lib/config/sections";
import { MALL } from "@/lib/config/mall";
import { easeInOutCubic, easeInOutSine, getPose, setPose, tweenTo, walker } from "@/mall/navigation/walker";
import { openState } from "./openState";

/**
 * Entering a section (≈1.9 s):
 *  1. approach   0.0–0.9 s  camera glides to stand in front of the display and faces it
 *  2. open       0.9–1.9 s  the display opens and the rail glides toward you while the camera eases in
 *  3. reveal     from 1.4 s the shop grows out of the display (handled by the shop overlay), mall softly blurs
 * Leaving reverses it: the shop shrinks back into the display, the rail returns, the camera walks back
 * to the exact saved position and direction.
 */
export const APPROACH_S = 0.9;
export const OPEN_S = 1.0;
export const REVEAL_DELAY_MS = 500; // into the open phase
export const RETURN_S = 1.25;

let camRef: THREE.Camera | null = null;
let sizeRef = { w: 1, h: 1 };
export function registerTransitionCamera(cam: THREE.Camera, w: number, h: number) {
  camRef = cam;
  sizeRef = { w, h };
}

/** Screen point of the display's rail — the shop grows from here. */
function displayScreenPoint(s: PlacedSection) {
  if (!camRef) return { x: sizeRef.w / 2, y: sizeRef.h / 2 };
  camRef.updateMatrixWorld();
  const p = new THREE.Vector3(s.side * (MALL.width / 2 - 1.8), 1.35, s.cz).project(camRef);
  return { x: (p.x * 0.5 + 0.5) * sizeRef.w, y: (-p.y * 0.5 + 0.5) * sizeRef.h };
}

/** A pose a step closer to the display than the viewing pose. */
function closerPose(s: PlacedSection) {
  const v = viewingPose(s);
  return { ...v, x: v.x + s.side * 0.5, pitch: -0.08 };
}

export function openSection(id: string) {
  const s = SECTION_BY_ID[id];
  const st = useMallStore.getState();
  if (!s || !s.live || st.mode !== "walking") return;

  st.savePose(getPose());
  st.setMode("opening");
  lookBridge.unlock();
  openState.id = s.id;
  openState.target = 0;
  openState.value = 0;

  // 1. approach
  tweenTo(
    viewingPose(s),
    APPROACH_S,
    () => {
      // 2. open: display opens and comes forward while the camera eases in
      openState.target = 1;
      tweenTo(
        closerPose(s),
        OPEN_S,
        () => useMallStore.getState().setMode("shop"),
        easeInOutSine,
      );
      // 3. reveal the shop out of the display
      setTimeout(() => {
        const o = displayScreenPoint(s);
        transitionOrigin.x = o.x;
        transitionOrigin.y = o.y;
        transitionOrigin.fromMall = true;
        useMallStore.getState().requestRoute(sectionHref(s));
      }, REVEAL_DELAY_MS);
    },
    easeInOutCubic,
  );
}

/** Shop closed: the display closes and the camera walks back to the exact saved pose. */
export function returnToMall() {
  const st = useMallStore.getState();
  if (st.mode === "walking" || st.mode === "returning") return;
  const saved = st.savedPose;
  openState.target = 0;
  if (!saved) {
    openState.id = null;
    st.setMode("walking");
    return;
  }
  st.setMode("returning");
  tweenTo(
    saved,
    RETURN_S,
    () => {
      setPose(saved); // exact restore
      openState.id = null;
      openState.value = 0;
      useMallStore.getState().setMode("walking");
    },
    easeInOutCubic,
  );
}

/** Arriving directly on a shop URL: place the camera at that bay, display open, behind the shop panel. */
export function enterFromDeepLink(id: string) {
  const s = SECTION_BY_ID[id];
  if (!s) return;
  const st = useMallStore.getState();
  setPose(closerPose(s));
  walker.tween = null;
  openState.id = s.id;
  openState.target = 1;
  openState.value = 1;
  if (!st.savedPose) st.savePose(viewingPose(s));
  transitionOrigin.fromMall = false;
  st.setMode("shop");
}
