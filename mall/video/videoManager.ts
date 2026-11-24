"use client";

import * as THREE from "three";
import { blocked, occluderSegments, type Segment } from "@/lib/config/architecture";
import { SECTIONS, lcdLocal, storeToWorld, type PlacedSection } from "@/lib/config/sections";
import { SCREEN_WIDTH } from "./campaignOverlay";

/**
 * Campaign video lifecycle (locked VID-001…004).
 *
 *  DORMANT  static offline poster only; video element unloaded, texture disposed, references dropped
 *  READY    video loaded with its first frame decoded, paused — no texture uploads
 *  PLAYING  the featured store only
 *
 * Caps (they include grace and pre-warm slots): PLAYING 1 everywhere, READY 2 on desktop, 1 on phones.
 * The featured store is the screen the customer is actually looking at (visible fraction, size on
 * screen, facing angle, centrality). Path position is only a tie-breaker.
 * Everything pauses while the 2D shop is open or the tab is hidden.
 */

export type VideoState = "dormant" | "ready" | "playing";

interface Slot {
  id: string;
  state: VideoState;
  video: HTMLVideoElement | null;
  texture: THREE.VideoTexture | null;
  hasFrame: boolean;
  failed: boolean;
}

const slots = new Map<string, Slot>(SECTIONS.map((s) => [s.id, { id: s.id, state: "dormant", video: null, texture: null, hasFrame: false, failed: false }]));

let segments: Segment[] | null = null;
const samples = new Map<string, { x: number; z: number }[]>();
const normals = new Map<string, { x: number; z: number }>();

function lcdSamples(s: PlacedSection) {
  let pts = samples.get(s.id);
  if (!pts) {
    const l = lcdLocal(s);
    pts = [-0.48, -0.24, 0, 0.24, 0.48].map((f) => storeToWorld(s, l.x + f * SCREEN_WIDTH, l.z));
    samples.set(s.id, pts);
    const a = storeToWorld(s, 0, 0);
    const b = storeToWorld(s, 0, 1);
    normals.set(s.id, { x: b.x - a.x, z: b.z - a.z });
  }
  return pts;
}

export const videoConfig = {
  isPhone: false,
  readyCap: 2,
  quality: "720" as "720" | "540",
};

export function configureVideo() {
  if (typeof window === "undefined") return;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.screen.width, window.screen.height) < 820;
  videoConfig.isPhone = coarse && small;
  videoConfig.readyCap = videoConfig.isPhone ? 1 : 2;
  // On-screen LCD width never exceeds ~1,220 device px on desktop or ~510 on phones, so these
  // sizes always carry at least as many pixels as the screen can show.
  videoConfig.quality = videoConfig.isPhone ? "540" : "720";
}

export function videoSrc(id: string) {
  return `/videos/sections/${videoConfig.quality}/${id}.mp4`;
}

export function posterSrc(id: string) {
  return `/videos/posters/${id}.webp`;
}

function ensureElement(slot: Slot) {
  if (slot.video) return slot.video;
  const v = document.createElement("video");
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.crossOrigin = "anonymous";
  v.preload = "auto";
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  v.addEventListener("loadeddata", () => {
    slot.hasFrame = true;
  });
  v.addEventListener("error", () => {
    slot.failed = true;
    release(slot);
  });
  v.src = videoSrc(slot.id);
  v.load();
  const t = new THREE.VideoTexture(v);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  slot.video = v;
  slot.texture = t;
  return v;
}

/** DORMANT: request the browser to unload the media, dispose the GPU texture, drop references. */
function release(slot: Slot) {
  const v = slot.video;
  if (v) {
    v.pause();
    v.removeAttribute("src");
    v.load();
  }
  slot.texture?.dispose();
  slot.video = null;
  slot.texture = null;
  slot.hasFrame = false;
  slot.state = "dormant";
}

function setState(slot: Slot, state: VideoState, paused: boolean) {
  if (slot.failed) state = "dormant";
  if (state === "dormant") {
    if (slot.state !== "dormant") release(slot);
    return;
  }
  const v = ensureElement(slot);
  slot.state = state;
  if (state === "playing" && !paused) {
    if (v.paused) void v.play().catch(() => undefined);
  } else if (!v.paused) {
    v.pause();
  }
}

/** The texture an LCD should show right now, or null for its poster. */
export function liveTexture(id: string): THREE.VideoTexture | null {
  const slot = slots.get(id);
  if (!slot || slot.state !== "playing" || !slot.hasFrame || !slot.texture) return null;
  return slot.texture;
}

export function stateOf(id: string): VideoState {
  return slots.get(id)?.state ?? "dormant";
}

const v3 = new THREE.Vector3();

