"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS, storeToWorld } from "@/lib/config/sections";
import { MALL } from "@/lib/config/mall";
import { useMallStore } from "@/lib/bridge/mallStore";
import { useTutorial } from "@/lib/bridge/tutorialStore";
import { openSection, registerTransitionCamera } from "@/mall/transitions/openSection";
import { pickStore } from "./pick";
import { hover, HOVER_TIMING, previewAnchor, previewCard } from "./hoverState";

const centre = new THREE.Vector2(0, 0);
const cursor = new THREE.Vector2(0, 0);
let cursorKnown = false;

/**
 * What the customer is aiming at: the boutique under the reticle while the mouse is captured,
 * otherwise under the cursor. It drives the gold highlight, the label and the preview card.
 */
export function HoverController() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const anchors = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map((s) => {
          const p = storeToWorld(s, 0, 0.05);
          return [s.id, new THREE.Vector3(p.x, MALL.portalHeight - 0.25, p.z)];
        }),
      ),
    [],
  );
  const proj = useRef(new THREE.Vector3());

  useEffect(() => {
    registerTransitionCamera(camera, size.width, size.height);
  }, [camera, size]);

  useEffect(() => {
    const el = gl.domElement;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      cursor.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      cursorKnown = true;
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [gl]);

  // the preview card's "Enter" button asks the mall to open a section through the bridge
  useEffect(
    () =>
      useMallStore.subscribe((st) => {
        if (!st.openRequest) return;
        const id = st.openRequest;
        st.requestOpen(null);
        openSection(id);
      }),
    [],
  );

  useFrame(() => {
    const st = useMallStore.getState();
    const now = performance.now();
    const shown = st.hoveredId;
    if (st.mode !== "walking" || !st.entered || useTutorial.getState().step !== 6) {
      hover.candidate = null;
      if (shown && st.mode !== "opening") st.setHovered(null);
      previewAnchor.onScreen = false;
      return;
    }
    const aim = document.pointerLockElement || !cursorKnown ? centre : cursor;
    const cand = pickStore(camera, aim)?.id ?? null;
    if (cand !== hover.candidate) {
      hover.candidate = cand;
      hover.candidateSince = now;
    }
    if (shown && cand !== shown) {
      if (previewCard.hovered) hover.lostSince = 0;
      else if (!hover.lostSince) hover.lostSince = now;
      else if (now - hover.lostSince >= HOVER_TIMING.hideGraceMs) {
        st.setHovered(null);
        hover.lostSince = 0;
      }
    } else hover.lostSince = 0;
    const current = useMallStore.getState().hoveredId;
    if (cand && cand !== current && !previewCard.hovered && now - hover.candidateSince >= HOVER_TIMING.showDelayMs) {
      st.setHovered(cand);
      hover.lostSince = 0;
    }
    const id = useMallStore.getState().hoveredId;
    if (id) {
      proj.current.copy(anchors[id]).project(camera);
      previewAnchor.onScreen = proj.current.z < 1 && Math.abs(proj.current.x) < 1.3 && Math.abs(proj.current.y) < 1.3;
      previewAnchor.x = (proj.current.x * 0.5 + 0.5) * size.width;
      previewAnchor.y = (-proj.current.y * 0.5 + 0.5) * size.height;
    } else previewAnchor.onScreen = false;
  });

  return null;
}
