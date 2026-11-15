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
const boxes = SECTIONS.map((s) => ({ id: s.id, box: sectionHitBox(s), sticky: sectionHitBox(s, HOVER_TIMING.stickyExpand) }));
let cameraRef: THREE.Camera | null = null;

/**
 * What you are looking at: the nearest section under the centre of the view (the reticle), within reach.
 * The current target uses a slightly larger box so small head movements don't flip it.
 */
function pickCentre(current: string | null): string | null {
  return pickNdc(centre, current);
}

function pickNdc(point: THREE.Vector2, current: string | null): string | null {
  if (!cameraRef) return null;
  ray.setFromCamera(point, cameraRef);
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
 * Deliberate selection: a click (or tap) opens a section only when it is already highlighted
 * (you have looked at it for the show delay) and you are not walking fast.
 * On touch screens a tap on an already highlighted live section opens it too; the preview's button also works.
 */
export function selectTarget(source: "mouse" | "touch", screen?: { x: number; y: number; w: number; h: number }) {
  const st = useMallStore.getState();
  if (st.mode !== "walking") return;
  if (Math.abs(walker.vel) > HOVER_TIMING.maxClickSpeed) return;
  const id = st.hoveredId;

  if (source === "touch" && screen) {
    // a tap on a store: first tap turns your head to face it (and highlights it), the next tap enters
    ndc.set((screen.x / screen.w) * 2 - 1, -(screen.y / screen.h) * 2 + 1);
    const hit = pickNdc(ndc, id);
    if (!hit) return;
    if (hit === id) {
      openSection(hit);
      return;
    }
    faceSection(hit);
    return;
  }

  if (!id) return;
  if (pickCentre(id) !== id) return;
  openSection(id);
}

/** Turn the head smoothly to look at a section's display (used by taps on touch screens). */
function faceSection(id: string) {
  const s = SECTION_BY_ID[id];
  const tx = s.side * 2.6;
  const dx = tx - walker.x;
  const dz = s.cz - walker.z;
  let yaw = Math.atan2(-dx, -dz);
  // nearest equivalent angle, so the head takes the short way round
  while (yaw - walker.targetYaw > Math.PI) yaw -= Math.PI * 2;
  while (yaw - walker.targetYaw < -Math.PI) yaw += Math.PI * 2;
  walker.targetYaw = yaw;
  walker.targetPitch = Math.atan2(1.4 - 1.62, Math.hypot(dx, dz));
}

export function HoverController() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const anchors = useMemo(() => Object.fromEntries(SECTIONS.map((s) => [s.id, sectionAnchor(s)])), []);
  const proj = useRef(new THREE.Vector3());

  useEffect(() => {
    cameraRef = camera;
    registerTransitionCamera(camera, size.width, size.height);
  }, [camera, size]);

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
      if (shown && st.mode !== "opening") st.setHovered(null);
      previewAnchor.onScreen = false;
      return;
    }

    const cand = pickCentre(shown);
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

    // pin the preview card beside the targeted bay
    const id = useMallStore.getState().hoveredId;
    if (id) {
      proj.current.copy(anchors[id]).project(camera);
      previewAnchor.onScreen = proj.current.z < 1 && Math.abs(proj.current.x) < 1.3 && Math.abs(proj.current.y) < 1.3;
      previewAnchor.x = (proj.current.x * 0.5 + 0.5) * size.width;
      previewAnchor.y = (-proj.current.y * 0.5 + 0.5) * size.height;
    } else {
      previewAnchor.onScreen = false;
    }
  });

  return null;
}
