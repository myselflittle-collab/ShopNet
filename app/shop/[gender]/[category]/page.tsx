import type { Metadata } from "next";
import { sectionByRoute } from "@/lib/config/sections";
import { ShopOverlay } from "@/shop/ShopOverlay";

type Params = { gender: string; category: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { gender, category } = await params;
  const s = sectionByRoute(gender, category);
  const title = s ? `${s.gender === "women" ? "Women's" : "Men's"} ${s.label}` : "Shop";
  return { title: `${title} · ShopNet` };
}

export default async function ShopPage({ params }: { params: Promise<Params> }) {
  const { gender, category } = await params;
  return <ShopOverlay key={`${gender}/${category}`} gender={gender} category={category} />;
}
