"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { cartCount, useShopStore } from "@/lib/bridge/shopStore";
import { MALL } from "@/lib/config/mall";
import { SECTION_BY_ID, viewingPose } from "@/lib/config/sections";
import { tweenTo, walker } from "@/mall/navigation/walker";

/**
 * Overlay UI for the mall: loading screen, brand bar, centre reticle (what you're targeting),
 * the "click to look around" prompt, controls help, position readout and the mobile walk pad.
 */
export function Hud() {
  const ready = useMallStore((s) => s.ready);
  const mode = useMallStore((s) => s.mode);
  const lookMode = useMallStore((s) => s.lookMode);
  const hoveredId = useMallStore((s) => s.hoveredId);
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
      const facing =
        Math.abs(deg) < 30 ? "down the corridor" : Math.abs(deg) > 150 ? "back to the entrance" : deg > 0 ? "left · Women" : "right · Men";
      readout.current.textContent = `${dist.toFixed(1)} m in · facing ${facing}`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const walking = mode === "walking";
  const hidden = mode !== "walking";
  const target = hoveredId ? SECTION_BY_ID[hoveredId] : null;
  const showStart = ready && walking && !coarse && lookMode === "idle";

  const goToBlazers = () => {
    if (useMallStore.getState().mode !== "walking") return;
    const p = viewingPose(SECTION_BY_ID["women-blazers"]);
    tweenTo({ ...p, x: 0 }, 1.6);
    lookBridge.lock();
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

      {/* centre reticle: what you are looking at */}
      <div className={`reticle ${target ? "is-target" : ""} ${hidden || showStart ? "is-hidden" : ""}`} aria-hidden="true">
        <span className="reticle-ring" />
        <span className="reticle-dot" />
      </div>
      <div
        className={`target-label ${target && walking ? "is-on" : ""}`}
        role="status"
        aria-live="polite"
      >
        {target && (
          <>
            <b>{target.gender === "women" ? "Women's" : "Men's"} {target.label}</b>
            <span>{target.live ? (coarse ? "Tap again to enter" : "Click to enter") : "Opens in a later phase"}</span>
          </>
        )}
      </div>

      {showStart && (
        <button type="button" className="start-look" onClick={() => lookBridge.lock()}>
          <span className="font-display text-[26px]">Click to look around</span>
          <span className="mt-1 text-[13px] text-muted">Move the mouse to turn · scroll to walk · Esc frees the mouse</span>
        </button>
      )}

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
                  <li><b>Swipe</b> with one finger to look around</li>
                  <li><b>Two fingers</b> up / down, or hold ▲ / ▼, to walk</li>
                  <li><b>Tap</b> a store to preview it, tap again to enter</li>
                </>
              ) : (
                <>
                  <li><b>Move the mouse</b> to look around, all the way round</li>
                  <li><b>Scroll</b> up to walk forward, down to walk back</li>
                  <li><b>Aim</b> the centre dot at a store, <b>click</b> to enter</li>
                  <li><b>W A S D</b> / arrow keys also work · <b>Esc</b> frees the mouse</li>
                  {lookMode === "steer" && <li className="text-gold">Your browser blocked mouse capture: move the cursor toward an edge to turn.</li>}
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
