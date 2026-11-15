"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/catalog/types";
import { inr } from "@/lib/catalog/productImage";
import { useShopStore } from "@/lib/bridge/shopStore";
import { discountPct } from "@/shop/filters";
import { Photo } from "./Photo";
import { Rating } from "./Rating";

const KIND_LABEL = { look: "Full look", alt: "Another view", detail: "Close-up" } as const;

/** Product detail with a photo gallery. Opens over the category grid; Esc or the close button returns to it. */
export function ProductDetail({
  p,
  onClose,
  onNotify,
}: {
  p: Product;
  onClose: () => void;
  onNotify: (msg: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const addToCart = useShopStore((s) => s.addToCart);
  const closeRef = useRef<HTMLButtonElement>(null);
  const out = p.stock === 0;
  const photo = p.photos[index];
  const credits = Array.from(new Map(p.photos.map((ph) => [ph.credit.name, ph.credit])).values());

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onClose();
      }
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % p.photos.length);
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + p.photos.length) % p.photos.length);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, p.photos.length]);

  const add = (buyNow: boolean) => {
    if (!size) {
      onNotify("Choose a size first");
      return;
    }
    addToCart({ productId: p.id, size, colour: p.colours[0].name });
    onNotify(buyNow ? "Added. Checkout is a mock in this prototype." : `Added ${p.name}, size ${size}`);
  };

  return (
    <div className="pdp-backdrop" role="dialog" aria-modal="true" aria-labelledby="pdp-title" onClick={onClose}>
      <div className="pdp" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} type="button" className="pdp-close" onClick={onClose} aria-label="Close product details">
          ✕
        </button>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-2xl">
              <Photo key={`${photo.id}-${photo.kind}`} photo={photo} width={900} sizes="(max-width: 768px) 92vw, 46vw" priority className="pdp-photo" />
            </div>
            <div className="mt-3 flex gap-2" role="tablist" aria-label="Photos">
              {p.photos.map((ph, i) => (
                <button
                  key={`${ph.id}-${ph.kind}`}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={KIND_LABEL[ph.kind]}
                  onClick={() => setIndex(i)}
                  className={`w-[72px] overflow-hidden rounded-lg border-2 ${i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100"}`}
                >
                  <Photo photo={ph} width={160} sizes="72px" />
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Photos:{" "}
              {credits.map((c, i) => (
                <span key={c.name}>
                  {i > 0 && ", "}
                  <a href={c.profile} target="_blank" rel="noreferrer" className="underline">{c.name}</a>
                </span>
              ))}{" "}
              on{" "}
              <a href="https://unsplash.com/license" target="_blank" rel="noreferrer" className="underline">Unsplash</a>
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <p className="eyebrow">{p.brand}</p>
            <h2 id="pdp-title" className="font-display text-[30px] leading-tight">{p.name}</h2>
            <Rating value={p.rating} count={p.reviews} />
            <p className="flex flex-wrap items-baseline gap-x-3 tabular-nums">
              <span className="text-[24px] font-semibold">{inr(p.price)}</span>
              <s className="text-[14px] text-muted">{inr(p.mrp)}</s>
              <span className="text-[14px] font-semibold text-emerald">{discountPct(p)}% off</span>
            </p>
            <p className="text-[12px] text-muted">Inclusive of all taxes</p>
            <p className="flex items-center gap-2 text-[14px]">
              <span className="h-5 w-5 rounded-full border border-line" style={{ background: p.colours[0].hex }} aria-hidden="true" />
              Colour: <b>{p.colours[0].name}</b>
            </p>
            <div>
              <p className="eyebrow mb-2">Size</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Size">
                {p.sizes.map((z) => (
                  <button key={z} type="button" disabled={out} aria-pressed={z === size} onClick={() => setSize(z)} className="size-chip !px-3 !py-1.5 !text-[13px]">
                    {z}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[14px] leading-relaxed">{p.description}</p>
            <dl className="grid grid-cols-[90px_1fr] gap-y-1 text-[13px]">
              <dt className="text-muted">Fabric</dt><dd>{p.fabric}</dd>
              <dt className="text-muted">Fit</dt><dd>{p.fit}</dd>
              <dt className="text-muted">Stock</dt><dd>{out ? "Out of stock" : p.stock < 6 ? `Only ${p.stock} left` : "In stock"}</dd>
            </dl>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost !py-3" disabled={out} onClick={() => add(false)}>Add to cart</button>
              <button type="button" className="btn-primary !py-3" disabled={out} onClick={() => add(true)}>Buy now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
