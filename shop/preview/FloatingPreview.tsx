"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { previewAnchor, previewCard } from "@/lib/bridge/previewBridge";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { catalog } from "@/lib/catalog/mockCatalog";
import { inr } from "@/lib/catalog/productImage";
import { Photo } from "@/shop/components/Photo";

const CARD_W = 340;
const GAP = 18;

/**
 * Floating preview pinned to the hovered display. Plain DOM over the canvas, so text stays sharp.
 * It never opens a section on its own; only its button or a click on the display does.
 */
export function FloatingPreview() {
  const hoveredId = useMallStore((s) => s.hoveredId);
  const [shownId, setShownId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, init: false });

  // keep the last section's content while the card fades out
  useEffect(() => {
    if (hoveredId) {
      setShownId(hoveredId);
      setVisible(true);
    } else {
      setVisible(false);
      previewCard.hovered = false;
    }
  }, [hoveredId]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const node = el.current;
      if (!node) return;
      const h = node.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let tx = previewAnchor.x - CARD_W / 2;
      let ty = previewAnchor.y - h - GAP;
      if (ty < 72) ty = previewAnchor.y + GAP;
      tx = Math.max(12, Math.min(vw - CARD_W - 12, tx));
      ty = Math.max(64, Math.min(vh - h - 12, ty));
      const p = pos.current;
      if (!p.init || !node.dataset.visible || node.dataset.visible === "false") {
        p.x = tx;
        p.y = ty;
        p.init = true;
      } else {
        // smoothed, so the card glides with the camera instead of jittering
        p.x += (tx - p.x) * 0.35;
        p.y += (ty - p.y) * 0.35;
      }
      node.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      node.style.visibility = previewAnchor.onScreen || !visible ? "" : "hidden";
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const s = shownId ? SECTION_BY_ID[shownId] : null;
  const items = useMemo(() => (s?.live ? catalog.previewBySection(s.id, 4) : []), [s]);
  const all = useMemo(() => (s?.live ? catalog.listBySection(s.id) : []), [s]);
  const from = all.length ? Math.min(...all.map((p) => p.price)) : 0;

  return (
    <div
      ref={el}
      data-visible={visible ? "true" : "false"}
      className="preview-card"
      style={{ width: CARD_W }}
      onPointerEnter={() => (previewCard.hovered = true)}
      onPointerLeave={() => (previewCard.hovered = false)}
      role="dialog"
      aria-label={s ? `${s.gender === "women" ? "Women's" : "Men's"} ${s.label} preview` : undefined}
      aria-hidden={!visible}
    >
      {s && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow">{s.gender === "women" ? "Women" : "Men"}</p>
              <h3 className="font-display text-[22px] leading-tight">{s.label}</h3>
            </div>
            {s.live && <p className="text-[12px] text-muted tabular-nums">{all.length} styles · from {inr(from)}</p>}
          </div>
          {s.live ? (
            <>
              <ul className="mt-3 grid grid-cols-4 gap-2">
                {items.map((p) => (
                  <li key={p.id} className="min-w-0">
                    <Photo photo={p.photos[0]} width={160} sizes="80px" priority className="rounded-md" />
                    <p className="mt-1 truncate text-[11px] leading-tight">{p.name}</p>
                    <p className="text-[11px] font-semibold tabular-nums">{inr(p.price)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="text-[12px] text-muted">Click to enter the store</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => s && useMallStore.getState().requestOpen(s.id)}
                >
                  Enter section
                </button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-muted">This section opens in a later phase.</p>
          )}
        </>
      )}
    </div>
  );
}
