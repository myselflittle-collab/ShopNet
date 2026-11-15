"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMallStore } from "@/lib/bridge/mallStore";
import { sectionByRoute } from "@/lib/config/sections";
import { enterFromDeepLink, returnToMall } from "@/mall/transitions/openSection";
import { FloatingPreview } from "@/shop/preview/FloatingPreview";
import { Hud } from "./Hud";

const MallCanvas = dynamic(() => import("@/mall/MallCanvas"), { ssr: false });

/** Keeps the URL and the mall in step: mall → shop route, shop closed → back to the mall. */
function RouteSync() {
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
      returnToMall();
    }
  }, [pathname]);

  return null;
}

export function MallRoot() {
  const mode = useMallStore((s) => s.mode);
  return (
    <>
      <div className={`mall-stage ${mode === "shop" ? "is-dimmed" : ""}`} aria-hidden={mode === "shop"}>
        <MallCanvas />
      </div>
      <FloatingPreview />
      <Hud />
      <RouteSync />
    </>
  );
}
