"use client";

import type { BlazerStyle, Product } from "@/lib/catalog/types";
import { ALL_COLOURS } from "@/lib/catalog/mockCatalog";
import { EMPTY_FILTERS, type FilterState, PRICE_BANDS } from "@/shop/filters";

const STYLE_LABEL: Record<BlazerStyle, string> = {
  single: "Single-breasted",
  double: "Double-breasted",
  cropped: "Cropped",
  longline: "Longline",
};

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function Filters({
  products,
  value,
  onChange,
  showStyle = true,
}: {
  products: Product[];
  value: FilterState;
  onChange: (f: FilterState) => void;
  showStyle?: boolean;
}) {
  const brands = Array.from(new Set(products.map((p) => p.brand))).sort();
  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const colours = ALL_COLOURS.filter((c) => products.some((p) => p.colours.some((pc) => pc.name === c.name)));

  return (
    <div className="space-y-6 text-[14px]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[18px]">Filters</h2>
        <button type="button" className="text-[13px] underline" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear all
        </button>
      </div>

      <fieldset>
        <legend className="eyebrow mb-2">Size</legend>
        <div className="flex flex-wrap gap-1.5">
          {sizes.map((z) => (
            <button
              key={z}
              type="button"
              aria-pressed={value.sizes.includes(z)}
              onClick={() => onChange({ ...value, sizes: toggle(value.sizes, z) })}
              className="size-chip"
            >
              {z}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-2">Colour</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {colours.map((c) => (
            <label key={c.name} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={value.colours.includes(c.name)}
                onChange={() => onChange({ ...value, colours: toggle(value.colours, c.name) })}
                className="accent-ink"
              />
              <span className="h-3.5 w-3.5 rounded-full border border-line" style={{ background: c.hex }} />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-2">Price</legend>
        <div className="space-y-1">
          {PRICE_BANDS.map((b) => (
            <label key={b.key} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="price"
                checked={value.price === b.key}
                onChange={() => onChange({ ...value, price: b.key })}
                className="accent-ink"
              />
              {b.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-2">Rating</legend>
        <div className="space-y-1">
          {[0, 4, 4.5].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="rating"
                checked={value.minRating === r}
                onChange={() => onChange({ ...value, minRating: r })}
                className="accent-ink"
              />
              {r === 0 ? "Any rating" : `${r} ★ and above`}
            </label>
          ))}
        </div>
      </fieldset>

      {showStyle && <fieldset>
        <legend className="eyebrow mb-2">Style</legend>
        <div className="space-y-1">
          {(Object.keys(STYLE_LABEL) as BlazerStyle[]).map((st) => (
            <label key={st} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={value.styles.includes(st)}
                onChange={() => onChange({ ...value, styles: toggle(value.styles, st) })}
                className="accent-ink"
              />
              {STYLE_LABEL[st]}
            </label>
          ))}
        </div>
      </fieldset>}

      <fieldset>
        <legend className="eyebrow mb-2">Brand</legend>
        <div className="space-y-1">
          {brands.map((b) => (
            <label key={b} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={value.brands.includes(b)}
                onChange={() => onChange({ ...value, brands: toggle(value.brands, b) })}
                className="accent-ink"
              />
              {b}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={value.inStockOnly}
          onChange={() => onChange({ ...value, inStockOnly: !value.inStockOnly })}
          className="accent-ink"
        />
        In stock only
      </label>
    </div>
  );
}
