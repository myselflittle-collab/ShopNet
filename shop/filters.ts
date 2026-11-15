import type { BlazerStyle, Product } from "@/lib/catalog/types";

export type PriceBand = "all" | "u4" | "4to7" | "o7";
export type SortKey = "featured" | "priceAsc" | "priceDesc" | "rating" | "discount";

export interface FilterState {
  sizes: string[];
  colours: string[];
  brands: string[];
  styles: BlazerStyle[];
  price: PriceBand;
  minRating: number;
  inStockOnly: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  sizes: [],
  colours: [],
  brands: [],
  styles: [],
  price: "all",
  minRating: 0,
  inStockOnly: false,
};

export const PRICE_BANDS: { key: PriceBand; label: string }[] = [
  { key: "all", label: "Any price" },
  { key: "u4", label: "Under ₹4,000" },
  { key: "4to7", label: "₹4,000 – ₹7,000" },
  { key: "o7", label: "Over ₹7,000" },
];

export const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "priceAsc", label: "Price: low to high" },
  { key: "priceDesc", label: "Price: high to low" },
  { key: "rating", label: "Customer rating" },
  { key: "discount", label: "Biggest discount" },
];

export const discountPct = (p: Product) => Math.round((1 - p.price / p.mrp) * 100);

function inBand(price: number, band: PriceBand) {
  if (band === "u4") return price < 4000;
  if (band === "4to7") return price >= 4000 && price <= 7000;
  if (band === "o7") return price > 7000;
  return true;
}

export function applyFilters(list: Product[], f: FilterState, sort: SortKey): Product[] {
  const out = list.filter(
    (p) =>
      (f.sizes.length === 0 || f.sizes.some((s) => p.sizes.includes(s))) &&
      (f.colours.length === 0 || p.colours.some((c) => f.colours.includes(c.name))) &&
      (f.brands.length === 0 || f.brands.includes(p.brand)) &&
      (f.styles.length === 0 || f.styles.includes(p.style)) &&
      inBand(p.price, f.price) &&
      p.rating >= f.minRating &&
      (!f.inStockOnly || p.stock > 0),
  );
  const sorted = out.slice();
  if (sort === "priceAsc") sorted.sort((a, b) => a.price - b.price);
  else if (sort === "priceDesc") sorted.sort((a, b) => b.price - a.price);
  else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  else if (sort === "discount") sorted.sort((a, b) => discountPct(b) - discountPct(a));
  return sorted;
}

export function activeCount(f: FilterState) {
  return (
    f.sizes.length +
    f.colours.length +
    f.brands.length +
    f.styles.length +
    (f.price !== "all" ? 1 : 0) +
    (f.minRating > 0 ? 1 : 0) +
    (f.inStockOnly ? 1 : 0)
  );
}
