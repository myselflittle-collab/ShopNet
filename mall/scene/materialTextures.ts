"use client";

import * as THREE from "three";

const wallpaperCache = new Map<string, THREE.CanvasTexture>();
let stoneTexture: THREE.CanvasTexture | null = null;

function makeCanvasTexture(
  canvas: HTMLCanvasElement,
  repeatX: number,
  repeatY: number,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/** Subtle, seamless art-deco wallpaper. Generated locally; no remote image request. */
export function getStoreWallpaper(gender: "women" | "men"): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const cached = wallpaperCache.get(gender);
  if (cached) return cached;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const women = gender === "women";
  const base = ctx.createLinearGradient(0, 0, size, size);
  if (women) {
    base.addColorStop(0, "#eee8df");
    base.addColorStop(0.52, "#e6ded2");
    base.addColorStop(1, "#d9cdbd");
  } else {
    base.addColorStop(0, "#d9d8d3");
    base.addColorStop(0.52, "#cbc9c3");
    base.addColorStop(1, "#bdbab2");
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Fine linen-like grain, deterministic so the same finish is used across every bay.
  let seed = women ? 71 : 113;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 8500; i++) {
    const alpha = 0.018 + random() * 0.035;
    ctx.fillStyle = random() > 0.5
      ? `rgba(255,255,255,${alpha})`
      : `rgba(70,58,44,${alpha})`;
    const x = random() * size;
    const y = random() * size;
    ctx.fillRect(x, y, 1 + random() * 2, 1);
  }

  // Quiet vertical pin lines and art-deco arches.
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = women ? "rgba(157,125,83,0.22)" : "rgba(92,88,80,0.24)";
  for (let x = 0; x <= size; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, size);
    ctx.stroke();
  }
  ctx.strokeStyle = women ? "rgba(177,145,103,0.25)" : "rgba(153,133,102,0.21)";
  for (let y = -128; y < size + 128; y += 128) {
    for (let x = -64; x < size + 64; x += 128) {
      ctx.beginPath();
      ctx.arc(x + 64, y + 64, 42, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 22, y + 64);
      ctx.lineTo(x + 22, y + 116);
      ctx.lineTo(x + 106, y + 116);
      ctx.lineTo(x + 106, y + 64);
      ctx.stroke();
    }
  }
  ctx.restore();

  const texture = makeCanvasTexture(canvas, 1.5, 1.15);
  wallpaperCache.set(gender, texture);
  return texture;
}

/** Fine, low-contrast stone veining for the mall and boutique floors. */
export function getPolishedStoneTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  if (stoneTexture) return stoneTexture;

  const size = 768;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, "#e6e1d9");
  base.addColorStop(0.5, "#d9d2c8");
  base.addColorStop(1, "#eee9e1");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  let seed = 419;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 12000; i++) {
    const alpha = 0.012 + random() * 0.026;
    ctx.fillStyle = random() > 0.52
      ? `rgba(255,255,255,${alpha})`
      : `rgba(104,91,76,${alpha})`;
    ctx.fillRect(random() * size, random() * size, 1 + random() * 2, 1);
  }

  ctx.save();
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const x = random() * size;
    const y = random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(
      x + 80 + random() * 90, y - 110 + random() * 120,
      x + 180 + random() * 140, y + 100 + random() * 130,
      x + 300 + random() * 180, y - 40 + random() * 160,
    );
    ctx.strokeStyle = `rgba(150,132,108,${0.055 + random() * 0.045})`;
    ctx.lineWidth = 1 + random() * 2;
    ctx.stroke();
  }
  ctx.restore();

  stoneTexture = makeCanvasTexture(canvas, 2, 2);
  return stoneTexture;
}
