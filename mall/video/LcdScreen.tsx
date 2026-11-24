"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { useMallStore } from "@/lib/bridge/mallStore";
import { useTutorial } from "@/lib/bridge/tutorialStore";
import {
  CAMPAIGN_SECONDS,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  OVERLAY_UPDATE_INTERVAL,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  drawCampaignOverlay,
  getCampaign,
} from "./campaignOverlay";
import { liveTexture, posterSrc } from "./videoManager";

/**
 * One boutique campaign screen.
 *  - far away: nothing loaded (a neutral dark screen)
 *  - nearby:   the offline poster (WebP frame of the film) + the campaign titles drawn once
 *  - featured: the playing video + the animated campaign titles (one shared canvas for the whole mall)
 */

const loader = typeof document !== "undefined" ? new THREE.TextureLoader() : null;
const posters = new Map<string, { tex: THREE.Texture; used: number }>();
const staticOverlays = new Map<string, { tex: THREE.CanvasTexture; used: number }>();
const POSTER_NEAR = 40;
const POSTER_FAR = 60;
const OVERLAY_NEAR = 26;
const MAX_STATIC_OVERLAYS = 8;

function getPoster(id: string) {
  let p = posters.get(id);
  if (!p && loader) {
    const tex = loader.load(posterSrc(id));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    p = { tex, used: performance.now() };
    posters.set(id, p);
  }
  if (p) p.used = performance.now();
  return p?.tex ?? null;
}

function dropPoster(id: string) {
  const p = posters.get(id);
  if (p) {
    p.tex.dispose();
    posters.delete(id);
  }
}

function getStaticOverlay(s: PlacedSection) {
  let o = staticOverlays.get(s.id);
  if (!o) {
    if (staticOverlays.size >= MAX_STATIC_OVERLAYS) {
      const oldest = [...staticOverlays.entries()].sort((a, b) => a[1].used - b[1].used)[0];
      oldest[1].tex.dispose();
      staticOverlays.delete(oldest[0]);
    }
    const c = document.createElement("canvas");
    c.width = 768;
    c.height = 432;
    const ctx = c.getContext("2d");
    if (ctx) drawCampaignOverlay(ctx, c.width, c.height, getCampaign(s), 7.4);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    o = { tex, used: performance.now() };
    staticOverlays.set(s.id, o);
  }
  o.used = performance.now();
  return o.tex;
}

/** The single animated overlay canvas, owned by whichever store is featured. */
const live = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 768;
  c.height = 432;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { c, tex, owner: null as string | null, acc: 0, elapsed: 0 };
})();

const dark = new THREE.Color("#151312");

export function LcdScreen({
  section,
  position,
  rotationY,
}: {
  section: PlacedSection;
  position: { x: number; y: number; z: number };
  rotationY: number;
}) {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ color: dark, toneMapped: false }), []);
  const overlayMat = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false, depthWrite: false, visible: false }), []);
  useEffect(() => () => (screenMat.dispose(), overlayMat.dispose()), [screenMat, overlayMat]);
  const world = useMemo(() => new THREE.Vector3(), []);
  const eye = useMemo(() => new THREE.Vector3(), []);
  const campaign = useMemo(() => getCampaign(section), [section]);
  const isW1 = section.code === "W1";

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.getWorldPosition(world);
    camera.getWorldPosition(eye);
    const dist = world.distanceTo(eye);
    const featured = useMallStore.getState().featuredId === section.id;
    const video = featured ? liveTexture(section.id) : null;

    // screen picture
    let map: THREE.Texture | null = null;
    if (video) map = video;
    else if (dist < POSTER_NEAR) map = getPoster(section.id);
    else if (dist > POSTER_FAR) dropPoster(section.id);
    if (screenMat.map !== map) {
      screenMat.map = map;
      screenMat.color.set(map ? "#ffffff" : dark);
      screenMat.needsUpdate = true;
    }
    if (isW1) {
      const t = useTutorial.getState();
      const k = t.revealed ? Math.min(1, (performance.now() - t.revealAt) / 1600) : 0;
      if (map) screenMat.color.setScalar(0.45 + 0.55 * k);
    }

    // campaign titles
    let overlay: THREE.Texture | null = null;
    if (featured && live) {
      if (live.owner !== section.id) {
        live.owner = section.id;
        live.acc = OVERLAY_UPDATE_INTERVAL;
        live.elapsed = 0;
      }
      live.elapsed += dt;
      live.acc += dt;
      if (live.acc >= OVERLAY_UPDATE_INTERVAL) {
        live.acc = 0;
        const ctx = live.c.getContext("2d");
        const v = video?.image as HTMLVideoElement | undefined;
        const t = v && Number.isFinite(v.currentTime) ? v.currentTime % CAMPAIGN_SECONDS : live.elapsed % CAMPAIGN_SECONDS;
        if (ctx) drawCampaignOverlay(ctx, live.c.width, live.c.height, campaign, t);
        live.tex.needsUpdate = true;
      }
      overlay = live.tex;
    } else if (dist < OVERLAY_NEAR && map) {
      overlay = getStaticOverlay(section);
    }
    if (overlayMat.map !== overlay) {
      overlayMat.map = overlay;
      overlayMat.visible = !!overlay;
      overlayMat.needsUpdate = true;
    }
  });

  return (
    <group ref={group} position={[position.x, position.y, position.z]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[FRAME_WIDTH, FRAME_HEIGHT, 0.1]} />
        <meshStandardMaterial color="#141210" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.002]} material={screenMat}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
      </mesh>
      <mesh position={[0, 0, 0.012]} material={overlayMat}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * (FRAME_WIDTH / 2 - 0.015), 0, 0.012]}>
          <boxGeometry args={[0.035, FRAME_HEIGHT + 0.02, 0.035]} />
          <meshStandardMaterial color="#e7c68f" emissive="#d8ad69" emissiveIntensity={0.7} metalness={0.68} roughness={0.24} />
        </mesh>
      ))}
    </group>
  );
}
