"use client";

import * as THREE from "three";
import { SECTIONS, lcdLocal, storeToWorld } from "@/lib/config/sections";
import { TUTORIAL, useTutorial } from "@/lib/bridge/tutorialStore";
import { resetLimits, walker } from "./walker";

const W1 = SECTIONS[0];
const l = lcdLocal(W1);
const halfW = 1.54;
const halfH = 0.87;
const corners = [
  storeToWorld(W1, l.x - halfW, l.z),
  storeToWorld(W1, l.x + halfW, l.z),
].flatMap((p) => [new THREE.Vector3(p.x, l.y - halfH, p.z), new THREE.Vector3(p.x, l.y + halfH, p.z)]);
const tmp = new THREE.Vector3();
let cameraRef: THREE.Camera | null = null;

export function registerTutorialCamera(c: THREE.Camera) {
  cameraRef = c;
}

/** W1's whole campaign screen is inside the current view (measured on the real camera, any aspect ratio). */
export function w1FullyInView(margin = 1.0): boolean {
  if (!cameraRef) return false;
  cameraRef.updateMatrixWorld();
  for (const c of corners) {
    tmp.copy(c).project(cameraRef);
    if (tmp.z > 1 || Math.abs(tmp.x) > margin || Math.abs(tmp.y) > margin) return false;
  }
  return true;
}

/** Head direction (relative to the path) at which the customer looks straight at W1's screen. */
export function w1HeadYaw(pathYaw: number, eye: { x: number; z: number }) {
  const c = storeToWorld(W1, l.x, l.z);
  const world = Math.atan2(-(c.x - eye.x), -(c.z - eye.z));
  let rel = world - pathYaw;
  while (rel - walker.headYaw > Math.PI) rel -= Math.PI * 2;
  while (rel - walker.headYaw < -Math.PI) rel += Math.PI * 2;
  return rel;
}

/**
 * Double-click / double-tap on the walkway. Returns true when free-look should actually stop.
 * Before step 5 the tutorial ignores it; in step 5 it is accepted only while W1 is fully in view.
 */
export function attemptStopFreeLook(): boolean {
  const t = useTutorial.getState();
  if (t.step === 6) return true;
  if (t.step < 5) return false;
  if (!w1FullyInView()) {
    t.setNudge("Face the boutique on your left, then try again");
    return false;
  }
  t.reveal();
  resetLimits();
  return true;
}

const state = { t3Max: -Infinity, inViewSince: 0 };

/** Runs every frame while the tutorial is active. Only reads the customer's actions. */
export function tickTutorial(pathYawAtS: number, eye: { x: number; z: number }) {
  const t = useTutorial.getState();
  switch (t.step) {
    case 1:
      walker.minS = 0.6;
      walker.maxS = TUTORIAL.walkTo;
      if (walker.s >= TUTORIAL.walkTo - 0.05) t.advance(2);
      break;
    case 2:
      walker.minS = TUTORIAL.backTo;
      walker.maxS = TUTORIAL.walkTo;
      if (walker.s <= TUTORIAL.backTo + 0.05) {
        walker.s = TUTORIAL.backTo;
        walker.hold = true;
        state.t3Max = -Infinity;
        t.advance(3);
      }
      break;
    case 3: {
      walker.hold = true;
      const target = w1HeadYaw(pathYawAtS, eye) + TUTORIAL.lookPastW1;
      state.t3Max = Math.max(state.t3Max, walker.headYaw);
      if (walker.headYaw >= target) t.advance(4);
      break;
    }
    case 4: {
      walker.hold = true;
      state.t3Max = Math.max(state.t3Max, walker.headYaw);
      const turnedRight = state.t3Max - walker.headYaw >= TUTORIAL.lookRight;
      const now = performance.now();
      if (turnedRight && w1FullyInView()) {
        if (!state.inViewSince) state.inViewSince = now;
        if (now - state.inViewSince >= TUTORIAL.holdMs) {
          state.inViewSince = 0;
          t.advance(5);
        }
      } else {
        state.inViewSince = 0;
        if (turnedRight && !t.nudge) t.setNudge("Look back at the boutique");
        if (!turnedRight && t.nudge) t.setNudge(null);
      }
      break;
    }
    case 5:
      walker.hold = true;
      if (t.nudge && w1FullyInView()) t.setNudge(null);
      break;
    default:
      break;
  }
}

/** Skip the tour: release the limits and reveal W1 (accessibility / returning visitors). */
export function skipTutorial() {
  useTutorial.getState().reveal();
  resetLimits();
}
