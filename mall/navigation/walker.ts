import { MALL, WALKABLE, pathCenterX } from "@/lib/config/mall";

export interface Pose {
  x: number;
  z: number;
  /** Head yaw relative to the local direction of the curved mall centreline. */
  yaw: number;
  pitch: number;
}

interface Tween {
  from: Pose;
  to: Pose;
  start: number;
  dur: number;
  ease: (t: number) => number;
  onDone?: () => void;
}

export const TUNING = {
  walkSpeed: 3.0,
  wheelImpulse: 0.035,
  maxSpeed: 6.8,
  damping: 2.35,
  turnSpeedKeys: 2.4,
  mouseSensitivity: 0.0052,
  touchSensitivity: 0.0065,
  lookDamping: 24,
  pitchUp: (48 * Math.PI) / 180,
  pitchDown: (48 * Math.PI) / 180,
} as const;

export const walker = {
  x: pathCenterX(MALL.entranceZ),
  z: MALL.entranceZ,
  yaw: 0,
  pitch: 0,
  targetYaw: 0,
  targetPitch: 0,
  vel: 0,
  strafe: 0,
  steerX: 0,
  steerY: 0,
  keys: new Set<string>(),
  pad: 0,
  tween: null as Tween | null,
};

export function getPose(): Pose {
  return { x: walker.x, z: walker.z, yaw: walker.yaw, pitch: walker.pitch };
}

export function setPose(p: Pose) {
  walker.x = p.x;
  walker.z = p.z;
  walker.yaw = walker.targetYaw = p.yaw;
  walker.pitch = walker.targetPitch = p.pitch;
  walker.vel = 0;
  walker.strafe = 0;
  walker.pad = 0;
}

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

function shortestAngle(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function tweenTo(to: Pose, dur: number, onDone?: () => void, ease = easeInOutCubic) {
  walker.vel = 0;
  walker.strafe = 0;
  walker.pad = 0;
  walker.tween = { from: getPose(), to, start: performance.now(), dur, ease, onDone };
}

/** Walking is constrained to the centreline; x is derived only from z. */
export function clampToWalkable(_x: number, z: number) {
  const safeZ = Math.max(WALKABLE.minZ, Math.min(WALKABLE.maxZ, z));
  return { x: pathCenterX(safeZ), z: safeZ };
}

const clampPitch = (p: number) => Math.max(-TUNING.pitchDown, Math.min(TUNING.pitchUp, p));

export function stepWalker(dt: number) {
  dt = Math.min(dt, 0.1);

  if (walker.tween) {
    const tw = walker.tween;
    const t = Math.min(1, (performance.now() - tw.start) / (tw.dur * 1000));
    const k = tw.ease(t);
    walker.x = tw.from.x + (tw.to.x - tw.from.x) * k;
    walker.z = tw.from.z + (tw.to.z - tw.from.z) * k;
    walker.yaw = tw.from.yaw + shortestAngle(tw.from.yaw, tw.to.yaw) * k;
    walker.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * k;
    walker.targetYaw = walker.yaw;
    walker.targetPitch = walker.pitch;
    if (t >= 1) {
      walker.tween = null;
      setPose(tw.to);
      tw.onDone?.();
    }
    return;
  }

  const keys = walker.keys;
  let forward = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) forward += 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) forward -= 1;
  forward += walker.pad;

  // A/D and arrow keys rotate the head; they never shift the customer's walking lane.
  if (keys.has("KeyA") || keys.has("ArrowLeft")) walker.targetYaw += TUNING.turnSpeedKeys * dt;
  if (keys.has("KeyD") || keys.has("ArrowRight")) walker.targetYaw -= TUNING.turnSpeedKeys * dt;
  if (walker.steerX !== 0) walker.targetYaw -= walker.steerX * 2.2 * dt;
  if (walker.steerY !== 0) walker.targetPitch = clampPitch(walker.targetPitch - walker.steerY * 1.2 * dt);

  if (forward !== 0) {
    walker.vel += (forward * TUNING.walkSpeed - walker.vel) * Math.min(1, dt * 7);
  } else {
    walker.vel *= Math.exp(-TUNING.damping * dt);
  }

  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
  if (Math.abs(walker.vel) < 0.002) walker.vel = 0;

  const lookBlend = 1 - Math.exp(-TUNING.lookDamping * dt);
  walker.yaw += (walker.targetYaw - walker.yaw) * lookBlend;
  walker.pitch += (walker.targetPitch - walker.pitch) * lookBlend;

  // Body travel is independent from where the head is looking.
  const nextZ = walker.z - walker.vel * dt;
  const next = clampToWalkable(walker.x, nextZ);
  walker.x = next.x;
  walker.z = next.z;
}

/** Scroll up (negative deltaY) walks forward; scroll down walks backward. */
export function addWheel(deltaY: number) {
  if (walker.tween || !Number.isFinite(deltaY)) return;
  walker.vel += -deltaY * TUNING.wheelImpulse;
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
}

export function addLook(dx: number, dy: number, sensitivity: number = TUNING.mouseSensitivity) {
  if (walker.tween) return;
  walker.targetYaw -= dx * sensitivity;
  walker.targetPitch = clampPitch(walker.targetPitch - dy * sensitivity);
}
