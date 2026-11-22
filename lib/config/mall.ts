/** ShopNet's fixed architectural dimensions, in metres. */
export const FT = 0.3048;

export const MALL = {
  width: 30 * FT, // 9.144 m total cross-section
  length: 126.626, // S-shaped centreline length
  ceiling: 4.2,
  bayDepth: 3.8,
  bayWidth: 4,
  walkwayWidth: 4,
  eyeHeight: 1.62,
  walkerRadius: 0.35,
  entranceS: 2,
  foyerEndS: 8,
  womenEndS: 59.313,
  plazaEndS: 69.313,
  menEndS: 120.626,
} as const;

export const HALF_W = MALL.width / 2;
/** Half of the 4 m clear walkway. */
export const BAY_FRONT_X = MALL.walkwayWidth / 2;
export const CORRIDOR_WIDTH = MALL.walkwayWidth;
export const STORE_FRONT_OFFSET = 2;
export const STORE_BACK_OFFSET = 5.8;
export const ATRIUM_EDGE_OFFSET = 3.344;
