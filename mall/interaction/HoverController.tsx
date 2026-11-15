"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS, SECTION_BY_ID } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { walker } from "@/mall/navigation/walker";
import { sectionAnchor, sectionHitBox } from "@/mall/sections/geometry";
import { openSection } from "@/mall/transitions/openSection";
import { hover, HOVER_TIMING, pointer, previewAnchor, previewCard } from "./hoverState";

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const hitPoint = new THREE.Vector3();
const boxes = SECTIONS.map((s) => ({ id: s.id, box: sectionHitBox(s), sticky: sectionHitBox(s, HOVER_TIMING.stickyExpand) }));
let cameraRef: THREE.Camera | null = null;
let canvasSize = { w: 1, h: 1 };

/** Nearest section under a screen point, within reach. The current target uses a slightly larger box. */
function pick(x: number, y: number, current: string | null): string | null {
  if (!cameraRef) return null;
  ndc.set((x / canvasSize.w) * 2 - 1, -(y / canvasSize.h) * 2 + 1);
  ray.setFromCamera(ndc, cameraRef);
  let best: string | null = null;
  let bestD = Infinity;
  for (const b of boxes) {
    const s = SECTION_BY_ID[b.id];
    if (Math.hypot(s.cx - walker.x, s.cz - walker.z) > HOVER_TIMING.maxDistance) continue;
    const hit = ray.ray.intersectBox(b.id === current ? b.sticky : b.box, hitPoint);
    if (!hit) continue;
    const d = hit.distanceTo(ray.ray.origin);
    if (d < bestD) {
      bestD = d;
      best = b.id;
    }
  }
  return best;
}

/**
 * Click rule: only a deliberate click on the section that is already highlighted opens it.
 * On touch screens a tap shows the preview; the preview's button opens it.
 */
export function handleCanvasClick(x: number, y: number, pointerType: string) {
  const st = useMallStore.getState();
  if (st.mode !== "walking") return;
  if (performance.now() - pointer.lastDragEnd < HOVER_TIMING.clickCooldownAfterDragMs) return;
  if (Math.abs(walker.vel) > HOVER_TIMING.maxClickSpeed) return;
  const hit = pick(x, y, st.hoveredId);
  if (pointerType !== "mouse") {
    st.setHovered(hit);
    hover.candidate = hit;
    return;
  }
  if (hit && hit === st.hoveredId) openSection(hit);
}

export function HoverController() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const anchors = useMemo(() => Object.fromEntries(SECTIONS.map((s) => [s.id, sectionAnchor(s)])), []);
  const proj = useRef(new THREE.Vector3());

  useEffect(() => {
    cameraRef = camera;
  }, [camera]);
  useEffect(() => {
    canvasSize = { w: size.width, h: size.height };
  }, [size]);

  // the preview card's "Enter section" button asks the mall to open a section through the bridge
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

    if (st.mode !== "walking") {
      hover.candidate = null;
      if (shown) st.setHovered(null);
      previewAnchor.onScreen = false;
      return;
    }

    // Desktop hover. Touch previews are set by taps and stay until another tap.
    if (pointer.type === "mouse") {
      const cand = pointer.dragging || pointer.x === null || pointer.y === null ? null : pick(pointer.x, pointer.y, shown);
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
      } else {
        hover.lostSince = 0;
      }
      const current = useMallStore.getState().hoveredId;
      if (cand && cand !== current && !previewCard.hovered && now - hover.candidateSince >= HOVER_TIMING.showDelayMs) {
        st.setHovered(cand);
        hover.lostSince = 0;
      }
    }

    // pin the preview card to the hovered bay
    const id = useMallStore.getState().hoveredId;
    if (id) {
      proj.current.copy(anchors[id]).project(camera);
      previewAnchor.onScreen = proj.current.z < 1 && Math.abs(proj.current.x) < 1.2 && Math.abs(proj.current.y) < 1.2;
      previewAnchor.x = (proj.current.x * 0.5 + 0.5) * size.width;
      previewAnchor.y = (-proj.current.y * 0.5 + 0.5) * size.height;
    } else {
      previewAnchor.onScreen = false;
    }
  });

  return null;
}
