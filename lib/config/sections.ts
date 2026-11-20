import { HALF_W, MALL } from "./mall";

export type Gender = "women" | "men";
export type FixtureKind = "rack" | "shelves" | "table" | "cabinet";

export interface SectionDef {
  id: string;
  gender: Gender;
  slug: string;
  label: string;
  fixture: FixtureKind;
  /** bay frontage in metres */
  width: number;
  /** true when the 2D shop for this section exists */
  live: boolean;
}

export interface PlacedSection extends SectionDef {
  /** world centre of the bay opening (on the corridor edge) */
  cx: number;
  cz: number;
  /** bay spans z from z0 to z1 (z1 < z0, walking toward -z) */
  z0: number;
  z1: number;
  /** +1 for the right (men), -1 for the left (women) */
  side: 1 | -1;
}

const W = MALL.bayWidth;

const women: SectionDef[] = [
  { id: "women-blazers", gender: "women", slug: "blazers", label: "Blazers", fixture: "rack", width: W, live: true },
  { id: "women-trousers", gender: "women", slug: "trousers", label: "Trousers & Pants", fixture: "rack", width: W, live: true },
  { id: "women-tshirts", gender: "women", slug: "t-shirts", label: "T-shirts", fixture: "table", width: W, live: true },
  { id: "women-shirts", gender: "women", slug: "shirts", label: "Shirts", fixture: "rack", width: W, live: true },
  { id: "women-dresses", gender: "women", slug: "dresses", label: "Dresses", fixture: "rack", width: W, live: true },
  { id: "women-jeans", gender: "women", slug: "jeans", label: "Jeans", fixture: "shelves", width: W, live: true },
  { id: "women-ethnic", gender: "women", slug: "ethnic-wear", label: "Ethnic Wear", fixture: "rack", width: W, live: true },
  { id: "women-skirts", gender: "women", slug: "skirts", label: "Skirts", fixture: "rack", width: W, live: true },
  { id: "women-jackets", gender: "women", slug: "jackets", label: "Jackets", fixture: "rack", width: W, live: true },
  { id: "women-innerwear", gender: "women", slug: "innerwear", label: "Innerwear", fixture: "table", width: W, live: true },
  { id: "women-shoes", gender: "women", slug: "shoes", label: "Shoes", fixture: "shelves", width: W, live: true },
  { id: "women-handbags", gender: "women", slug: "handbags", label: "Handbags", fixture: "shelves", width: W, live: true },
  { id: "women-accessories", gender: "women", slug: "accessories", label: "Accessories", fixture: "cabinet", width: W, live: true },
];

const men: SectionDef[] = [
  { id: "men-blazers", gender: "men", slug: "blazers", label: "Blazers", fixture: "rack", width: W, live: true },
  { id: "men-trousers", gender: "men", slug: "trousers", label: "Trousers & Pants", fixture: "rack", width: W, live: true },
  { id: "men-tshirts", gender: "men", slug: "t-shirts", label: "T-shirts", fixture: "table", width: W, live: true },
  { id: "men-shirts", gender: "men", slug: "shirts", label: "Shirts", fixture: "rack", width: W, live: true },
  { id: "men-jeans", gender: "men", slug: "jeans", label: "Jeans", fixture: "shelves", width: W, live: true },
  { id: "men-kurtas", gender: "men", slug: "kurtas", label: "Kurtas", fixture: "rack", width: W, live: true },
  { id: "men-jackets", gender: "men", slug: "jackets", label: "Jackets", fixture: "rack", width: W, live: true },
  { id: "men-innerwear", gender: "men", slug: "innerwear", label: "Innerwear", fixture: "table", width: W, live: true },
  { id: "men-accessories", gender: "men", slug: "accessories", label: "Accessories", fixture: "cabinet", width: W, live: true },
  { id: "men-shoes", gender: "men", slug: "shoes", label: "Shoes", fixture: "shelves", width: W * 2, live: true },
  { id: "men-watches", gender: "men", slug: "watches", label: "Watches", fixture: "cabinet", width: W * 2, live: true },
];

function place(list: SectionDef[], side: 1 | -1): PlacedSection[] {
  let z: number = MALL.bayStartZ;
  return list.map((s) => {
    const z0 = z;
    const z1 = z - s.width;
    z = z1;
    return { ...s, z0, z1, cz: (z0 + z1) / 2, cx: side * (HALF_W - MALL.bayDepth), side };
  });
}

export const SECTIONS: PlacedSection[] = [...place(women, -1), ...place(men, 1)];

export const SECTION_BY_ID: Record<string, PlacedSection> = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
);

export function sectionByRoute(gender: string, slug: string): PlacedSection | undefined {
  return SECTIONS.find((s) => s.gender === gender && s.slug === slug);
}

export function sectionHref(s: SectionDef): string {
  return `/shop/${s.gender}/${s.slug}`;
}

/** Where the camera stands to look straight into a bay (used for the open animation and deep links). */
export function viewingPose(s: PlacedSection) {
  const standX = s.side * (HALF_W - MALL.bayDepth - 1.1);
  // yaw 0 looks toward -z; looking toward +x (right) is yaw -PI/2, toward -x (left) is +PI/2
  const yaw = s.side === 1 ? -Math.PI / 2 : Math.PI / 2;
  return { x: standX, z: s.cz, yaw, pitch: -0.05 };
}
