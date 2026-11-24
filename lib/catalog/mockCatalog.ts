import type { BlazerStyle, CatalogService, Colour, Product } from "./types";
import { gallery } from "./photos";
import { COLLECTIONS, COLOURS, itemPhotos, type Collection } from "./collections";

/** Deterministic pseudo-random so mock prices and ratings are identical on server and client. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Colours exactly as they appear in the product photographs. */
export const ALL_COLOURS: Colour[] = [
  { name: "Sand", hex: "#CBB497" },
  { name: "Camel", hex: "#B89772" },
  { name: "Ivory", hex: "#ECE8E0" },
  { name: "Black", hex: "#1E1E22" },
  { name: "Forest Green", hex: "#3F5B45" },
  { name: "Black & White Stripe", hex: "#6B6B6B" },
  { name: "Tangerine", hex: "#D9692F" },
  { name: "Navy & Tan", hex: "#26324D" },
  { name: "Blue", hex: "#5A7897" },
  { name: "Brown", hex: "#74533F" },
  { name: "Rose", hex: "#C78F91" },
  { name: "Denim", hex: "#385B83" },
];
for (const c of Object.values(COLOURS)) if (!ALL_COLOURS.some((x) => x.name === c.name)) ALL_COLOURS.push(c);
const C = Object.fromEntries(ALL_COLOURS.map((c) => [c.name, c])) as Record<string, Colour>;

export const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

interface Def {
  name: string;
  colour: string;
  style: BlazerStyle;
  fabric: string;
  fit: string;
  brand: string;
  photos: ReturnType<typeof gallery>;
  badge?: Product["badge"];
  blurb: string;
}

const DEFS: Def[] = [
  { name: "Sand Oversized Linen Blazer", colour: "Sand", style: "longline", fabric: "Linen", fit: "Relaxed fit", brand: "Maison Kaya", photos: gallery("beigeWalk", undefined, { fx: 0.5, fy: 0.35 }), badge: "Bestseller", blurb: "An easy, slightly oversized cut that works over shorts or wide trousers." },
  { name: "Camel Tailored Blazer", colour: "Camel", style: "single", fabric: "Wool blend", fit: "Tailored fit", brand: "Aurelle", photos: gallery("beigeLeaves", undefined, { fx: 0.5, fy: 0.4 }), badge: "New", blurb: "A clean single-breasted silhouette in a warm camel tone." },
  { name: "Ivory Structured Blazer", colour: "Ivory", style: "single", fabric: "Crepe", fit: "Structured fit", brand: "Studio Vane", photos: gallery("whiteWall", undefined, { fx: 0.5, fy: 0.4 }), blurb: "Crisp ivory crepe with sharp shoulders and a nipped waist." },
  { name: "Black Single-Breasted Blazer", colour: "Black", style: "single", fabric: "Wool blend", fit: "Tailored fit", brand: "Northbay Women", photos: gallery("blackWhitePants", "blackWhitePants2", { fx: 0.5, fy: 0.35 }), badge: "Bestseller", blurb: "The everyday black blazer, cut to pair with light trousers." },
  { name: "Forest Green Blazer", colour: "Forest Green", style: "single", fabric: "Wool blend", fit: "Tailored fit", brand: "Kora Atelier", photos: gallery("green", undefined, { fx: 0.5, fy: 0.45 }), badge: "Limited", blurb: "A deep forest green that reads polished day or night." },
  { name: "Monochrome Striped Blazer", colour: "Black & White Stripe", style: "single", fabric: "Cotton twill", fit: "Relaxed fit", brand: "Studio Vane", photos: gallery("striped", undefined, { fx: 0.5, fy: 0.55 }), blurb: "Bold black-and-white stripes in a soft, unstructured cut." },
  { name: "Black Wool Blazer", colour: "Black", style: "single", fabric: "Wool", fit: "Tailored fit", brand: "Aurelle", photos: gallery("blackBrownHair", undefined, { fx: 0.5, fy: 0.5 }), blurb: "Fine wool with a smooth hand and a fully lined body." },
  { name: "Black Relaxed Blazer", colour: "Black", style: "longline", fabric: "Crepe", fit: "Relaxed fit", brand: "Maison Kaya", photos: gallery("blackChair", undefined, { fx: 0.5, fy: 0.4 }), blurb: "A longer, relaxed blazer that drapes easily when seated." },
  { name: "Black Evening Blazer", colour: "Black", style: "single", fabric: "Crepe", fit: "Structured fit", brand: "Kora Atelier", photos: gallery("blackPearls", undefined, { fx: 0.5, fy: 0.55 }), badge: "New", blurb: "A sleek evening blazer designed to frame statement jewellery." },
  { name: "Black Workwear Blazer", colour: "Black", style: "single", fabric: "Wool blend", fit: "Tailored fit", brand: "Northbay Women", photos: gallery("blackLaptop", undefined, { fx: 0.5, fy: 0.45 }), blurb: "A comfortable office blazer with room to move." },
  { name: "Tangerine Suit Blazer", colour: "Tangerine", style: "single", fabric: "Wool blend", fit: "Tailored fit", brand: "Aurelle", photos: gallery("orange", undefined, { fx: 0.5, fy: 0.5 }), badge: "Limited", blurb: "A confident tangerine suit jacket with matching trousers available." },
  { name: "Navy & Tan Tailored Jacket", colour: "Navy & Tan", style: "single", fabric: "Wool blend", fit: "Tailored fit", brand: "Northbay Women", photos: gallery("navyTan", undefined, { fx: 0.5, fy: 0.5 }), blurb: "Navy tailoring with tan accents for a quietly different look." },
  { name: "Black Suit Blazer", colour: "Black", style: "longline", fabric: "Wool", fit: "Structured fit", brand: "Maison Kaya", photos: gallery("blackSuit", undefined, { fx: 0.5, fy: 0.4 }), blurb: "A long, sharp suit blazer that anchors a full black suit." },
];

