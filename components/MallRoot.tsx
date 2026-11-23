"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { transitionOrigin } from "@/lib/bridge/transitionBridge";
import { sectionByRoute } from "@/lib/config/sections";
import { enterFromDeepLink, returnToMall } from "@/mall/transitions/openSection";
import { FloatingPreview } from "@/shop/preview/FloatingPreview";
import { Hud } from "./Hud";

const MallCanvas = dynamic(() => import("@/mall/MallCanvas"), { ssr: false });

/** Keeps the URL and the mall in step: mall → shop route, shop closed → back to the mall. */
function RouteSync({ onBackExit }: { onBackExit: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const pendingRoute = useMallStore((s) => s.pendingRoute);

  useEffect(() => {
    if (!pendingRoute) return;
    useMallStore.getState().requestRoute(null);
    router.push(pendingRoute, { scroll: false });
  }, [pendingRoute, router]);

  useEffect(() => {
    const st = useMallStore.getState();
    const m = pathname.match(/^\/shop\/([^/]+)\/([^/]+)/);
    if (m) {
      if (st.mode === "walking") {
        const s = sectionByRoute(m[1], m[2]);
        if (s) enterFromDeepLink(s.id);
        else st.setMode("shop");
      }
    } else if (st.mode === "shop" || st.mode === "opening") {
      // left with the browser back button: play a closing veil so the shop never just vanishes
      if (!transitionOrigin.closedBySelf) onBackExit();
      transitionOrigin.closedBySelf = false;
      st.setShopVisible(false);
      returnToMall();
    }
  }, [pathname, onBackExit]);

  return null;
}

export function MallRoot() {
  const pathname = usePathname();
  const shopVisible = useMallStore((s) => s.shopVisible);
  const [veil, setVeil] = useState<{ x: number; y: number } | null>(null);
  const veilTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBackExit = useRef(() => {
    setVeil({ x: transitionOrigin.x, y: transitionOrigin.y });
    if (veilTimer.current) clearTimeout(veilTimer.current);
    veilTimer.current = setTimeout(() => setVeil(null), 700);
  }).current;

  return (
    <>
      <div className={`mall-stage ${shopVisible ? "is-dimmed" : ""}`} aria-hidden={shopVisible}>
        <MallCanvas benchmarkMode={pathname === "/bench"} />
      </div>
      <FloatingPreview />
      <Hud />
      {veil && (
        <div
          className="exit-veil"
          style={{ ["--ox" as string]: `${veil.x}px`, ["--oy" as string]: `${veil.y}px` }}
          aria-hidden="true"
        />
      )}
      <RouteSync onBackExit={onBackExit} />
    </>
  );
}
