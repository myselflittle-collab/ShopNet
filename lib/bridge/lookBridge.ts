/**
 * Lets DOM UI (the Enter button, the Look Around button, the shop's back button) talk to the mall's
 * controls. Pointer lock may only be requested inside a user's click, so callers invoke these
 * synchronously from their click handlers. The mall's Controls component fills them in.
 */
export const lookBridge = {
  /** capture the mouse for unlimited 360° look; refused requests are harmless */
  lock: () => {},
  /** resume free-look after it was stopped (and capture the mouse when possible) */
  resume: () => {},
  /** release the mouse */
  unlock: () => {
    if (typeof document !== "undefined" && document.pointerLockElement) document.exitPointerLock();
  },
};
