/**
 * Plain shared values between the 3D mall and the DOM preview card (no three.js here).
 * The mall writes the anchor's screen position every frame; the card reads it.
 */
export const previewAnchor = {
  x: 0,
  y: 0,
  onScreen: false,
};

/** The cursor is over the preview card itself (keeps it open while you move onto it). */
export const previewCard = {
  hovered: false,
};
