import * as THREE from "three";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { transitionOrigin } from "@/lib/bridge/transitionBridge";
import { SECTION_BY_ID, sectionHref, viewingPose, type PlacedSection } from "@/lib/config/sections";
import { getPose, setPose, walker } from "@/mall/navigation/walker";
import { sectionScreenPosition } from "@/mall/sections/geometry";
import { openState } from "./openState";

let cameraRef: THREE.Camera | null = null;
let sizeRef = { width: 1, height: 1 };

export function registerTransitionCamera(camera: THREE.Camera, width: number, height: number) {
  cameraRef = camera;
  sizeRef = { width, height };
}

function displayScreenPoint(section: PlacedSection) {
  if (!cameraRef) return { x: sizeRef.width / 2, y: sizeRef.height / 2 };
  cameraRef.updateMatrixWorld();
  const point = sectionScreenPosition(section).project(cameraRef);
  return {
    x: (point.x * 0.5 + 0.5) * sizeRef.width,
    y: (-point.y * 0.5 + 0.5) * sizeRef.height,
  };
}

/** The catalogue opens as an interface attached to the LCD; the camera never walks toward it. */
export function openSection(id: string) {
  const section = SECTION_BY_ID[id];
  const state = useMallStore.getState();
  if (!section || !section.live || state.mode !== "walking") return;

  state.savePose(getPose());
  walker.vel = 0;
  walker.pad = 0;
  walker.keys.clear();
  state.setMode("opening");
  lookBridge.unlock();
  state.setLookMode("idle");

  openState.id = id;
  openState.target = 1;
  openState.value = 1;

  const origin = displayScreenPoint(section);
  transitionOrigin.x = origin.x;
  transitionOrigin.y = origin.y;
  transitionOrigin.fromMall = true;
  transitionOrigin.closedBySelf = false;

  state.requestRoute(sectionHref(section));
  state.setMode("shop");
}

/** Closing restores s, yaw and pitch exactly; it does not play an automatic walk-back animation. */
export function returnToMall() {
  const state = useMallStore.getState();
  if (state.mode === "walking" || state.mode === "returning") return;

  const saved = state.savedPose;
  state.setMode("returning");
  openState.target = 0;
  openState.value = 0;
  openState.id = null;

  if (saved) setPose(saved);
  else {
    walker.vel = 0;
    walker.pad = 0;
  }

  state.setHovered(null);
  state.setLookMode("idle");
  state.setMode("walking");
}

/** Direct shop links start at the same centreline pose used by the mall's store directory. */
export function enterFromDeepLink(id: string) {
  const section = SECTION_BY_ID[id];
  if (!section) return;
  const state = useMallStore.getState();
  const pose = viewingPose(section);
  setPose(pose);
  if (!state.savedPose) state.savePose(pose);

  openState.id = id;
  openState.target = 1;
  openState.value = 1;
  transitionOrigin.fromMall = false;
  state.setMode("shop");
}
