/**
 * Shared, non-React state for hover timing and the preview card position.
 * Written by the 3D controllers every frame; read by the DOM preview card.
 */
export const HOVER_TIMING = {
  showDelayMs: 150,
  hideGraceMs: 300,
  stickyExpand: 0.15,
  maxDistance: 12,
  maxClickSpeed: 0.6,
};

export const hover = {
  candidate: null as string | null,
  candidateSince: 0,
  lostSince: 0,
};

export { previewAnchor, previewCard } from "@/lib/bridge/previewBridge";
