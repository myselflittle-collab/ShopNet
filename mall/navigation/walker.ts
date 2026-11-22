import { MALL } from "@/lib/config/mall";
import { pathLength } from "./path";

export interface Pose {
  s: number;
  /** Unwrapped head yaw relative to the local path tangent. */
  yaw: number;
  pitch: number;
}

/** Human-paced defaults; values are tuned during the in-engine greybox review. */
export const TUNING = {
  walkSpeed: 1.2,
  wheelImpulse: 0.012,
  maxSpeed: 2.2,
  damping: 2.2,
  turnSpeedKeys: 2.4,
  mouseSensitivity: 0.0055,
  touchSensitivity: 0.0065,
  pitchUp: (35 * Math.PI) / 180,
  pitchDown: (40 * Math.PI) / 180,
} as const;

export const walker = {
  s: 2,
  yaw: 0,
  pitch: 0,
  vel: 0,
  pad: 0,
  keys: new Set<string>(),
  tween: null as null,
};

export function getPose(): Pose {
  return { s: walker.s, yaw: walker.yaw, pitch: walker.pitch };
}

export function setPose(pose: Pose) {
  walker.s = Math.max(0, Math.min(pathLength(), pose.s));
  walker.yaw = pose.yaw;
  walker.pitch = pose.pitch;
  walker.vel = 0;
  walker.pad = 0;
}

export const clampPitch = (pitch: number) =>
  Math.max(-TUNING.pitchDown, Math.min(TUNING.pitchUp, pitch));

export function stepWalker(dt: number) {
  dt = Math.min(Math.max(dt, 0), 0.1);
  let forward = walker.pad;

  if (walker.keys.has("KeyW") || walker.keys.has("ArrowUp")) forward += 1;
  if (walker.keys.has("KeyS") || walker.keys.has("ArrowDown")) forward -= 1;

  if (walker.keys.has("KeyA") || walker.keys.has("ArrowLeft")) {
    walker.yaw += TUNING.turnSpeedKeys * dt;
  }
  if (walker.keys.has("KeyD") || walker.keys.has("ArrowRight")) {
    walker.yaw -= TUNING.turnSpeedKeys * dt;
  }

  if (forward !== 0) {
    const target = Math.sign(forward) * TUNING.walkSpeed;
    walker.vel += (target - walker.vel) * (1 - Math.exp(-7 * dt));
  } else {
    walker.vel *= Math.exp(-TUNING.damping * dt);
  }

  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
  if (Math.abs(walker.vel) < 0.002) walker.vel = 0;
  walker.s = Math.max(0, Math.min(pathLength(), walker.s + walker.vel * dt));
}

export function addWheel(deltaY: number) {
  if (walker.tween !== null || !Number.isFinite(deltaY)) return;
  // DOM wheel deltaY > 0 means scroll down, which is forward in ShopNet.
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel + deltaY * TUNING.wheelImpulse));
}

export function addLook(dx: number, dy: number = 0, sensitivity: number = TUNING.mouseSensitivity) {
  if (walker.tween !== null) return;
  walker.yaw -= dx * sensitivity;
  walker.pitch = clampPitch(walker.pitch - dy * sensitivity);
}
