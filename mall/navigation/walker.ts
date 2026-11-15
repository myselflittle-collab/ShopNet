import { MALL, WALKABLE } from "@/lib/config/mall";

export interface Pose {
  x: number;
  z: number;
  /** 0 looks down the corridor (-z); +PI/2 looks left (women); -PI/2 looks right (men) */
  yaw: number;
  pitch: number;
}

interface Tween {
  from: Pose;
  to: Pose;
  /** start time in ms (performance.now) — progress is time-based, independent of frame rate */
  start: number;
  dur: number;
  onDone?: () => void;
}

/** Tuning values — adjusted during greybox testing. */
export const TUNING = {
  walkSpeed: 1.6, // m/s at full input
  wheelImpulse: 0.0045, // velocity added per wheel delta unit
  maxSpeed: 3.2,
  damping: 4.5, // higher = stops faster
  turnSpeedKeys: 1.6, // rad/s with arrow keys
  dragSensitivity: 0.0035, // rad per px
  pitchLimit: (25 * Math.PI) / 180,
  glanceMax: (6 * Math.PI) / 180,
  glanceDamping: 3,
  clickThresholdPx: 6,
};

/**
 * Mutable singleton. Rendering reads it every frame; React never re-renders on movement.
 */
export const walker = {
  x: 0,
  z: MALL.entranceZ as number,
  yaw: 0,
  pitch: 0,
  /** forward velocity (m/s, + is forward) */
  vel: 0,
  /** sideways velocity from keys */
  strafe: 0,
  glanceYaw: 0,
  glancePitch: 0,
  glanceTargetYaw: 0,
  glanceTargetPitch: 0,
  glancePaused: false,
  keys: new Set<string>(),
  /** walk pad on touch screens: -1 back, 0, 1 forward */
  pad: 0,
  tween: null as Tween | null,
};

export function getPose(): Pose {
  return { x: walker.x, z: walker.z, yaw: walker.yaw, pitch: walker.pitch };
}

export function setPose(p: Pose) {
  walker.x = p.x;
  walker.z = p.z;
  walker.yaw = p.yaw;
  walker.pitch = p.pitch;
  walker.vel = 0;
  walker.strafe = 0;
}

export function isMoving() {
  return Math.abs(walker.vel) > 0.15 || walker.tween !== null;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function shortestAngle(a: number, b: number) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function tweenTo(to: Pose, dur: number, onDone?: () => void) {
  walker.vel = 0;
  walker.strafe = 0;
  walker.tween = { from: getPose(), to, start: performance.now(), dur, onDone };
}

/** Keeps the walker inside the corridor. Clamping each axis separately makes the walker slide along walls. */
export function clampToWalkable(x: number, z: number) {
  return {
    x: Math.min(WALKABLE.maxX, Math.max(WALKABLE.minX, x)),
    z: Math.min(WALKABLE.maxZ, Math.max(WALKABLE.minZ, z)),
  };
}

export function stepWalker(dt: number) {
  dt = Math.min(dt, 0.05);

  if (walker.tween) {
    const tw = walker.tween;
    const t = Math.min(1, (performance.now() - tw.start) / (tw.dur * 1000));
    const k = ease(t);
    walker.x = tw.from.x + (tw.to.x - tw.from.x) * k;
    walker.z = tw.from.z + (tw.to.z - tw.from.z) * k;
    walker.yaw = tw.from.yaw + shortestAngle(tw.from.yaw, tw.to.yaw) * k;
    walker.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * k;
    walker.glanceYaw *= 0.9;
    walker.glancePitch *= 0.9;
    if (t >= 1) {
      // land exactly on the target pose
      walker.x = tw.to.x;
      walker.z = tw.to.z;
      walker.yaw = tw.to.yaw;
      walker.pitch = tw.to.pitch;
      walker.tween = null;
      tw.onDone?.();
    }
    return;
  }

  const k = walker.keys;
  let fwd = 0;
  let side = 0;
  if (k.has("KeyW") || k.has("ArrowUp")) fwd += 1;
  if (k.has("KeyS") || k.has("ArrowDown")) fwd -= 1;
  if (k.has("KeyD")) side += 1;
  if (k.has("KeyA")) side -= 1;
  if (k.has("ArrowLeft")) walker.yaw += TUNING.turnSpeedKeys * dt;
  if (k.has("ArrowRight")) walker.yaw -= TUNING.turnSpeedKeys * dt;
  fwd += walker.pad;

  if (fwd !== 0) walker.vel += (fwd * TUNING.walkSpeed - walker.vel) * Math.min(1, dt * 6);
  else walker.vel *= Math.exp(-TUNING.damping * dt);
  if (side !== 0) walker.strafe += (side * TUNING.walkSpeed * 0.8 - walker.strafe) * Math.min(1, dt * 6);
  else walker.strafe *= Math.exp(-TUNING.damping * dt);

  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
  if (Math.abs(walker.vel) < 0.002) walker.vel = 0;
  if (Math.abs(walker.strafe) < 0.002) walker.strafe = 0;

  // direction you face, flattened to the floor
  const fx = -Math.sin(walker.yaw);
  const fz = -Math.cos(walker.yaw);
  const rx = Math.cos(walker.yaw);
  const rz = -Math.sin(walker.yaw);
  const nx = walker.x + (fx * walker.vel + rx * walker.strafe) * dt;
  const nz = walker.z + (fz * walker.vel + rz * walker.strafe) * dt;
  const c = clampToWalkable(nx, nz);
  walker.x = c.x;
  walker.z = c.z;

  // glance: head gently follows the free cursor, unless paused (preview showing or dragging)
  const gy = walker.glancePaused ? walker.glanceYaw : walker.glanceTargetYaw;
  const gp = walker.glancePaused ? walker.glancePitch : walker.glanceTargetPitch;
  const a = 1 - Math.exp(-TUNING.glanceDamping * dt);
  walker.glanceYaw += (gy - walker.glanceYaw) * a;
  walker.glancePitch += (gp - walker.glancePitch) * a;
}

export function addWheel(deltaY: number) {
  if (walker.tween) return;
  // scroll up (negative deltaY) walks forward
  walker.vel += -deltaY * TUNING.wheelImpulse;
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
}

export function addLook(dx: number, dy: number) {
  if (walker.tween) return;
  walker.yaw -= dx * TUNING.dragSensitivity;
  walker.pitch = Math.max(
    -TUNING.pitchLimit,
    Math.min(TUNING.pitchLimit, walker.pitch - dy * TUNING.dragSensitivity),
  );
}
