import { MALL } from "@/lib/config/mall";
import { pathLength } from "./path";

export interface Pose {
  s: number;
  /** Head yaw relative to the path tangent; intentionally unwrapped for unlimited 360° turns. */
  yaw: number;
  pitch: number;
}

export const TUNING = {
  walkSpeed: 2.2,
  wheelImpulse: 0.05,
  maxSpeed: 6,
  damping: 2.2,
  turnSpeedKeys: 2.4,
  mouseSensitivity: 0.0055,
  touchSensitivity: 0.0065,
  pitchUp: (35 * Math.PI) / 180,
  pitchDown: (40 * Math.PI) / 180,
} as const;

export const walker = {
  s: MALL.entranceS,
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
  walker.keys.clear();
}

export const clampPitch = (pitch: number) =>
  Math.max(-TUNING.pitchDown, Math.min(TUNING.pitchUp, pitch));

export function wrapAngle(angle: number) {
  const fullTurn = Math.PI * 2;
  const wrapped = angle % fullTurn;
  return wrapped < 0 ? wrapped + fullTurn : wrapped;
}

export function angleInRange(angle: number, min: number, max: number) {
  const value = wrapAngle(angle);
  const lower = wrapAngle(min);
  const upper = wrapAngle(max);
  return lower <= upper ? value >= lower && value <= upper : value >= lower || value <= upper;
}

/** dt in seconds. Positive velocity walks forward along increasing path s. */
export function stepWalker(dt: number) {
  dt = Math.min(Math.max(dt, 0), 0.1);
  let forward = walker.pad;
  if (walker.keys.has("KeyW") || walker.keys.has("ArrowUp")) forward += 1;
  if (walker.keys.has("KeyS") || walker.keys.has("ArrowDown")) forward -= 1;
  if (walker.keys.has("KeyA") || walker.keys.has("ArrowLeft")) walker.yaw += TUNING.turnSpeedKeys * dt;
  if (walker.keys.has("KeyD") || walker.keys.has("ArrowRight")) walker.yaw -= TUNING.turnSpeedKeys * dt;

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
  // DOM WheelEvent: positive deltaY is physical scroll-down, and positive s is forward.
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel + deltaY * TUNING.wheelImpulse));
}

export function addTouchWalk(deltaY: number) {
  if (walker.tween !== null || !Number.isFinite(deltaY)) return;
  // Finger moves up (negative dy) to walk forward; down (positive dy) to walk back.
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel - deltaY * 0.035));
}

export function addLook(dx: number, dy = 0, sensitivity = TUNING.mouseSensitivity) {
  if (walker.tween !== null) return;
  walker.yaw -= dx * sensitivity;
  walker.pitch = clampPitch(walker.pitch - dy * sensitivity);
}
