/** ShopNet Layout 2 / Option 3 dimensions. All distances are metres. */
export const FT = 0.3048;

export const MALL = {
  width: 30 * FT, // 9.144 m total footprint cross-section
  length: 126.62536001725353,
  ceiling: 4.2,
  walkwayWidth: 4,
  bayDepth: 3.8,
  innerAtriumStrip: 1.344,
  eyeHeight: 1.62,
  walkerRadius: 0.35,
  entranceS: 2,
  foyerEndS: 8,
  womenEndS: 59.313,
  plazaEndS: 69.313,
  menEndS: 120.626,
  exitEndS: 126.62536001725353,
  centrelineRadius: 14,
  lobeDegrees: 210,
  clothoidLength: 5,
  plazaLength: 10,
} as const;

export const HALF_W = MALL.width / 2;
export const WALKWAY_HALF = MALL.walkwayWidth / 2;
export const STORE_FRONT_OFFSET = WALKWAY_HALF;
export const STORE_BACK_OFFSET = WALKWAY_HALF + MALL.bayDepth;
export const ATRIUM_EDGE_OFFSET = WALKWAY_HALF + MALL.innerAtriumStrip;
export const CORRIDOR_WIDTH = MALL.walkwayWidth;
