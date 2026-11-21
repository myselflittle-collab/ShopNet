/**
 * ShopNet mall dimensions in metres.
 * The 30 ft width is confirmed; the gentle centreline bend is a visual/navigation design parameter.
 */
export const FT = 0.3048;

export const MALL = {
  width: 30 * FT,
  length: 56,
  ceiling: 4.2,
  ceilingRise: 1.55,
  curveAmplitude: 0.72,
  bayDepth: 2.8,
  bayWidth: 4,
  eyeHeight: 1.62,
  walkerRadius: 0.35,
  bayStartZ: 0,
  entranceZ: 3.5,
} as const;

export const HALF_W = MALL.width / 2;
export const BAY_FRONT_X = HALF_W - MALL.bayDepth;
export const CORRIDOR_WIDTH = BAY_FRONT_X * 2;

/**
 * Smooth, shallow S-curve for the complete mall.
 * It begins and ends on the original centre axis, with a maximum lateral shift under 0.75 m.
 */
export function pathCenterX(z: number): number {
  const start = MALL.entranceZ + 3;
  const end = -MALL.length - 3;
  const t = Math.max(0, Math.min(1, (start - z) / (start - end)));
  return MALL.curveAmplitude * Math.sin(Math.PI * t);
}

/** Heading of the centreline while walking toward the far end (-Z). */
export function pathYawAt(z: number): number {
  const epsilon = 0.12;
  const derivative = (pathCenterX(z + epsilon) - pathCenterX(z - epsilon)) / (2 * epsilon);
  return Math.atan(derivative);
}

/** Centreline-only walking bounds. Lateral movement is intentionally constrained. */
export const WALKABLE = {
  minZ: -MALL.length + MALL.walkerRadius + 0.4,
  maxZ: MALL.entranceZ + 2.2,
} as const;

export const STEP_IN = 0.9;
