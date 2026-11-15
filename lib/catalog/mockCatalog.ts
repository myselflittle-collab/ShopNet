import type { BlazerStyle, CatalogService, Colour, Product } from "./types";

/** Deterministic pseudo-random so mock data is identical on server and client. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLOURS: Colour[] = [
  { name: "Ivory", hex: "#EDE6D8" },
  { name: "Camel", hex: "#B98B5E" },
  { name: "Black", hex: "#1E1E22" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Charcoal", hex: "#3D3F45" },
  { name: "Blush", hex: "#D9A9A0" },
  { name: "Olive", hex: "#5F6146" },
  { name: "Burgundy", hex: "#6B2533" },
  { name: "Sage", hex: "#9AA88F" },
  { name: "Powder Blue", hex: "#A9BCD0" },
];

const BRANDS = ["Maison Kaya", "Aurelle", "Studio Vane", "Northbay Women", "Kora Atelier"];
const FABRICS = ["Wool blend", "Linen", "Crepe", "Tweed", "Cotton twill", "Velvet"];
const STYLES: { style: BlazerStyle; name: string; fit: string }[] = [
  { style: "single", name: "Single-Breasted Blazer", fit: "Tailored fit" },
  { style: "double", name: "Double-Breasted Blazer", fit: "Structured fit" },
  { style: "cropped", name: "Cropped Blazer", fit: "Boxy fit" },
  { style: "longline", name: "Longline Blazer", fit: "Relaxed fit" },
];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

function buildWomenBlazers(): Product[] {
  const R = rng(20261115);
  const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];
  const out: Product[] = [];
  for (let i = 0; i < 24; i++) {
    const st = STYLES[i % STYLES.length];
    const fabric = pick(FABRICS);
    const main = COLOURS[(i * 3) % COLOURS.length];
    const nExtra = Math.floor(R() * 3);
    const offset = 1 + Math.floor(R() * (COLOURS.length - 1));
    const extra = Array.from({ length: nExtra }, (_, k) => COLOURS[(i * 3 + offset + k * 4) % COLOURS.length]).filter(
      (c, k, arr) => c !== main && arr.indexOf(c) === k,
    );
    const price = Math.round((2499 + R() * 9500) / 100) * 100 - 1;
    const mrp = Math.round((price * (1.2 + R() * 0.5)) / 100) * 100 - 1;
    const sizes = SIZES.filter(() => R() > 0.18);
    out.push({
      id: `wb-${String(i + 1).padStart(3, "0")}`,
      sectionId: "women-blazers",
      name: `${main.name} ${fabric} ${st.name}`,
      brand: pick(BRANDS),
      price,
      mrp,
      rating: Math.round((3.6 + R() * 1.35) * 10) / 10,
      reviews: Math.floor(12 + R() * 640),
      colours: [main, ...extra],
      sizes: sizes.length ? sizes : ["M"],
      stock: R() < 0.1 ? 0 : 1 + Math.floor(R() * 40),
      fabric,
      fit: st.fit,
      style: st.style,
      description: `A ${st.fit.toLowerCase()} ${st.name.toLowerCase()} in ${fabric.toLowerCase()}, with notch lapels, fully lined and finished with horn-effect buttons.`,
      badge: i % 7 === 0 ? "New" : i % 5 === 0 ? "Bestseller" : i % 11 === 0 ? "Limited" : undefined,
    });
  }
  return out;
}

const DATA: Record<string, Product[]> = {
  "women-blazers": buildWomenBlazers(),
};

export const catalog: CatalogService = {
  listBySection: (sectionId) => DATA[sectionId] ?? [],
  previewBySection: (sectionId, n = 4) => {
    const list = DATA[sectionId] ?? [];
    return [...list].filter((p) => p.stock > 0).sort((a, b) => b.rating - a.rating).slice(0, n);
  },
};

export const ALL_COLOURS = COLOURS;
export const ALL_SIZES = SIZES;
