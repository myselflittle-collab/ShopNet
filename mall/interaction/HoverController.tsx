"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SECTIONS, SECTION_BY_ID } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { walker } from "@/mall/navigation/walker";
import { sectionAnchor, sectionHitBox } from "@/mall/sections/geometry";
import { openSection, registerTransitionCamera } from "@/mall/transitions/openSection";
import { hover, HOVER_TIMING, previewAnchor, previewCard } from "./hoverState";

const ray = new THREE.Raycaster();
const centre = new THREE.Vector2(0, 0);
const ndc = new THREE.Vector2();
const hitPoint = new THREE.Vector3();
const boxes = SECTIONS.map((section) => ({
  id: section.id,
  box: sectionHitBox(section),
  sticky: sectionHitBox(section, HOVER_TIMING.stickyExpand),
}));
let cameraRef: THREE.Camera | null = null;

function pickNdc(point: THREE.Vector2, current: string | null): string | null {
  if (!cameraRef) return null;
  ray.setFromCamera(point, cameraRef);
  let best: string | null = null;
  let bestDistance = Infinity;

  for (const item of boxes) {
    const section = SECTION_BY_ID[item.id];
    // Arc-length distance is stable through both turns of the S; world X/Z distance is not.
    if (Math.abs(section.sCenter - walker.s) > HOVER_TIMING.maxDistance) continue;
    const hit = ray.ray.intersectBox(item.id === current ? item.sticky : item.box, hitPoint);
    if (!hit) continue;
    const distance = hit.distanceTo(ray.ray.origin);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = item.id;
    }
  }
  return best;
}

function pickCentre(current: string | null) {
  return pickNdc(centre, current);
}

/** A single store click or tap opens immediately; it does not wait for the preview-card timer. */
export function selectTarget(
  source: "mouse" | "touch",
  screen?: { x: number; y: number; w: number; h: number },
): boolean {
  const state = useMallStore.getState();
  if (state.mode !== "walking") return false;

  let point = centre;
  if (screen) {
    ndc.set((screen.x / screen.w) * 2 - 1, -(screen.y / screen.h) * 2 + 1);
    point = ndc;
  }
  const id = pickNdc(point, state.hoveredId);
  if (!id) return false;
  openSection(id);
  return true;
}

export function HoverController() {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const anchors = useMemo(
    () => Object.fromEntries(SECTIONS.map((section) => [section.id, sectionAnchor(section)])),
    [],
  );
  const projected = useRef(new THREE.Vector3());

  useEffect(() => {
    cameraRef = camera;
    registerTransitionCamera(camera, size.width, size.height);
  }, [camera, size]);

  useEffect(() => useMallStore.subscribe((state) => {
    if (!state.openRequest) return;
    const id = state.openRequest;
    useMallStore.getState().requestOpen(null);
    openSection(id);
  }), []);

  useFrame(() => {
    const state = useMallStore.getState();
    const now = performance.now();
    const shown = state.hoveredId;

    if (state.mode !== "walking") {
      hover.candidate = null;
      if (shown) state.setHovered(null);
      previewAnchor.onScreen = false;
      return;
    }

    const candidate = pickCentre(shown);
    if (candidate !== hover.candidate) {
      hover.candidate = candidate;
      hover.candidateSince = now;
    }

    if (shown && candidate !== shown) {
      if (previewCard.hovered) hover.lostSince = 0;
      else if (!hover.lostSince) hover.lostSince = now;
      else if (now - hover.lostSince >= HOVER_TIMING.hideGraceMs) {
        state.setHovered(null);
        hover.lostSince = 0;
      }
    } else {
      hover.lostSince = 0;
    }

    const current = useMallStore.getState().hoveredId;
    if (
      candidate && candidate !== current && !previewCard.hovered &&
      now - hover.candidateSince >= HOVER_TIMING.showDelayMs
    ) {
      state.setHovered(candidate);
      hover.lostSince = 0;
    }

    const id = useMallStore.getState().hoveredId;
    if (id) {
      projected.current.copy(anchors[id]).project(camera);
      previewAnchor.onScreen = projected.current.z < 1 &&
        Math.abs(projected.current.x) < 1.3 && Math.abs(projected.current.y) < 1.3;
      previewAnchor.x = (projected.current.x * 0.5 + 0.5) * size.width;
      previewAnchor.y = (-projected.current.y * 0.5 + 0.5) * size.height;
    } else {
      previewAnchor.onScreen = false;
    }
  });

  return null;
}
