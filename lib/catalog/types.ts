export interface Colour {
  name: string;
  hex: string;
}

export type BlazerStyle = "single" | "double" | "cropped" | "longline";

export interface Product {
  id: string;
  sectionId: string;
  name: string;
  brand: string;
  price: number; // INR
  mrp: number; // INR
  rating: number; // 0–5
  reviews: number;
  colours: Colour[];
  sizes: string[];
  stock: number;
  fabric: string;
  fit: string;
  style: BlazerStyle;
  description: string;
  badge?: "New" | "Bestseller" | "Limited";
}

export interface CatalogService {
  listBySection(sectionId: string): Product[];
  previewBySection(sectionId: string, n?: number): Product[];
}
