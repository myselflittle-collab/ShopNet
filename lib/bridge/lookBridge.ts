import { useMallStore } from "./mallStore";

/** Free-look is ordinary mouse/touch movement. No pointer lock is ever requested. */
export const lookBridge = {
  lock: () => useMallStore.getState().setLookMode("steer"),
  unlock: () => useMallStore.getState().setLookMode("idle"),
};
