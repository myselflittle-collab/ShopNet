/**
 * Mall dimensions in metres.
 * Only MALL_WIDTH (30 ft) is confirmed. Everything else is provisional and
 * will be reviewed after walking the greybox.
 */
export const FT = 0.3048;

export const MALL = {
  width: 30 * FT, // 9.144 m — confirmed
  length: 56, // provisional
  ceiling: 4.2, // provisional
  bayDepth: 2.8, // provisional
  bayWidth: 4, // provisional, standard bay frontage
  eyeHeight: 1.62,
  walkerRadius: 0.35,
  /** z where the first bay starts; the customer enters at z > 0 walking toward -z */
  bayStartZ: 0,
  entranceZ: 3.5,
} as const;

export const HALF_W = MALL.width / 2;
/** x of the front edge of the bays (the corridor's sides) */
export const BAY_FRONT_X = HALF_W - MALL.bayDepth;
export const CORRIDOR_WIDTH = BAY_FRONT_X * 2;

/** Walkable rectangle for the walker's centre (corridor + entrance), already inset by the walker radius. */
export const WALKABLE = {
  minX: -BAY_FRONT_X + MALL.walkerRadius,
  maxX: BAY_FRONT_X - MALL.walkerRadius,
  minZ: -MALL.length + MALL.walkerRadius + 0.4,
  maxZ: MALL.entranceZ + 2.2,
} as const;

/** Small step-in zone in front of each bay so customers can get closer to a display. */
export const STEP_IN = 0.9;
