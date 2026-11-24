"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMallStore } from "@/lib/bridge/mallStore";
import { SECTION_BY_ID } from "@/lib/config/sections";
import { catalog } from "@/lib/catalog/mockCatalog";
import { inr } from "@/lib/catalog/productImage";
import { photoUrl } from "@/lib/catalog/photos";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "@/mall/video/campaignOverlay";
import { LCD_FRAMES } from "./pick";

const W = 1280;
const H = 720;
const DISPLAY = '"Didot", "Bodoni 72", "Playfair Display", Georgia, "Times New Roman", serif';
const SANS = '"Helvetica Neue", "Segoe UI", system-ui, Arial, sans-serif';

const images = new Map<string, HTMLImageElement>();
function loadImage(src: string, onLoad: () => void) {
  let img = images.get(src);
  if (img) {
    if (img.complete && img.naturalWidth) return img;
    img.addEventListener("load", onLoad, { once: true });
    return img;
  }
  img = new Image();
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  img.addEventListener("load", onLoad, { once: true });
  img.src = src;
  images.set(src, img);
  return img;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function fitText(g: CanvasRenderingContext2D, text: string, max: number) {
  if (g.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && g.measureText(t + "…").width > max) t = t.slice(0, -1);
  return t + "…";
}

/** Draws the section preview as it appears on the store's screen. */
function draw(g: CanvasRenderingContext2D, id: string, redraw: () => void) {
  const s = SECTION_BY_ID[id];
  g.clearRect(0, 0, W, H);
  if (!s) return;
  const all = catalog.listBySection(id);
  const items = catalog.previewBySection(id, 4);
  const from = all.length ? Math.min(...all.map((p) => p.price)) : 0;

  // glass panel over the campaign film
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "rgba(14,12,10,0.82)");
  bg.addColorStop(1, "rgba(14,12,10,0.9)");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = "rgba(216,184,124,0.9)";
  g.lineWidth = 3;
  g.strokeRect(22, 22, W - 44, H - 44);

  g.fillStyle = "#d8b87c";
  g.font = `600 28px ${SANS}`;
  g.letterSpacing = "7px";
  g.fillText(s.gender === "women" ? "WOMEN" : "MEN", 64, 96);
  g.letterSpacing = "0px";
  g.fillStyle = "#f6efe3";
  g.font = `400 84px ${DISPLAY}`;
  g.fillText(s.label, 60, 180);
  g.font = `400 32px ${SANS}`;
  g.fillStyle = "rgba(246,239,227,0.82)";
  const meta = `${all.length} styles · from ${inr(from)}`;
  g.fillText(meta, W - 64 - g.measureText(meta).width, 172);

  // four product cards (square crops of the product photos)
  const gap = 24;
  const cw = (W - 128 - gap * 3) / 4;
  const top = 214;
  items.forEach((p, k) => {
    const x = 64 + k * (cw + gap);
    g.save();
    roundRect(g, x, top, cw, cw, 12);
    g.clip();
    g.fillStyle = "#2a2622";
    g.fillRect(x, top, cw, cw);
    const img = loadImage(photoUrl(p.photos[0], 400), redraw);
    if (img.complete && img.naturalWidth) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const side = Math.min(iw, ih);
      g.drawImage(img, (iw - side) / 2, Math.max(0, (ih - side) * 0.3), side, side, x, top, cw, cw);
    }
    g.restore();
    g.fillStyle = "#f6efe3";
    g.font = `400 26px ${SANS}`;
    g.fillText(fitText(g, p.name, cw), x, top + cw + 38);
    g.font = `600 28px ${SANS}`;
    g.fillStyle = "#e7cf9f";
    g.fillText(inr(p.price), x, top + cw + 74);
  });

  g.font = `500 32px ${SANS}`;
  g.fillStyle = "#f6efe3";
  const cta = matchMedia("(pointer: coarse)").matches ? "Tap the screen to enter the store" : "Click the screen to enter the store";
  g.fillText(cta, (W - g.measureText(cta).width) / 2, H - 50);
}

/**
 * The section preview lives on the boutique's own screen, flush with the back wall —
 * it appears only while the reticle or cursor rests on that screen.
 */
export function LcdPreview() {
  const hoveredId = useMallStore((s) => s.hoveredId);
  const group = useRef<THREE.Group>(null);
  const shown = useRef<string | null>(null);
  const fade = useRef(0);

  const { canvas, tex, mat } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    return { canvas, tex, mat };
  }, []);

  useEffect(() => () => {
    tex.dispose();
    mat.dispose();
  }, [tex, mat]);

  useEffect(() => {
    if (!hoveredId) return;
    shown.current = hoveredId;
    const g = canvas.getContext("2d");
    if (!g) return;
    let alive = true;
    const redraw = () => {
      if (!alive || shown.current !== hoveredId) return;
      draw(g, hoveredId, redraw);
      tex.needsUpdate = true;
    };
    redraw();
    const f = LCD_FRAMES[hoveredId];
    if (f && group.current) group.current.matrix.copy(f.matrix);
    return () => {
      alive = false;
    };
  }, [hoveredId, canvas, tex]);

  useFrame((_, dt) => {
    const target = hoveredId && useMallStore.getState().mode === "walking" ? 1 : 0;
    fade.current += (target - fade.current) * Math.min(1, dt * 10);
    if (Math.abs(target - fade.current) < 0.005) fade.current = target;
    mat.opacity = fade.current;
    if (group.current) group.current.visible = fade.current > 0.002 && !!shown.current;
  });

  return (
    <group ref={group} matrixAutoUpdate={false} visible={false}>
      <mesh position={[0, 0, 0.03]} material={mat} renderOrder={5}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
      </mesh>
    </group>
  );
}
