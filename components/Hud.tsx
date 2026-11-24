"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { useTutorial } from "@/lib/bridge/tutorialStore";
import { cartCount, useShopStore } from "@/lib/bridge/shopStore";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { walker } from "@/mall/navigation/walker";
import { skipTutorial } from "@/mall/navigation/tutorialLogic";

const STEPS = {
  desktop: [
    "",
    "Scroll down to walk forward",
    "Scroll up to step back",
    "Move your mouse to the left to look left",
    "Now move your mouse to the right to look right",
    "Double-click to stop looking around",
  ],
  touch: [
    "",
    "Swipe up to walk forward",
    "Swipe down to step back",
    "Swipe left to look left",
    "Now swipe right to look right",
    "Double-tap the walkway to stop looking around",
  ],
};

export function Hud() {
  const ready = useMallStore((s) => s.ready);
  const entered = useMallStore((s) => s.entered);
  const mode = useMallStore((s) => s.mode);
  const lookMode = useMallStore((s) => s.lookMode);
  const locked = useMallStore((s) => s.locked);
  const hoveredId = useMallStore((s) => s.hoveredId);
  const step = useTutorial((s) => s.step);
  const nudge = useTutorial((s) => s.nudge);
  const bag = useShopStore(cartCount);
  const [coarse, setCoarse] = useState(false);
  const [doneFlash, setDoneFlash] = useState(false);

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);
  useEffect(() => {
    if (step !== 6) return;
    setDoneFlash(true);
    const t = window.setTimeout(() => setDoneFlash(false), 3200);
    return () => window.clearTimeout(t);
  }, [step]);

  const walking = mode === "walking";
  const hidden = !walking || !entered;
  const target = hoveredId ? SECTION_BY_ID[hoveredId] : null;
  const touring = entered && step >= 1 && step <= 5;

  const enterMall = () => {
    if (!ready) return;
    const st = useMallStore.getState();
    st.setLookMode("free");
    st.setEntered();
    useTutorial.getState().start();
    // a real click: the browser may grant unlimited 360° mouse look right away
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

  const steps = coarse ? STEPS.touch : STEPS.desktop;

  return (
    <>
      <div className={"loading " + (ready ? "is-done" : "")} aria-hidden="true">
        <p className="font-display text-[34px] tracking-[0.3em]">SHOPNET</p>
        <p className="mt-2 text-[13px] text-muted">Preparing the mall</p>
      </div>

      {!entered && mode === "walking" && (
        <section className="welcome-screen" aria-label="Welcome to ShopNet">
          <div className="welcome-panel">
            <p className="welcome-kicker">A new way to discover fashion</p>
            <h1 className="welcome-title">SHOPNET</h1>
            <p className="welcome-subtitle">THE FASHION MALL</p>
            <div className="welcome-rule" />
            <p className="welcome-copy">Women on your left. Men on your right. Walk the S.</p>
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

      <div className={"reticle " + (target ? "is-target " : "") + (hidden || !locked ? "is-hidden" : "")} aria-hidden="true">
        <span className="reticle-ring" />
        <span className="reticle-dot" />
      </div>

      {touring && walking && (
        <div className="tour-card" role="status" aria-live="polite">
          <p className="tour-count">
            Step {step} of 5
          </p>
          <p className="tour-text">{steps[step]}</p>
          {nudge && <p className="tour-nudge">{nudge}</p>}
          <div className="tour-dots" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={i < step ? "is-done" : i === step ? "is-on" : ""} />
            ))}
          </div>
          <button type="button" className="tour-skip" onClick={() => skipTutorial()}>
            Skip tour
          </button>
        </div>
      )}
      {doneFlash && walking && entered && (
        <div className="tour-card is-done" role="status" aria-live="polite">
          <p className="tour-text">Welcome to ShopNet. Tap or click any boutique to shop it.</p>
        </div>
      )}

      {entered && walking && step === 6 && lookMode === "stopped" && (
        <button type="button" className="look-around" onClick={() => lookBridge.resume()}>
          Look around
        </button>
      )}

      <div className={"target-label " + (target && walking && entered ? "is-on" : "")} role="status" aria-live="polite">
        {target && (
          <>
            <b>
              {target.gender === "women" ? "Women's" : "Men's"} {target.label}
            </b>
            <span>{coarse ? "Tap to open" : "Click to open"}</span>
          </>
        )}
      </div>

      <header className={"hud-top " + (hidden ? "is-hidden" : "")}>
        <Link href="/" className="font-display text-[20px] tracking-[0.28em]">
          SHOPNET
        </Link>
        <span className="chip" aria-label={bag + " items in bag"}>
          Bag · {bag}
        </span>
      </header>

      {coarse && !hidden && (
        <div className="walk-pad">
          <button type="button" aria-label="Walk forward" {...pad(1)}>
            ▲
          </button>
          <button type="button" aria-label="Walk back" {...pad(-1)}>
            ▼
          </button>
        </div>
      )}
    </>
  );
}
