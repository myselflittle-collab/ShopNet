"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { inr } from "@/lib/catalog/productImage";
import { useShopStore } from "@/lib/bridge/shopStore";
import { discountPct } from "@/shop/filters";
import { Photo } from "./Photo";
import { Rating } from "./Rating";

export function ProductCard({
  p,
  onNotify,
  onOpen,
  priority = false,
}: {
  p: Product;
  onNotify: (msg: string) => void;
  onOpen: (p: Product) => void;
  priority?: boolean;
}) {
  const colour = p.colours[0];
  const [size, setSize] = useState<string | null>(null);
  const wished = useShopStore((s) => s.wishlist.includes(p.id));
  const toggleWish = useShopStore((s) => s.toggleWish);
  const addToCart = useShopStore((s) => s.addToCart);
  const out = p.stock === 0;

  const add = (buyNow: boolean) => {
    if (!size) {
      onNotify("Choose a size first");
      return;
    }
    addToCart({ productId: p.id, size, colour: colour.name });
    onNotify(buyNow ? "Added. Checkout is a mock in this prototype." : `Added ${p.name}, size ${size}`);
  };

  return (
    <article className="card group">
      <div className="relative overflow-hidden">
        <button type="button" className="block w-full" onClick={() => onOpen(p)} aria-label={`View ${p.name}`}>
          <Photo photo={p.photos[0]} priority={priority} className="transition-transform duration-500 group-hover:scale-[1.03]" />
        </button>
        {p.badge && <span className="badge pointer-events-none absolute left-3 top-3">{p.badge}</span>}
        <button
          type="button"
          onClick={() => toggleWish(p.id)}
          aria-pressed={wished}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[18px] shadow-sm"
        >
          <span className={wished ? "text-rose" : "text-ink"}>{wished ? "♥" : "♡"}</span>
        </button>
        {p.photos.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold">
            {p.photos.length} photos
          </span>
        )}
        {out && <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/80 py-1.5 text-center text-[12px] text-white">Out of stock</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="eyebrow">{p.brand}</p>
        <h3 className="text-[14px] font-medium leading-snug">
          <button type="button" className="text-left hover:underline" onClick={() => onOpen(p)}>
            {p.name}
          </button>
        </h3>
        <Rating value={p.rating} count={p.reviews} />
        <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="text-[16px] font-semibold">{inr(p.price)}</span>
          <s className="text-[12px] text-muted">{inr(p.mrp)}</s>
          <span className="text-[12px] font-semibold text-emerald">{discountPct(p)}% off</span>
        </p>
        <p className="flex items-center gap-2 text-[12px]">
          <span className="h-4 w-4 rounded-full border border-line" style={{ background: colour.hex }} aria-hidden="true" />
          {colour.name}
        </p>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Size">
          {p.sizes.map((z) => (
            <button
              key={z}
              type="button"
              disabled={out}
              aria-pressed={z === size}
              onClick={() => setSize(z)}
              className="size-chip"
            >
              {z}
            </button>
          ))}
        </div>
        <p className="text-[12px] text-muted">{p.fabric} · {p.fit}{!out && p.stock < 6 ? ` · only ${p.stock} left` : ""}</p>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <button type="button" className="btn-ghost" disabled={out} onClick={() => add(false)}>
            Add to cart
          </button>
          <button type="button" className="btn-primary" disabled={out} onClick={() => add(true)}>
            Buy now
          </button>
        </div>
      </div>
    </article>
  );
}
