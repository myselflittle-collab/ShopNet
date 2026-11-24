"use client";

import { create } from "zustand";

/**
 * Five action-gated steps, in the requested order:
 *  1 scroll down → walk forward      2 scroll up → walk back
 *  3 look left                       4 look right
 *  5 double-click / double-tap → free-look stops, the scrim rises, the first boutique lights up
 * The system never moves or turns the camera and never blocks walking.
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
  walkForward: 1.5,
  walkBack: 0.8,
  turn: (30 * Math.PI) / 180,
} as const;
