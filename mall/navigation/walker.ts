import { MALL, WALKABLE } from "@/lib/config/mall";

export interface Pose {
  x: number;
  z: number;
  /** 0 looks down the corridor (-z); yaw is deliberately unbounded for continuous 360° turns. */
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

/** Tuned for human-paced walking and responsive, continuous mouse/touch look. */
export const TUNING = {
  walkSpeed: 2.7, // m/s for keyboard / walk pad
  wheelImpulse: 0.035, // stronger response for mouse wheel and trackpad gestures
  maxSpeed: 7.0,
  damping: 2.2,
  turnSpeedKeys: 2.4,
  /** radians per pixel of pointer-locked mouse movement */
  mouseSensitivity: 0.0055,
  /** radians per pixel of finger movement */
  touchSensitivity: 0.0065,
  lookDamping: 24,
  pitchUp: (55 * Math.PI) / 180,
  pitchDown: (55 * Math.PI) / 180,
} as const;

export const walker = {
  x: 0,
  z: MALL.entranceZ as number,
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

/** Walking is constrained to the exact centreline of the footpath. */
export function clampToWalkable(_x: number, z: number) {
  return {
    x: 0,
    z: Math.min(WALKABLE.maxZ, Math.max(WALKABLE.minZ, z)),
  };
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

  const k = walker.keys;
  let fwd = 0;
  if (k.has("KeyW") || k.has("ArrowUp")) fwd += 1;
  if (k.has("KeyS") || k.has("ArrowDown")) fwd -= 1;
  // A/D and left/right arrows rotate the head; they never move the body sideways.
  if (k.has("KeyA") || k.has("ArrowLeft")) walker.targetYaw += TUNING.turnSpeedKeys * dt;
  if (k.has("KeyD") || k.has("ArrowRight")) walker.targetYaw -= TUNING.turnSpeedKeys * dt;
  fwd += walker.pad;

  if (walker.steerX !== 0) walker.targetYaw -= walker.steerX * 2.2 * dt;
  if (walker.steerY !== 0) walker.targetPitch = clampPitch(walker.targetPitch - walker.steerY * 1.2 * dt);

  if (fwd !== 0) walker.vel += (fwd * TUNING.walkSpeed - walker.vel) * Math.min(1, dt * 7);
  else walker.vel *= Math.exp(-TUNING.damping * dt);
  // The customer's body never strafes away from the centreline.
  walker.strafe = 0;

  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
  if (Math.abs(walker.vel) < 0.002) walker.vel = 0;

  const a = 1 - Math.exp(-TUNING.lookDamping * dt);
  walker.yaw += (walker.targetYaw - walker.yaw) * a;
  walker.pitch += (walker.targetPitch - walker.pitch) * a;

  // Travel follows the mall axis (-Z), independently from the direction the customer looks.
  const nz = walker.z - walker.vel * dt;
  const c = clampToWalkable(0, nz);
  walker.x = c.x;
  walker.z = c.z;
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