/** How strongly the customer is looking at a store's screen (0 = not visible). */
function score(s: PlacedSection, camera: THREE.PerspectiveCamera, eye: THREE.Vector3, forward: THREE.Vector3) {
  if (!segments) segments = occluderSegments();
  const pts = lcdSamples(s);
  const mid = pts[2];
  const dist = Math.hypot(mid.x - eye.x, mid.z - eye.z);
  if (dist > 26) return { score: 0, visible: 0 };
  let visible = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of pts) {
    v3.set(p.x, 2.04, p.z).project(camera);
    if (v3.z > 1 || v3.z < -1 || Math.abs(v3.x) > 1 || Math.abs(v3.y) > 1) continue;
    if (blocked(eye.x, eye.z, p.x, p.z, segments)) continue;
    visible++;
    minX = Math.min(minX, v3.x);
    maxX = Math.max(maxX, v3.x);
  }
  const frac = visible / pts.length;
  if (frac === 0) return { score: 0, visible: 0 };
  const n = normals.get(s.id)!;
  const toEye = { x: eye.x - mid.x, z: eye.z - mid.z };
  const facing = Math.max(0, (n.x * toEye.x + n.z * toEye.z) / (Math.hypot(n.x, n.z) * Math.hypot(toEye.x, toEye.z)));
  const dir = { x: mid.x - eye.x, z: mid.z - eye.z };
  const centrality = Math.max(0, (dir.x * forward.x + dir.z * forward.z) / Math.hypot(dir.x, dir.z));
  const size = Math.max(0.02, maxX - minX);
  return { score: frac * size * Math.sqrt(facing) * (0.4 + 0.6 * centrality), visible: frac };
}

const manager = {
  featured: null as string | null,
  challenger: null as string | null,
  challengerSince: 0,
  lostSince: 0,
  lastFeatured: null as string | null,
  lastFeaturedUntil: 0,
  lastEval: 0,
};

const forward = new THREE.Vector3();
const eye = new THREE.Vector3();

/**
 * Called every frame by the mall. Re-scores at 10 Hz and enforces the caps.
 * `enabled` is false during the tutorial (before the first boutique is revealed).
 */
export function updateVideos(
  camera: THREE.PerspectiveCamera,
  opts: { paused: boolean; enabled: boolean; direction: number; s: number },
): string | null {
  const now = performance.now();
  if (now - manager.lastEval < 100) return manager.featured;
  manager.lastEval = now;
  camera.getWorldPosition(eye);
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const scored = opts.enabled
    ? SECTIONS.map((s) => ({ s, ...score(s, camera, eye, forward) })).filter((r) => r.visible >= 0.4)
    : [];
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const current = manager.featured;
  const currentScore = scored.find((r) => r.s.id === current)?.score ?? 0;

  if (!best) {
    if (current) {
      if (!manager.lostSince) manager.lostSince = now;
      else if (now - manager.lostSince > 600) {
        manager.lastFeatured = current;
        manager.lastFeaturedUntil = now + 5000;
        manager.featured = null;
      }
    }
  } else if (!current) {
    manager.featured = best.s.id;
    manager.lostSince = 0;
  } else if (best.s.id !== current) {
    if (currentScore === 0) {
      if (!manager.lostSince) manager.lostSince = now;
    } else {
      manager.lostSince = 0;
    }
    const beats = best.score > currentScore * 1.25;
    if (beats && manager.challenger === best.s.id) {
      if (now - manager.challengerSince > 150 || (manager.lostSince && now - manager.lostSince > 600)) {
        manager.lastFeatured = current;
        manager.lastFeaturedUntil = now + 5000;
        manager.featured = best.s.id;
        manager.challenger = null;
        manager.lostSince = 0;
      }
    } else if (beats) {
      manager.challenger = best.s.id;
      manager.challengerSince = now;
    }
  } else {
    manager.lostSince = 0;
    manager.challenger = null;
  }

  // READY order: next visible candidate, next store in the direction of travel, previous featured (grace).
  const want: string[] = [];
  const push = (id: string | null | undefined) => {
    if (id && id !== manager.featured && !want.includes(id) && want.length < videoConfig.readyCap) want.push(id);
  };
  if (opts.enabled) {
    push(scored.find((r) => r.s.id !== manager.featured)?.s.id);
    const dir = opts.direction >= 0 ? 1 : -1;
    const ahead = SECTIONS.filter((s) => (s.sMid - opts.s) * dir > 0 && Math.abs(s.sMid - opts.s) < 14).sort(
      (a, b) => Math.abs(a.sMid - opts.s) - Math.abs(b.sMid - opts.s),
    );
    push(ahead[0]?.id);
    if (now < manager.lastFeaturedUntil) push(manager.lastFeatured);
  }

  for (const slot of slots.values()) {
    if (slot.id === manager.featured) setState(slot, "playing", opts.paused);
    else if (want.includes(slot.id)) setState(slot, "ready", true);
    else setState(slot, "dormant", true);
  }
  return manager.featured;
}

/** Pause or resume immediately (shop opened / tab hidden), without waiting for the next evaluation. */
export function pauseAll(paused: boolean) {
  for (const slot of slots.values()) {
    if (!slot.video) continue;
    if (paused || slot.state !== "playing") slot.video.pause();
    else void slot.video.play().catch(() => undefined);
  }
}

/** Counts for tests and the developer overlay. */
export function videoStats() {
  let playing = 0;
  let ready = 0;
  let elements = 0;
  for (const s of slots.values()) {
    if (s.state === "playing") playing++;
    if (s.state === "ready") ready++;
    if (s.video) elements++;
  }
  return { playing, ready, elements, featured: manager.featured };
}

/** Release everything (WebGL context lost, or the mall unmounts). */
export function releaseAll() {
  for (const slot of slots.values()) release(slot);
  manager.featured = null;
}
