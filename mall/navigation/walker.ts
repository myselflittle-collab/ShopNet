import { PATH_LENGTH, pointAt } from "@/lib/config/path";

/**
 * The customer's body moves only along the S-shaped centreline (path position `s`).
 * The head turns independently: world yaw = path heading + headYaw.
 * headYaw is a continuous (unwrapped) angle, so full turns never snap at 180° or 360°,
 * and it is never pulled back automatically — the customer keeps looking where they chose.
 */
export interface Pose {
  s: number;
  headYaw: number;
  pitch: number;
}

export const TUNING = {
  /** keyboard / on-screen pad walking speed, m/s */
  walkSpeed: 2.0,
  /** with Shift held */
  fastSpeed: 3.2,
  /** velocity added per pixel of wheel / trackpad scroll */
  wheelImpulse: 0.014,
  /** velocity added per pixel of vertical finger swipe (swipe UP = forward, like scrolling down) */
  swipeImpulse: 0.03,
  maxSpeed: 3.2,
  /** coasting decay after scroll input stops, 1/s */
  damping: 2.4,
  turnSpeedKeys: 1.9,
  /** radians per pixel of mouse / trackpad movement (raw, unsmoothed) */
  mouseSensitivity: 0.0026,
  /** radians per pixel of horizontal finger swipe */
  touchSensitivity: 0.0058,
  pitchLimit: (55 * Math.PI) / 180,
} as const;

export const START_S = 2.0;
export const START_HEAD_YAW = (20 * Math.PI) / 180;
const S_MIN = 0.6;
const S_MAX = PATH_LENGTH - 0.8;

export const walker = {
  s: START_S,
  vel: 0,
  headYaw: START_HEAD_YAW,
  pitch: 0,
  keys: new Set<string>(),
  /** -1…1 from the on-screen walk pad */
  pad: 0,
  /** limits used by the tutorial (the body may only move between them) */
  minS: S_MIN,
  maxS: S_MAX,
  /** while true the body does not move at all (tutorial look steps) */
  hold: false,
  /** +1 when the customer faces along the path (toward the exit), -1 when facing back toward the entrance */
  facing: 1,
  /** distance walked toward / away from the direction the customer is looking (for the tutorial) */
  walkedForward: 0,
  walkedBack: 0,
  /** total leftward / rightward head rotation since the last reset (radians, for the tutorial) */
  turnedLeft: 0,
  turnedRight: 0,
};

export function getPose(): Pose {
  return { s: walker.s, headYaw: walker.headYaw, pitch: walker.pitch };
}

export function setPose(p: Pose) {
  walker.s = Math.min(S_MAX, Math.max(S_MIN, p.s));
  walker.headYaw = p.headYaw;
  walker.pitch = p.pitch;
  walker.vel = 0;
  walker.pad = 0;
}

export function resetLimits() {
  walker.minS = S_MIN;
  walker.maxS = S_MAX;
  walker.hold = false;
}

const clampPitch = (p: number) => Math.max(-TUNING.pitchLimit, Math.min(TUNING.pitchLimit, p));

/** World camera yaw (three.js: 0 looks toward -Z). */
export function worldYaw() {
  return pointAt(walker.s).yaw + walker.headYaw;
}

export function stepWalker(dt: number) {
  dt = Math.min(dt, 0.1);
  const k = walker.keys;
  let fwd = 0;
  if (k.has("KeyW") || k.has("ArrowUp")) fwd += 1;
  if (k.has("KeyS") || k.has("ArrowDown")) fwd -= 1;
  if (k.has("KeyA") || k.has("ArrowLeft")) turn(TUNING.turnSpeedKeys * dt);
  if (k.has("KeyD") || k.has("ArrowRight")) turn(-TUNING.turnSpeedKeys * dt);
  fwd += walker.pad;
  fwd = Math.max(-1, Math.min(1, fwd)) * updateFacing();
  const speed = k.has("ShiftLeft") || k.has("ShiftRight") ? TUNING.fastSpeed : TUNING.walkSpeed;

  if (fwd !== 0) walker.vel += (fwd * speed - walker.vel) * Math.min(1, dt * 6);
  else walker.vel *= Math.exp(-TUNING.damping * dt);
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
  if (Math.abs(walker.vel) < 0.01) walker.vel = 0;
  if (walker.hold) walker.vel = 0;

  const ns = walker.s + walker.vel * dt;
  const clamped = Math.min(walker.maxS, Math.max(walker.minS, ns));
  if (clamped !== ns) walker.vel = 0;
  const moved = (clamped - walker.s) * walker.facing;
  if (moved > 0) walker.walkedForward += moved;
  else walker.walkedBack -= moved;
  walker.s = clamped;
}

/**
 * "Forward" always means the way the customer is looking along the path. Facing the exit, forward
 * increases s; after turning round toward the entrance, forward decreases s. A small dead zone
 * around looking sideways (±80°…±100°) keeps the last direction so it never flickers.
 */
function updateFacing() {
  const c = Math.cos(walker.headYaw);
  if (c > 0.17) walker.facing = 1;
  else if (c < -0.17) walker.facing = -1;
  return walker.facing;
}

/** Positive = turn left. */
function turn(rad: number) {
  walker.headYaw += rad;
  if (rad > 0) walker.turnedLeft += rad;
  else walker.turnedRight -= rad;
}

/**
 * Scroll direction as tested on the owner's laptop: the gesture he calls "scroll down" arrives
 * with a negative deltaY, so negative deltaY walks forward (the way the customer is looking)
 * and positive deltaY walks back.
 */
export function addWheel(deltaY: number) {
  if (!Number.isFinite(deltaY) || walker.hold || deltaY === 0) return;
  const push = -deltaY * updateFacing();
  // Reversing the scroll reverses at once: never keep coasting the old way after the wheel turns back.
  if (walker.vel !== 0 && Math.sign(push) !== Math.sign(walker.vel)) walker.vel = 0;
  walker.vel += push * TUNING.wheelImpulse;
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
}

/** Finger moving UP the screen (negative dy) walks forward. */
export function addSwipeWalk(dy: number) {
  if (!Number.isFinite(dy) || walker.hold || dy === 0) return;
  const push = -dy * updateFacing();
  if (walker.vel !== 0 && Math.sign(push) !== Math.sign(walker.vel)) walker.vel = 0;
  walker.vel += push * TUNING.swipeImpulse;
  walker.vel = Math.max(-TUNING.maxSpeed, Math.min(TUNING.maxSpeed, walker.vel));
}

/** Mouse / trackpad movement: moving right turns right, moving up looks up. Raw, no smoothing. */
export function addMouseLook(dx: number, dy: number) {
  turn(-dx * TUNING.mouseSensitivity);
  walker.pitch = clampPitch(walker.pitch - dy * TUNING.mouseSensitivity);
}

/** Touch: swipe LEFT looks LEFT, swipe RIGHT looks RIGHT. */
export function addSwipeLook(dx: number) {
  turn(-dx * TUNING.touchSensitivity);
}
