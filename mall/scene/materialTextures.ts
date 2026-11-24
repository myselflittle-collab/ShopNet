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
  const size = 512;
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
  ctx.filter = "blur(20px)";
  for (let i = 0; i < 30; i++) {
    const radius = 30 + random() * 90;
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
  for (let i = 0; i < 8000; i++) {
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
    for (let x = 0; x < size; x += 5) {
      ctx.fillStyle = x % 10 === 0
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

  // flat base: a gradient here shows up as visible squares once the texture repeats
  ctx.fillStyle = "#e3ddd4";
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

const extraCache = new Map<string, THREE.CanvasTexture>();

function canvas2d(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d") };
}

/** ShopNet-branded wallpaper for both entrance walls: ivory silk with a gold monogram lattice. */
export function getShopnetWallpaper(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const hit = extraCache.get("shopnet-wallpaper");
  if (hit) return hit;
  const size = 1024;
  const { c, g } = canvas2d(size, size);
  if (!g) return null;
  const bg = g.createLinearGradient(0, 0, 0, size);
  bg.addColorStop(0, "#efe6d6");
  bg.addColorStop(1, "#e3d6c0");
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  // silk grain
  let seed = 911;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${0.03 + rnd() * 0.05})` : `rgba(90,70,40,${0.02 + rnd() * 0.03})`;
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 6, 1);
  }
  // diamond lattice
  const cell = 256;
  g.strokeStyle = "rgba(176,138,72,0.55)";
  g.lineWidth = 2;
  for (let k = -size; k <= size * 2; k += cell) {
    g.beginPath();
    g.moveTo(k, 0);
    g.lineTo(k + size, size);
    g.stroke();
    g.beginPath();
    g.moveTo(k, size);
    g.lineTo(k + size, 0);
    g.stroke();
  }
  // monogram in each diamond
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let y = 0; y <= size; y += cell) {
    for (let x = 0; x <= size; x += cell) {
      for (const [ox, oy] of [[0, 0], [cell / 2, cell / 2]]) {
        const cx = x + ox;
        const cy = y + oy;
        if (cx > size + 1 || cy > size + 1) continue;
        g.save();
        g.translate(cx, cy);
        g.fillStyle = "rgba(160,120,58,0.85)";
        g.font = '600 46px Georgia, "Times New Roman", serif';
        g.fillText("SN", 0, 2);
        g.strokeStyle = "rgba(176,138,72,0.6)";
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(0, 0, 40, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }
    }
  }
  const t = makeCanvasTexture(c, 1, 1);
  extraCache.set("shopnet-wallpaper", t);
  return t;
}

/** Fluted travertine / plaster panel used on the atrium walls and pillars. */
export function getFlutedStone(tone: "warm" | "cool" = "warm"): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const key = "fluted-" + tone;
  const hit = extraCache.get(key);
  if (hit) return hit;
  const w = 512;
  const h = 512;
  const { c, g } = canvas2d(w, h);
  if (!g) return null;
  const base = tone === "warm" ? ["#efe7da", "#d9cbb6"] : ["#e4e4e0", "#c9c9c3"];
  const flute = 32;
  for (let x = 0; x < w; x += flute) {
    const grad = g.createLinearGradient(x, 0, x + flute, 0);
    grad.addColorStop(0, base[1]);
    grad.addColorStop(0.35, base[0]);
    grad.addColorStop(0.7, base[0]);
    grad.addColorStop(1, base[1]);
    g.fillStyle = grad;
    g.fillRect(x, 0, flute, h);
  }
  let seed = tone === "warm" ? 51 : 77;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = rnd() > 0.5 ? `rgba(255,255,255,${0.04 * rnd()})` : `rgba(110,90,60,${0.05 * rnd()})`;
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 3);
  }
  const t = makeCanvasTexture(c, 1, 1);
  extraCache.set(key, t);
  return t;
}

/** Clipped boxwood foliage for the atrium planters. */
export function getFoliage(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const hit = extraCache.get("foliage");
  if (hit) return hit;
  const size = 256;
  const { c, g } = canvas2d(size, size);
  if (!g) return null;
  g.fillStyle = "#2f4a2b";
  g.fillRect(0, 0, size, size);
  let seed = 5;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < 2600; i++) {
    const l = 25 + rnd() * 30;
    g.fillStyle = `hsla(${95 + rnd() * 25}, ${35 + rnd() * 25}%, ${l}%, 0.9)`;
    g.beginPath();
    g.ellipse(rnd() * size, rnd() * size, 2 + rnd() * 4, 1 + rnd() * 2.5, rnd() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  const t = makeCanvasTexture(c, 1, 1);
  extraCache.set("foliage", t);
  return t;
}