function buildWomenBlazers(): Product[] {
  const R = rng(20261115);
  return DEFS.map((d, i) => {
    const price = Math.round((2799 + R() * 8800) / 100) * 100 - 1;
    const mrp = Math.round((price * (1.2 + R() * 0.45)) / 100) * 100 - 1;
    const sizes = ALL_SIZES.filter(() => R() > 0.15);
    return {
      id: `wb-${String(i + 1).padStart(3, "0")}`,
      sectionId: "women-blazers",
      name: d.name,
      brand: d.brand,
      price,
      mrp,
      rating: Math.round((3.8 + R() * 1.15) * 10) / 10,
      reviews: Math.floor(18 + R() * 620),
      colours: [C[d.colour]],
      sizes: sizes.length ? sizes : ["M"],
      stock: i === 7 ? 0 : 2 + Math.floor(R() * 38),
      fabric: d.fabric,
      fit: d.fit,
      style: d.style,
      description: `${d.blurb} ${d.fabric}, ${d.fit.toLowerCase()}, notch lapels and a fully lined body.`,
      photos: d.photos,
      badge: d.badge,
    };
  });
}


function buildCollection(sectionId: string, seed: Collection): Product[] {
  const seedNumber = Array.from(sectionId).reduce((n, ch) => n + ch.charCodeAt(0), 20261124);
  const R = rng(seedNumber);
  return seed.items.map((it, i) => {
    const price = Math.round((seed.basePrice * (0.8 + R() * 0.75)) / 100) * 100 - 1;
    const mrp = Math.round((price * (1.18 + R() * 0.42)) / 100) * 100 - 1;
    const sizes = seed.sizes ?? ALL_SIZES.filter(() => R() > 0.12);
    const fabric = it.fabric ?? seed.fabric;
    return {
      id: `${sectionId}-${String(i + 1).padStart(3, "0")}`,
      sectionId,
      name: it.name,
      brand: seed.brand,
      price,
      mrp,
      rating: Math.round((4.0 + R() * 0.9) * 10) / 10,
      reviews: Math.floor(12 + R() * 420),
      colours: [it.colour],
      sizes: sizes.length ? sizes : ["M"],
      stock: 3 + Math.floor(R() * 35),
      fabric,
      fit: seed.fit,
      style: "single",
      description: `${seed.blurb} ${fabric}, ${seed.fit.toLowerCase()}.`,
      photos: itemPhotos(it),
      badge: i === 0 ? "New" : i === 2 ? "Bestseller" : undefined,
    };
  });
}

const DATA: Record<string, Product[]> = {
  "women-blazers": buildWomenBlazers(),
  ...Object.fromEntries(Object.entries(COLLECTIONS).map(([id, seed]) => [id, buildCollection(id, seed)])),
};

export const catalog: CatalogService = {
  listBySection: (sectionId) => DATA[sectionId] ?? [],
  previewBySection: (sectionId, n = 4) => {
    const list = DATA[sectionId] ?? [];
    // a varied preview: best-rated in-stock item of each colour first
    const seen = new Set<string>();
    const out: Product[] = [];
    for (const p of [...list].filter((p) => p.stock > 0).sort((a, b) => b.rating - a.rating)) {
      if (seen.has(p.colours[0].name)) continue;
      seen.add(p.colours[0].name);
      out.push(p);
      if (out.length === n) break;
    }
    return out;
  },
  byId: (id) => Object.values(DATA).flat().find((p) => p.id === id),
};

/** Distinct garment colours of a section, used to dress the 3D rail with the same collection. */
export function sectionColours(sectionId: string): string[] {
  return Array.from(new Set(catalog.listBySection(sectionId).map((p) => p.colours[0].hex)));
}

