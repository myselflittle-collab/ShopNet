import type { BlazerStyle, CatalogService, Colour, Product } from "./types";
import { gallery, type PhotoKey } from "./photos";

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


interface CollectionSeed {
  names: string[];
  photos: PhotoKey[];
  colour: string;
  fabric: string;
  fit: string;
  brand: string;
  basePrice: number;
  sizes?: string[];
  badge?: Product["badge"];
}

/**
 * Demo catalogue for the complete mall. Names, prices, stock and ratings are sample data.
 * Photography is category-matched where a verified Unsplash image is available; the live
 * commerce catalogue must later replace these demo records with real seller/product feeds.
 */
const COLLECTIONS: Record<string, CollectionSeed> = {
  "women-trousers": { names: ["Tailored Wide-Leg Trousers", "High-Waist Straight Pants", "Relaxed Linen Trousers", "Cropped Tailored Pants"], photos: ["womenTrousers", "blackWhitePants"], colour: "Navy & Tan", fabric: "Tailored blend", fit: "Straight fit", brand: "Aurelle", basePrice: 2999, badge: "Bestseller" },
  "women-tshirts": { names: ["Essential Crew-Neck T-shirt", "Soft Cotton Everyday Tee", "Relaxed White T-shirt", "Classic Jersey T-shirt"], photos: ["whiteTee"], colour: "Ivory", fabric: "Cotton jersey", fit: "Relaxed fit", brand: "Kora Atelier", basePrice: 799 },
  "women-shirts": { names: ["Classic White Shirt", "Oversized Cotton Shirt", "Relaxed Button-Down Shirt", "Everyday Poplin Shirt"], photos: ["whiteTee", "whiteWall"], colour: "Ivory", fabric: "Cotton poplin", fit: "Relaxed fit", brand: "Northbay Women", basePrice: 1499 },
  "women-dresses": { names: ["Floral Midi Dress", "Evening Occasion Dress", "Soft Drape Day Dress", "Modern Printed Dress"], photos: ["womenDress", "skirt"], colour: "Rose", fabric: "Crepe", fit: "Regular fit", brand: "Maison Kaya", basePrice: 3299, badge: "New" },
  "women-jeans": { names: ["Straight-Leg Denim Jeans", "Classic Blue Jeans", "Relaxed Everyday Denim", "High-Waist Denim"], photos: ["womenTrousers", "womenDress"], colour: "Denim", fabric: "Denim", fit: "Straight fit", brand: "Studio Vane", basePrice: 2199 },
  "women-ethnic": { names: ["Classic Sari", "Festive Draped Collection", "Traditional Occasion Wear", "Printed Ethnic Set"], photos: ["womenSari"], colour: "Blue", fabric: "Woven blend", fit: "Classic drape", brand: "Aurelle", basePrice: 3999, badge: "Bestseller" },
  "women-skirts": { names: ["Black Midi Skirt", "Printed Everyday Skirt", "A-Line Statement Skirt", "Pleated Midi Skirt"], photos: ["skirt", "womenDress"], colour: "Black", fabric: "Crepe", fit: "A-line fit", brand: "Maison Kaya", basePrice: 1899 },
  "women-jackets": { names: ["Modern Tailored Jacket", "Navy Everyday Jacket", "Relaxed Layering Jacket", "Classic Outerwear Jacket"], photos: ["navyTan", "beigeWalk", "blackSuit"], colour: "Navy & Tan", fabric: "Woven blend", fit: "Regular fit", brand: "Northbay Women", basePrice: 3599 },
  "women-innerwear": { names: ["Cotton Essentials Top", "Everyday Layering Tee", "Soft Lounge Top", "Comfort Base Layer"], photos: ["whiteTee"], colour: "Ivory", fabric: "Soft cotton", fit: "Comfort fit", brand: "Kora Atelier", basePrice: 699 },
  "women-shoes": { names: ["Canvas Everyday Sneakers", "Classic High Heels", "Evening Court Shoes", "Minimal Leather Pumps"], photos: ["heels", "formalShoes"], colour: "Brown", fabric: "Leather / textile", fit: "Standard fit", brand: "Studio Vane", basePrice: 2499, sizes: ["5", "6", "7", "8", "9", "10"] },
  "women-handbags": { names: ["Structured Leather Handbag", "Everyday Top-Handle Bag", "Compact Shoulder Bag", "Classic Mini Handbag"], photos: ["womenHandbag"], colour: "Rose", fabric: "Leather", fit: "One size", brand: "Maison Kaya", basePrice: 2999, sizes: ["One Size"] },
  "women-accessories": { names: ["Pearl Accent Accessories", "Gold Frame Eyewear", "Classic Fashion Hat", "Minimal Style Edit"], photos: ["blackPearls", "mensAccessories"], colour: "Brown", fabric: "Mixed materials", fit: "One size", brand: "Kora Atelier", basePrice: 999, sizes: ["One Size"] },
  "men-blazers": { names: ["Modern Tailored Blazer", "Classic Black Blazer", "Formal Suit Jacket", "Business Occasion Blazer"], photos: ["mensBlazer", "mensSuit"], colour: "Black", fabric: "Wool blend", fit: "Tailored fit", brand: "Northbay Men", basePrice: 4999, badge: "Bestseller" },
  "men-trousers": { names: ["Tailored Formal Trousers", "Modern Straight Pants", "Classic Suit Trousers", "Relaxed Smart Trousers"], photos: ["mensSuit", "womenTrousers"], colour: "Black", fabric: "Tailored blend", fit: "Straight fit", brand: "Aurelle", basePrice: 2499 },
  "men-tshirts": { names: ["Essential Crew-Neck Tee", "Classic Cotton T-shirt", "Relaxed Everyday Tee", "Minimal Jersey T-shirt"], photos: ["whiteTee"], colour: "Ivory", fabric: "Cotton jersey", fit: "Regular fit", brand: "Studio Vane", basePrice: 899 },
  "men-shirts": { names: ["Classic White Shirt", "Smart Casual Button-Down", "Business Oxford Shirt", "Everyday Cotton Shirt"], photos: ["mensBlazer", "whiteTee"], colour: "Ivory", fabric: "Cotton poplin", fit: "Regular fit", brand: "Northbay Men", basePrice: 1699 },
  "men-jeans": { names: ["Classic Denim Jeans", "Straight-Fit Blue Jeans", "Dark Wash Denim", "Relaxed Weekend Jeans"], photos: ["menDenim", "womenTrousers"], colour: "Denim", fabric: "Denim", fit: "Straight fit", brand: "Kora Atelier", basePrice: 2299 },
  "men-kurtas": { names: ["Classic Pink Kurta", "Festive Traditional Kurta", "Cotton Occasion Kurta", "Modern Ethnic Kurta"], photos: ["menKurta"], colour: "Rose", fabric: "Cotton blend", fit: "Regular fit", brand: "Aurelle", basePrice: 1999 },
  "men-jackets": { names: ["Denim Jacket", "Smart Casual Jacket", "Classic Layering Jacket", "Modern Everyday Outerwear"], photos: ["menDenim", "mensBlazer"], colour: "Denim", fabric: "Denim / cotton", fit: "Regular fit", brand: "Northbay Men", basePrice: 3299 },
  "men-innerwear": { names: ["Cotton Essentials Tee", "Everyday Base Layer", "Soft Cotton Undershirt", "Comfort Essential Top"], photos: ["whiteTee"], colour: "Ivory", fabric: "Cotton", fit: "Comfort fit", brand: "Kora Atelier", basePrice: 599 },
  "men-accessories": { names: ["Formal Accessories Set", "Classic Eyewear", "Minimal Style Accessories", "Everyday Grooming Edit"], photos: ["mensAccessories", "blackPearls"], colour: "Brown", fabric: "Mixed materials", fit: "One size", brand: "Studio Vane", basePrice: 1299, sizes: ["One Size"] },
  "men-shoes": { names: ["Classic Leather Shoes", "Formal Lace-Ups", "Everyday Trainers", "Smart Casual Footwear"], photos: ["formalShoes", "heels"], colour: "Brown", fabric: "Leather / textile", fit: "Standard fit", brand: "Northbay Men", basePrice: 2999, sizes: ["6", "7", "8", "9", "10", "11"] },
  "men-watches": { names: ["Classic Dress Watch", "Vintage Timepiece", "Minimal Everyday Watch", "Heritage Watch Edit"], photos: ["mensAccessories"], colour: "Brown", fabric: "Stainless steel / leather", fit: "One size", brand: "Aurelle", basePrice: 3499, sizes: ["One Size"] },
};

