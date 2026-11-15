export interface Colour {
  name: string;
  hex: string;
}

export type BlazerStyle = "single" | "double" | "cropped" | "longline";

export interface ProductPhoto {
  /** Unsplash photo id, e.g. "photo-1559127452-829071a09516" */
  id: string;
  alt: string;
  /** "look" = full photo, "detail" = close crop of the same photo, "alt" = another photo of the same garment */
  kind: "look" | "detail" | "alt";
  /** focal point for crops (0–1) */
  fx?: number;
  fy?: number;
  credit: { name: string; profile: string; page: string };
}

export interface Product {
  id: string;
  sectionId: string;
  name: string;
  brand: string;
  price: number; // INR
  mrp: number; // INR
  rating: number; // 0–5
  reviews: number;
  /** the colour actually shown in the photographs */
  colours: Colour[];
  sizes: string[];
  stock: number;
  fabric: string;
  fit: string;
  style: BlazerStyle;
  description: string;
  photos: ProductPhoto[];
  badge?: "New" | "Bestseller" | "Limited";
}

export interface CatalogService {
  listBySection(sectionId: string): Product[];
  previewBySection(sectionId: string, n?: number): Product[];
  byId(id: string): Product | undefined;
}
