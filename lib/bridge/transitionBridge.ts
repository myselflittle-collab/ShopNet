/**
 * Screen point the shop reveal grows from (the opened display) and shrinks back to on close.
 * Written by the mall right before it navigates to the shop; read by the shop overlay.
 */
export const transitionOrigin = {
  x: typeof window === "undefined" ? 0 : window.innerWidth / 2,
  y: typeof window === "undefined" ? 0 : window.innerHeight / 2,
  /** true when the shop was entered through the 3D transition (not a direct link) */
  fromMall: false,
  /** the shop played its own closing animation (false when the browser back button left the shop) */
  closedBySelf: false,
};