function buildCollection(sectionId: string, seed: CollectionSeed): Product[] {
  const seedNumber = Array.from(sectionId).reduce((n, ch) => n + ch.charCodeAt(0), 20261120);
  const R = rng(seedNumber);
  return seed.names.map((name, i) => {
    const price = Math.round((seed.basePrice * (0.82 + R() * 0.72)) / 100) * 100 - 1;
    const mrp = Math.round((price * (1.18 + R() * 0.42)) / 100) * 100 - 1;
    const photoKey = seed.photos[i % seed.photos.length];
    const altKey = seed.photos.length > 1 ? seed.photos[(i + 1) % seed.photos.length] : undefined;
    return {
      id: `${sectionId}-${String(i + 1).padStart(3, "0")}`,
      sectionId,
      name,
      brand: seed.brand,
      price,
      mrp,
      rating: Math.round((4.0 + R() * 0.9) * 10) / 10,
      reviews: Math.floor(12 + R() * 420),
      colours: [C[seed.colour]],
      sizes: seed.sizes ?? ALL_SIZES.filter(() => R() > 0.12),
      stock: 3 + Math.floor(R() * 35),
      fabric: seed.fabric,
      fit: seed.fit,
      style: "single",
      description: `${name} in ${seed.fabric.toLowerCase()}, designed with a ${seed.fit.toLowerCase()} silhouette.`,
      photos: gallery(photoKey, altKey),
      badge: i === 0 ? (seed.badge ?? "New") : i === 1 ? "Bestseller" : undefined,
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

