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

function hash(value: string) {
  let result = 2166136261;
  for (const char of value) {
    result ^= char.charCodeAt(0);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/**
 * Store-specific luxury finishes.
 * Deliberately uses material grain, soft mineral mottling and subtle fluting;
 * no repeating arches, window outlines or decorative wallpaper motifs.
 */
export function getStoreWallpaper(
  gender: "women" | "men",
  sectionId: string = gender,
): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const cacheKey = `${gender}:${sectionId}`;
  const cached = wallpaperCache.get(cacheKey);
  if (cached) return cached;

  const womenPalettes = [
    ["#d7c7b3", "#bca58d", "#f0e6d8"],
    ["#cdb7a8", "#a98e7e", "#e7d8ca"],
    ["#c9c0ad", "#a69a82", "#e8e0d0"],
    ["#d8d0c2", "#b8a994", "#f0e9dd"],
    ["#bdb7a8", "#958e7f", "#ded7c9"],
  ];
  const menPalettes = [
    ["#77736d", "#494743", "#a29a8b"],
    ["#76665a", "#4d4139", "#9a8876"],
    ["#62696a", "#3e4749", "#939b98"],
    ["#6c645a", "#403c36", "#948777"],
    ["#77776e", "#4d5048", "#a0a095"],
  ];
  const palette = (gender === "women" ? womenPalettes : menPalettes)[hash(sectionId) % 5];
  const size = 768;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, palette[2]);
  base.addColorStop(0.45, palette[0]);
  base.addColorStop(1, palette[1]);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  let seed = hash(sectionId) || 73;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Cloudy mineral variation, blurred into the surface instead of a printed motif.
  ctx.save();
  ctx.filter = "blur(30px)";
  for (let i = 0; i < 38; i++) {
    const radius = 45 + random() * 135;
    ctx.beginPath();
    ctx.ellipse(
      random() * size,
      random() * size,
      radius,
      radius * (0.35 + random() * 0.8),
      random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = random() > 0.5
      ? "rgba(255,248,235,0.13)"
      : "rgba(42,35,28,0.10)";
    ctx.fill();
  }
  ctx.restore();

  // Fine tactile grain.
  for (let i = 0; i < 18000; i++) {
    const alpha = 0.012 + random() * 0.045;
    ctx.fillStyle = random() > 0.5
      ? `rgba(255,255,255,${alpha})`
      : `rgba(24,22,20,${alpha})`;
    const x = random() * size;
    const y = random() * size;
    const w = 1 + random() * 2.5;
    ctx.fillRect(x, y, w, 1 + random());
  }

  const variant = hash(sectionId) % 3;
  if (variant === 0) {
    // Subtle mineral veins: widely spaced and low contrast.
    ctx.save();
    ctx.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const x = random() * size;
      const y = random() * size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x + 90 + random() * 70, y + 30 + random() * 100,
        x - 40 + random() * 160, y + 180 + random() * 100,
        x + 180 + random() * 180, y + 260 + random() * 170,
      );
      ctx.strokeStyle = `rgba(245,231,209,${0.06 + random() * 0.07})`;
      ctx.lineWidth = 1 + random() * 2.4;
      ctx.stroke();
    }
    ctx.restore();
  } else if (variant === 1) {
    // Fine fluted plaster / textile grain.
    ctx.save();
    for (let x = 0; x < size; x += 7) {
      ctx.fillStyle = x % 14 === 0
        ? "rgba(255,248,236,0.055)"
        : "rgba(25,22,18,0.035)";
      ctx.fillRect(x, 0, 1, size);
    }
    ctx.restore();
  } else {
    // Very subtle brushed finish.
    ctx.save();
    for (let i = 0; i < 120; i++) {
      const y = random() * size;
      ctx.fillStyle = "rgba(255,248,236,0.025)";
      ctx.fillRect(0, y, size, 1);
    }
    ctx.restore();
  }

  const texture = makeCanvasTexture(canvas, 1.0, 1.0);
  wallpaperCache.set(cacheKey, texture);
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

  stoneTexture = makeCanvasTexture(canvas, 1.4, 1.4);
  return stoneTexture;
}
