import { pathFrameAt, pathOffsetAt } from "@/mall/navigation/path";

export type Gender = "women" | "men";
export type FixtureKind = "rack" | "shelves" | "table" | "cabinet";

export interface SectionDef {
  id: string;
  gender: Gender;
  slug: string;
  label: string;
  fixture: FixtureKind;
  /** Storefront frontage measured along the local path axis. */
  width: number;
  live: boolean;
}

export interface PlacedSection extends SectionDef {
  /** Centreline arc-length interval occupied by this bay. */
  s0: number;
  s1: number;
  sCenter: number;
  /** -1 = left of the walking direction (women); +1 = right (men). */
  side: -1 | 1;
  /** World position of the storefront line at its centre. */
  cx: number;
  cz: number;
  /** World yaw of the mall path at the bay centre. */
  yaw: number;
}

const women: SectionDef[] = [
  { id: "women-blazers", gender: "women", slug: "blazers", label: "Blazers", fixture: "rack", width: 4, live: true },
  { id: "women-trousers", gender: "women", slug: "trousers", label: "Trousers & Pants", fixture: "rack", width: 4, live: true },
  { id: "women-tshirts", gender: "women", slug: "t-shirts", label: "T-shirts", fixture: "table", width: 4, live: true },
  { id: "women-shirts", gender: "women", slug: "shirts", label: "Shirts", fixture: "rack", width: 4, live: true },
  { id: "women-dresses", gender: "women", slug: "dresses", label: "Dresses", fixture: "rack", width: 4, live: true },
  { id: "women-jeans", gender: "women", slug: "jeans", label: "Jeans", fixture: "shelves", width: 4, live: true },
  { id: "women-ethnic", gender: "women", slug: "ethnic-wear", label: "Ethnic Wear", fixture: "rack", width: 4, live: true },
  { id: "women-skirts", gender: "women", slug: "skirts", label: "Skirts", fixture: "rack", width: 4, live: true },
  { id: "women-jackets", gender: "women", slug: "jackets", label: "Jackets", fixture: "rack", width: 4, live: true },
  { id: "women-innerwear", gender: "women", slug: "innerwear", label: "Innerwear", fixture: "table", width: 4, live: true },
  { id: "women-shoes", gender: "women", slug: "shoes", label: "Shoes", fixture: "shelves", width: 4, live: true },
  { id: "women-handbags", gender: "women", slug: "handbags", label: "Handbags", fixture: "shelves", width: 4, live: true },
  { id: "women-accessories", gender: "women", slug: "accessories", label: "Accessories", fixture: "cabinet", width: 4, live: true },
];

const men: SectionDef[] = [
  { id: "men-blazers", gender: "men", slug: "blazers", label: "Blazers", fixture: "rack", width: 4, live: true },
  { id: "men-trousers", gender: "men", slug: "trousers", label: "Trousers & Pants", fixture: "rack", width: 4, live: true },
  { id: "men-tshirts", gender: "men", slug: "t-shirts", label: "T-shirts", fixture: "table", width: 4, live: true },
  { id: "men-shirts", gender: "men", slug: "shirts", label: "Shirts", fixture: "rack", width: 4, live: true },
  { id: "men-jeans", gender: "men", slug: "jeans", label: "Jeans", fixture: "shelves", width: 4, live: true },
  { id: "men-kurtas", gender: "men", slug: "kurtas", label: "Kurtas", fixture: "rack", width: 4, live: true },
  { id: "men-jackets", gender: "men", slug: "jackets", label: "Jackets", fixture: "rack", width: 4, live: true },
  { id: "men-innerwear", gender: "men", slug: "innerwear", label: "Innerwear", fixture: "table", width: 4, live: true },
  { id: "men-accessories", gender: "men", slug: "accessories", label: "Accessories", fixture: "cabinet", width: 4, live: true },
  { id: "men-shoes", gender: "men", slug: "shoes", label: "Shoes", fixture: "shelves", width: 8, live: true },
  { id: "men-watches", gender: "men", slug: "watches", label: "Watches", fixture: "cabinet", width: 8, live: true },
];

const WOMEN_RANGES: [number, number][] = [
  [9.9, 13.5], [13.7, 17.2], [17.4, 20.9], [21.0, 24.5], [24.7, 28.2],
  [28.4, 31.9], [32.1, 35.6], [35.7, 39.2], [39.4, 42.9], [43.1, 46.6],
  [46.8, 50.3], [50.4, 53.9], [54.1, 57.6],
];

const MEN_RANGES: [number, number][] = [
  [71.2, 74.7], [74.9, 78.4], [78.6, 82.1], [82.2, 85.7], [85.9, 89.4],
  [89.6, 93.1], [93.2, 96.7], [96.9, 100.4], [100.6, 104.1], [104.3, 111.3],
  [111.5, 118.6],
];

function place(list: SectionDef[], ranges: [number, number][], side: -1 | 1): PlacedSection[] {
  return list.map((section, index) => {
    const [s0, s1] = ranges[index];
    const sCenter = (s0 + s1) / 2;
    const frame = pathFrameAt(sCenter);
    const front = pathOffsetAt(sCenter, side * 2);
    return {
      ...section,
      s0,
      s1,
      sCenter,
      side,
      cx: front.x,
      cz: front.z,
      yaw: frame.yaw,
    };
  });
}

export const SECTIONS: PlacedSection[] = [
  ...place(women, WOMEN_RANGES, -1),
  ...place(men, MEN_RANGES, 1),
];

export const SECTION_BY_ID: Record<string, PlacedSection> = Object.fromEntries(
  SECTIONS.map((section) => [section.id, section]),
);

export function sectionByRoute(gender: string, slug: string): PlacedSection | undefined {
  return SECTIONS.find((section) => section.gender === gender && section.slug === slug);
}

export function sectionHref(section: SectionDef): string {
  return `/shop/${section.gender}/${section.slug}`;
}

/** A pose on the path centreline, looking directly toward this store's LCD. */
export function viewingPose(section: PlacedSection) {
  return {
    s: section.sCenter,
    yaw: -section.side * (Math.PI / 2),
    pitch: -0.05,
  };
}
