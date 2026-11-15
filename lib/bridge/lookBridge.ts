/**
 * Lets non-3D UI (the shop's "Back to mall" button, the start overlay) ask the mall to capture the mouse.
 * Pointer lock may only be requested inside a user's click, so the shop calls this synchronously in its handler.
 * The mall's Controls component fills these functions in.
 */
export const lookBridge = {
  /** capture the mouse for natural look-around; safe to call when the mall isn't mounted */
  lock: () => {},
  /** release the mouse */
  unlock: () => {
    if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();
  },
};
