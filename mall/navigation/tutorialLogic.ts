"use client";

import { TUTORIAL, useTutorial } from "@/lib/bridge/tutorialStore";
import { resetLimits, walker } from "./walker";

/**
 * The guided walk only watches what the customer does. It never limits walking, never holds the
 * body still and never requires facing a particular direction, so every step finishes as soon as
 * the action has been done:
 *  1 walk forward ≥ 1.5 m   2 walk back ≥ 0.8 m   3 turn left ≥ 30°   4 turn right ≥ 30°
 *  5 double-click / double-tap anywhere  → the first boutique's scrim rises and it lights up.
 */
const state = { anchorS: 0, maxS: 0, lastStep: 0 };

export function registerTutorialCamera() {
  /* kept for compatibility; the tour no longer needs the camera */
}

function begin(step: number) {
  state.lastStep = step;
  state.anchorS = walker.s;
  state.maxS = walker.s;
  walker.turnedLeft = 0;
  walker.turnedRight = 0;
}

/** Double-click / double-tap. Returns true when free-look should stop. */
export function attemptStopFreeLook(): boolean {
  const t = useTutorial.getState();
  if (t.step === 6) return true;
  if (t.step !== 5) return false;
  t.reveal();
  resetLimits();
  return true;
}

export function tickTutorial() {
  const t = useTutorial.getState();
  if (t.step < 1 || t.step > 5) return;
  if (state.lastStep !== t.step) begin(t.step);
  switch (t.step) {
    case 1:
      if (walker.s - state.anchorS >= TUTORIAL.walkForward) t.advance(2);
      break;
    case 2:
      state.maxS = Math.max(state.maxS, walker.s);
      if (state.maxS - walker.s >= TUTORIAL.walkBack) t.advance(3);
      break;
    case 3:
      if (walker.turnedLeft >= TUTORIAL.turn) t.advance(4);
      break;
    case 4:
      if (walker.turnedRight >= TUTORIAL.turn) t.advance(5);
      break;
    default:
      break;
  }
}

/** Skip the tour: reveal the first boutique straight away. */
export function skipTutorial() {
  useTutorial.getState().reveal();
  resetLimits();
}
