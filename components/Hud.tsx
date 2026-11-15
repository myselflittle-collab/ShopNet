"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { cartCount, useShopStore } from "@/lib/bridge/shopStore";
import { MALL } from "@/lib/config/mall";
import { SECTION_BY_ID, viewingPose } from "@/lib/config/sections";
import { tweenTo, walker } from "@/mall/navigation/walker";

/** Overlay UI for the mall: loading screen, brand bar, controls help, position readout, mobile walk pad. */
export function Hud() {
  const ready = useMallStore((s) => s.ready);
  const mode = useMallStore((s) => s.mode);
  const bag = useShopStore(cartCount);
  const [helpOpen, setHelpOpen] = useState(true);
  const [coarse, setCoarse] = useState(false);
  const readout = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!readout.current) return;
      const dist = Math.max(0, MALL.entranceZ - walker.z);
      let deg = Math.round(((walker.yaw * 180) / Math.PI) % 360);
      if (deg > 180) deg -= 360;
      if (deg < -180) deg += 360;
      const facing = Math.abs(deg) < 30 ? "down the corridor" : deg > 0 ? "left · Women" : "right · Men";
      readout.current.textContent = `${dist.toFixed(1)} m in · facing ${facing}`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const walking = mode === "walking";
  const hidden = mode === "shop";

  const goToBlazers = () => {
    if (useMallStore.getState().mode !== "walking") return;
    const p = viewingPose(SECTION_BY_ID["women-blazers"]);
    tweenTo({ ...p, x: 0 }, 1.6);
  };

  const pad = (v: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      walker.pad = v;
    },
    onPointerUp: () => (walker.pad = 0),
    onPointerCancel: () => (walker.pad = 0),
    onPointerLeave: () => (walker.pad = 0),
  });

  return (
    <>
      <div className={`loading ${ready ? "is-done" : ""}`} aria-hidden={ready}>
        <p className="font-display text-[34px] tracking-[0.3em]">SHOPNET</p>
        <p className="mt-2 text-[13px] text-muted">Preparing the mall</p>
      </div>

      <header className={`hud-top ${hidden ? "is-hidden" : ""}`}>
        <Link href="/" className="font-display text-[20px] tracking-[0.28em]">SHOPNET</Link>
        <div className="flex items-center gap-2">
          <span className="chip">Greybox preview</span>
          <span className="chip" aria-label={`${bag} items in bag`}>Bag · {bag}</span>
        </div>
      </header>

      <div className={`hud-bottom ${hidden ? "is-hidden" : ""}`}>
        <section className="panel max-w-[340px]">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">How to move</p>
            <button type="button" className="text-[12px] underline" onClick={() => setHelpOpen((o) => !o)}>
              {helpOpen ? "Hide" : "Show"}
            </button>
          </div>
          {helpOpen && (
            <ul className="mt-2 space-y-1 text-[13px]">
              {coarse ? (
                <>
                  <li>Drag to look around</li>
                  <li>Hold ▲ / ▼ to walk</li>
                  <li>Tap a display for a preview</li>
                </>
              ) : (
                <>
                  <li><b>Scroll</b> up to walk forward, down to walk back</li>
                  <li><b>Drag</b> to look around</li>
                  <li><b>W A S D</b> or arrow keys also work</li>
                  <li><b>Hover</b> a display for a preview, <b>click</b> it to enter</li>
                </>
              )}
            </ul>
          )}
          <button type="button" className="btn-ghost mt-3" onClick={goToBlazers} disabled={!walking}>
            Walk to Women&apos;s Blazers
          </button>
        </section>
        <p className="panel text-[12px] tabular-nums">
          <span ref={readout} />
          <span className="block text-muted">Mall width {MALL.width.toFixed(2)} m (30 ft)</span>
        </p>
      </div>

      {coarse && !hidden && (
        <div className="walk-pad">
          <button type="button" aria-label="Walk forward" {...pad(1)}>▲</button>
          <button type="button" aria-label="Walk back" {...pad(-1)}>▼</button>
        </div>
      )}
    </>
  );
}
