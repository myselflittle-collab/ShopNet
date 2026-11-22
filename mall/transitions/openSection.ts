import * as THREE from "three";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { transitionOrigin } from "@/lib/bridge/transitionBridge";
import { SECTION_BY_ID, sectionHref, viewingPose, type PlacedSection } from "@/lib/config/sections";
import { pathOffsetAt } from "@/mall/navigation/path";
import { getPose, setPose } from "@/mall/navigation/walker";
import { openState } from "./openState";

let cameraRef: THREE.Camera | null = null;
let sizeRef = { w: 1, h: 1 };

export function registerTransitionCamera(camera: THREE.Camera, width: number, height: number) {
  cameraRef = camera;
  sizeRef = { w: width, h: height };
}

function displayScreenPoint(section: PlacedSection) {
  if (!cameraRef) return { x: sizeRef.w / 2, y: sizeRef.h / 2 };
  cameraRef.updateMatrixWorld();
  const point = pathOffsetAt(section.sCenter, section.side * 5.68);
  const projected = new THREE.Vector3(point.x, 2.04, point.z).project(cameraRef);
  return {
    x: (projected.x * 0.5 + 0.5) * sizeRef.w,
    y: (-projected.y * 0.5 + 0.5) * sizeRef.h,
  };
}

/** Open the catalogue from its storefront without moving the camera off the centreline. */
export function openSection(id: string) {
  const section = SECTION_BY_ID[id];
  const state = useMallStore.getState();
  if (!section || !section.live || state.mode !== "walking") return;

  state.savePose(getPose());
  state.setMode("opening");
  lookBridge.unlock();
  openState.id = section.id;
  openState.target = 1;
  openState.value = 1;

  const origin = displayScreenPoint(section);
  transitionOrigin.x = origin.x;
  transitionOrigin.y = origin.y;
  transitionOrigin.fromMall = true;
  state.requestRoute(sectionHref(section));
  state.setMode("shop");
}

/** Return to exactly the same centreline position and head pose. */
export function returnToMall() {
  const state = useMallStore.getState();
  if (state.mode === "walking" || state.mode === "returning") return;
  if (state.savedPose) setPose(state.savedPose);
  openState.id = null;
  openState.target = 0;
  openState.value = 0;
  state.setHovered(null);
  state.setMode("walking");
}

/** A direct catalogue URL opens over its matching centreline viewing pose. */
export function enterFromDeepLink(id: string) {
  const section = SECTION_BY_ID[id];
  if (!section) return;
  const state = useMallStore.getState();
  if (!state.savedPose) {
    const pose = viewingPose(section);
    setPose(pose);
    state.savePose(pose);
  }
  openState.id = section.id;
  openState.target = 1;
  openState.value = 1;
  transitionOrigin.fromMall = false;
  state.setMode("shop");
}
