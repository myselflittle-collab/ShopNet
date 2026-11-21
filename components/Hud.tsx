"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { cartCount, useShopStore } from "@/lib/bridge/shopStore";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { walker } from "@/mall/navigation/walker";

/** Minimal customer-facing HUD. Development measurements and movement instructions stay out of the experience. */
export function Hud() {
  const ready = useMallStore((s) => s.ready);
  const mode = useMallStore((s) => s.mode);
  const lookMode = useMallStore((s) => s.lookMode);
  const hoveredId = useMallStore((s) => s.hoveredId);
  const bag = useShopStore(cartCount);
  const [coarse, setCoarse] = useState(false);
  const [welcome, setWelcome] = useState(true);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const walking = mode === "walking";
  const hidden = mode !== "walking";
  const target = hoveredId ? SECTION_BY_ID[hoveredId] : null;

  const enterMall = () => {
    setWelcome(false);
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

      {ready && welcome && (
        <section className="welcome-screen" aria-label="Welcome to ShopNet">
          <div className="welcome-panel">
            <p className="welcome-kicker">A new way to discover fashion</p>
            <h1 className="welcome-title">SHOPNET</h1>
            <p className="welcome-subtitle">THE FASHION MALL</p>
            <div className="welcome-rule" />
            <p className="welcome-copy">Explore. Discover. Find your style.</p>
            <button type="button" className="welcome-enter" onClick={enterMall}>
              Enter the mall <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
      )}

      <div className={`reticle ${target ? "is-target" : ""} ${hidden || welcome ? "is-hidden" : ""}`} aria-hidden="true">
        <span className="reticle-ring" />
        <span className="reticle-dot" />
      </div>

      <div className={`target-label ${target && walking && !welcome ? "is-on" : ""}`} role="status" aria-live="polite">
        {target && (
          <>
            <b>{target.gender === "women" ? "Women's" : "Men's"} {target.label}</b>
            <span>{target.live ? (coarse ? "Tap to preview · tap Enter to open" : "Click to enter") : "Store preview"}</span>
          </>
        )}
      </div>

      <header className={`hud-top ${hidden || welcome ? "is-hidden" : ""}`}>
        <Link href="/" className="font-display text-[20px] tracking-[0.28em]">SHOPNET</Link>
        <span className="chip" aria-label={`${bag} items in bag`}>Bag · {bag}</span>
      </header>

      {coarse && !hidden && !welcome && (
        <div className="walk-pad">
          <button type="button" aria-label="Walk forward" {...pad(1)}>▲</button>
          <button type="button" aria-label="Walk back" {...pad(-1)}>▼</button>
        </div>
      )}
    </>
  );
}
