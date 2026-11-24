/**
 * Mall dimensions in metres (locked Blueprint 0.7).
 *
 * 30-ft architectural cross-section, measured across the walking path:
 *   atrium edge 1.344 + walkway 4.000 + storefront zone 3.800 = 9.144 m
 * Women's boutiques sit on the customer's LEFT in the first lobe, men's on the RIGHT in the second.
 * The opposite side of the walkway is always the atrium edge, never another store.
 */
export const FT = 0.3048;

export const MALL = {
  width: 30 * FT, // 9.144 m
  walkway: 4.0,
  atriumEdge: 1.344,
  storeDepth: 3.8,
  ceiling: 4.2,
  eyeHeight: 1.62,
  /** boutique frontage between divider fins */
  bayWidth: 4,
  fin: 0.2,
  /** P2.8 portal: 2.8 m clear opening in a 4 m frontage (0.6 m returns); 8 m stores get 5.6 m */
  portalOpening: 2.8,
  portalOpeningWide: 5.6,
  portalHeight: 3.0,
  /** end-of-row pilaster beside the first and last store of each row */
  endPortal: 0.6,
} as const;

export const HALF_WALK = MALL.walkway / 2;
/** lateral offset of the storefront line and of the back wall */
export const FRONT_D = HALF_WALK;
export const BACK_D = HALF_WALK + MALL.storeDepth;
/** lateral offset of the atrium core wall on the inner side */
export const CORE_D = HALF_WALK + MALL.atriumEdge;
