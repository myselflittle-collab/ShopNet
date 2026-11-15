"use client";

import { useRouter } from "next/navigation";
import { useMallStore } from "@/lib/bridge/mallStore";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { sectionByRoute } from "@/lib/config/sections";
import { catalog } from "@/lib/catalog/mockCatalog";
import type { Product } from "@/lib/catalog/types";
import { cartCount, useShopStore } from "@/lib/bridge/shopStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { transitionOrigin } from "@/lib/bridge/transitionBridge";
import { activeCount, applyFilters, EMPTY_FILTERS, type FilterState, type SortKey, SORTS } from "./filters";
import { Filters } from "./components/Filters";
import { ProductCard } from "./components/ProductCard";
import { ProductDetail } from "./components/ProductDetail";

const REVEAL_MS = 900;
const CLOSE_MS = 650;

/**
 * The 2D shopping interface for one category, shown over the paused mall.
 * It grows out of the opened display (an iris from the display's screen position) and shrinks back into it on close.
 * It knows nothing about three.js; closing simply navigates to "/" and the mall plays its return.
 */
export function ShopOverlay({ gender, category }: { gender: string; category: string }) {
  const router = useRouter();
  const s = sectionByRoute(gender, category);
  const products = useMemo(() => (s ? catalog.listBySection(s.id) : []), [s]);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("featured");
  const [drawer, setDrawer] = useState(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [phase, setPhase] = useState<"enter" | "open" | "closing">("enter");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bag = useShopStore(cartCount);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const list = useMemo(() => applyFilters(products, filters, sort), [products, filters, sort]);
  const nActive = activeCount(filters);

  // iris origin = the display's position on screen (centre for direct links)
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fromMall = transitionOrigin.fromMall;
    const x = fromMall ? transitionOrigin.x : window.innerWidth / 2;
    const y = fromMall ? transitionOrigin.y : window.innerHeight / 2;
    el.style.setProperty("--ox", `${x}px`);
    el.style.setProperty("--oy", `${y}px`);
    el.dataset.fromMall = fromMall ? "true" : "false";
    useMallStore.getState().setShopVisible(true);
    const t = setTimeout(() => setPhase("open"), fromMall ? REVEAL_MS : 450);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    if (phase === "closing") return;
    setDetail(null);
    setPhase("closing");
    transitionOrigin.closedBySelf = true;
    useMallStore.getState().setShopVisible(false);
    // pointer lock must be requested inside the click, so ask for it now; the mall applies it when it is ready
    lookBridge.lock();
    setTimeout(() => router.push("/", { scroll: false }), CLOSE_MS);
  }, [phase, router]);

  useEffect(() => {
    if (phase === "open") closeBtn.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !detail) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, detail]);

  const notify = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const title = s ? `${s.gender === "women" ? "Women's" : "Men's"} ${s.label}` : "Section not found";

  return (
    <div ref={root} className="shop" data-phase={phase} role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <header className="shop-head">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[18px] tracking-[0.28em]">SHOPNET</p>
            <nav className="truncate text-[12px] text-muted" aria-label="Breadcrumb">
              Mall / {s ? (s.gender === "women" ? "Women" : "Men") : "—"} / {s?.label ?? category}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip" aria-label={`${bag} items in bag`}>Bag · {bag}</span>
            <button ref={closeBtn} type="button" className="btn-primary" onClick={close}>
              Back to mall
            </button>
          </div>
        </div>
      </header>

      <main className="shop-body">
        <div className="mx-auto w-full max-w-[1320px]">
          <div className="shop-intro flex flex-wrap items-end justify-between gap-3 pb-5">
            <div>
              <p className="eyebrow">You&apos;re in the {s?.label ?? ""} store</p>
              <h1 id="shop-title" className="font-display text-[34px] leading-none sm:text-[44px]">{title}</h1>
              {s?.live && (
                <p className="mt-2 text-[14px] text-muted">
                  {list.length} of {products.length} styles · the collection on the rail you just walked up to
                </p>
              )}
            </div>
            {s?.live && (
              <div className="flex items-center gap-2">
                <button type="button" className="btn-ghost lg:hidden" onClick={() => setDrawer(true)}>
                  Filters{nActive ? ` (${nActive})` : ""}
                </button>
                <label className="sr-only" htmlFor="sort">Sort by</label>
                <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                  {SORTS.map((o) => (
                    <option key={o.key} value={o.key}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {!s?.live ? (
            <div className="panel max-w-[520px] p-6">
              <p className="text-[15px]">This section opens in a later phase. Women&apos;s Blazers is the first section being built.</p>
              <button type="button" className="btn-primary mt-4" onClick={close}>Back to mall</button>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-4">
                  <Filters products={products} value={filters} onChange={setFilters} />
                </div>
              </aside>
              <section className="min-w-0">
                {list.length === 0 ? (
                  <div className="panel p-6 text-[14px]">
                    No blazers match these filters.{" "}
                    <button type="button" className="underline" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
                  </div>
                ) : (
                  <div className="shop-grid grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                    {list.map((p, i) => (
                      <div key={p.id} className="shop-grid-item" style={{ ["--i" as string]: Math.min(i, 8) }}>
                        <ProductCard p={p} onNotify={notify} onOpen={setDetail} priority={i < 4} />
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-6 text-[11px] text-muted">
                  Product photos: Unsplash contributors, used under the{" "}
                  <a className="underline" href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash License</a>.
                  Prices, ratings and stock are sample data.
                </p>
              </section>
            </div>
          )}
        </div>
      </main>

      {drawer && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-label="Filters">
          <button type="button" className="flex-1 bg-ink/40" aria-label="Close filters" onClick={() => setDrawer(false)} />
          <div className="w-[min(340px,88vw)] overflow-y-auto bg-paper p-5">
            <Filters products={products} value={filters} onChange={setFilters} />
            <button type="button" className="btn-primary mt-6 w-full" onClick={() => setDrawer(false)}>
              Show {list.length} styles
            </button>
          </div>
        </div>
      )}

      {detail && <ProductDetail p={detail} onClose={() => setDetail(null)} onNotify={notify} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
