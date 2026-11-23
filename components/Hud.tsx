"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { cartCount, useShopStore } from "@/lib/bridge/shopStore";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { setPose, walker } from "@/mall/navigation/walker";

export function Hud() {
  const ready = useMallStore((state) => state.ready);
  const mode = useMallStore((state) => state.mode);
  const lookMode = useMallStore((state) => state.lookMode);
  const hoveredId = useMallStore((state) => state.hoveredId);
  const tutorialStep = useMallStore((state) => state.tutorialStep);
  const tutorialComplete = useMallStore((state) => state.tutorialComplete);
  const tutorialHint = useMallStore((state) => state.tutorialHint);
  const bag = useShopStore(cartCount);
  const [coarse, setCoarse] = useState(false);
  const [welcome, setWelcome] = useState(true);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const walking = mode === "walking";
  const hidden = mode !== "walking";
  const target = hoveredId ? SECTION_BY_ID[hoveredId] : null;
  const lookActive = lookMode === "locked" || lookMode === "steer" || lookMode === "touch";

  const enterMall = () => {
    if (!ready) return;
    setPose({ s: 2, yaw: (20 * Math.PI) / 180, pitch: 0 });
    useMallStore.getState().startTutorial();
    if (coarse) useMallStore.getState().setLookMode("touch");
    else lookBridge.lock();
    setWelcome(false);
  };

  const resumeLook = () => {
    if (coarse) useMallStore.getState().setLookMode("touch");
    else lookBridge.lock();
  };

  const tutorialText = (() => {
    if (tutorialStep === 1) return coarse ? "Swipe up to walk forward" : "Scroll down to walk forward";
    if (tutorialStep === 2) return coarse ? "Swipe down to walk backward" : "Scroll up to walk backward";
    if (tutorialStep === 3) return coarse ? "Swipe left to look left" : "Move the mouse left to look left";
    if (tutorialStep === 4) return coarse ? "Swipe right to look right" : "Move the mouse right to look right";
    if (tutorialStep === 5) return coarse ? "Double-tap the walkway to stop free-look" : "Double-click the walkway to stop free-look";
    return "";
  })();

  const pad = (value: number) => ({
    onPointerDown: (event: React.PointerEvent) => {
      event.preventDefault();
      walker.pad = value;
    },
    onPointerUp: () => (walker.pad = 0),
    onPointerCancel: () => (walker.pad = 0),
    onPointerLeave: () => (walker.pad = 0),
  });

  return (
    <>
      <div className={"loading " + (ready ? "is-done" : "")} aria-hidden="true">
        <p className="font-display text-[34px] tracking-[0.3em]">SHOPNET</p>
        <p className="mt-2 text-[13px] text-muted">Preparing the mall</p>
      </div>

      {welcome && (
        <section className="welcome-screen" aria-label="Welcome to ShopNet">
          <div className="welcome-panel">
            <p className="welcome-kicker">A new way to discover fashion</p>
            <h1 className="welcome-title">SHOPNET</h1>
            <p className="welcome-subtitle">THE FASHION MALL</p>
            <div className="welcome-rule" />
            <p className="welcome-copy">Explore. Discover. Find your style.</p>
            <button type="button" className="welcome-enter" onClick={enterMall} disabled={!ready} aria-disabled={!ready}>
              {ready ? "Enter the mall" : "Preparing the mall…"}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="welcome-status" role="status" aria-live="polite">
              {ready ? "Your shopping experience is ready." : "Loading the mall experience. The entrance will open shortly."}
            </p>
          </div>
        </section>
      )}

      <div className={"reticle " + (target ? "is-target " : "") + (hidden || welcome ? "is-hidden" : "")} aria-hidden="true">
        <span className="reticle-ring" />
        <span className="reticle-dot" />
      </div>

      {!welcome && walking && tutorialStep >= 1 && tutorialStep <= 5 && (
        <div className="fixed bottom-7 left-1/2 z-40 w-[min(92vw,430px)] -translate-x-1/2 rounded-2xl border border-white/25 bg-[#171a1de8] px-5 py-4 text-center text-white shadow-2xl backdrop-blur-md pointer-events-none">
          <div className="mb-1 text-[10px] font-semibold tracking-[0.24em] text-[#d5b77f]">
            NAVIGATION · STEP {tutorialStep} OF 5
          </div>
          <div className="text-base font-semibold tracking-wide">{tutorialText}</div>
          <div className="mt-1 min-h-5 text-xs text-white/70" role="status" aria-live="polite">
            {tutorialHint ?? "Complete this action to continue"}
          </div>
        </div>
      )}

      {!welcome && walking && tutorialComplete && !lookActive && (
        <button
          type="button"
          onClick={resumeLook}
          className="fixed bottom-7 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/25 bg-[#171a1de8] px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-md"
        >
          Look Around
        </button>
      )}

      <div className={"target-label " + (target && walking && !welcome ? "is-on" : "")} role="status" aria-live="polite">
        {target && (
          <>
            <b>{target.gender === "women" ? "Women's" : "Men's"} {target.label}</b>
            <span>{target.live ? (coarse ? "Tap to enter" : "Click to enter") : "Store preview"}</span>
          </>
        )}
      </div>

      <header className={"hud-top " + (hidden || welcome ? "is-hidden" : "")}>
        <Link href="/" className="font-display text-[20px] tracking-[0.28em]">SHOPNET</Link>
        <span className="chip" aria-label={bag + " items in bag"}>Bag · {bag}</span>
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
