"use client";

import { create } from "zustand";

/**
 * Five action-gated steps, in the requested order:
 *  1 scroll down → walk forward (to s = 12.4)
 *  2 scroll up   → walk back   (to s = 11.4, then the body holds still)
 *  3 look left   (head turns past the first boutique, W1)
 *  4 look right  (back until W1's screen is fully in view)
 *  5 double-click / double-tap the walkway → free-look stops, the scrim rises, W1 lights up
 * The system never moves or turns the camera; every step waits for the customer's own action.
 */
export type TutorialStep = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface TutorialState {
  step: TutorialStep;
  /** W1's scrim has been raised (tutorial finished or skipped) */
  revealed: boolean;
  revealAt: number;
  /** short extra hint, e.g. "Face the boutique, then double-click" */
  nudge: string | null;
  start: () => void;
  advance: (to: TutorialStep) => void;
  reveal: () => void;
  setNudge: (n: string | null) => void;
}

const DONE_KEY = "shopnet:tutorialDone";

function wasDone() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export const useTutorial = create<TutorialState>((set) => ({
  step: 0,
  revealed: false,
  revealAt: 0,
  nudge: null,
  start: () => set(wasDone() ? { step: 6, revealed: true, revealAt: performance.now() - 5000 } : { step: 1 }),
  advance: (step) => set({ step, nudge: null }),
  reveal: () => {
    try {
      sessionStorage.setItem(DONE_KEY, "1");
    } catch {
      /* ignore */
    }
    set({ step: 6, revealed: true, revealAt: performance.now(), nudge: null });
  },
  setNudge: (nudge) => set({ nudge }),
}));

export const TUTORIAL = {
  walkTo: 12.4,
  backTo: 11.4,
  /** T3: the head must have turned past W1 to the left by this much (radians) */
  lookPastW1: (15 * Math.PI) / 180,
  /** T4: rightward rotation from the T3 maximum */
  lookRight: (30 * Math.PI) / 180,
  holdMs: 300,
} as const;
