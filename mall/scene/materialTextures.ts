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

  // two tall boiserie panels so the back wall reads as a finished boutique wall, not a flat colour
  if (sectionId !== "mall-limestone") {
    const inset = size * 0.06;
    const pw = (size - inset * 3) / 2;
    for (const k of [0, 1]) {
      const x = inset + k * (pw + inset);
      ctx.save();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(255,250,240,0.5)";
      ctx.strokeRect(x, size * 0.08, pw, size * 0.84);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(40,30,20,0.28)";
      ctx.strokeRect(x + 6, size * 0.08 + 6, pw - 12, size * 0.84 - 12);
      ctx.restore();
    }
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

type Rnd = () => number;
function rng(seed: number): Rnd {
  let v = seed >>> 0 || 1;
  return () => ((v = (v * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Raised panel moulding: light edge top-left, shadow edge bottom-right, like real boiserie. */
function moulding(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, depth = 5) {
  g.save();
  g.lineWidth = depth;
  g.strokeStyle = "rgba(255,252,244,0.55)";
  g.beginPath();
  g.moveTo(x, y + h);
  g.lineTo(x, y);
  g.lineTo(x + w, y);
  g.stroke();
  g.strokeStyle = "rgba(70,55,38,0.32)";
  g.beginPath();
  g.moveTo(x + w, y);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.stroke();
  g.lineWidth = 1.5;
  g.strokeStyle = "rgba(70,55,38,0.22)";
  g.strokeRect(x + depth + 2, y + depth + 2, w - 2 * depth - 4, h - 2 * depth - 4);
  g.restore();
}

/** Woven silk / grasscloth fibres: fine horizontal slubs with soft colour drift. */
function silk(g: CanvasRenderingContext2D, w: number, h: number, base: string, r: Rnd) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    const a = 0.03 + r() * 0.05;
    g.fillStyle = r() > 0.5 ? `rgba(255,250,240,${a})` : `rgba(90,72,50,${a * 0.8})`;
    g.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < 2600; i++) {
    const a = 0.04 + r() * 0.08;
    g.fillStyle = r() > 0.55 ? `rgba(255,248,232,${a})` : `rgba(80,62,40,${a})`;
    g.fillRect(r() * w, r() * h, 6 + r() * 40, 1 + (r() > 0.85 ? 1 : 0));
  }
}

/**
 * Entrance wall covering: champagne silk set in tall boiserie panels with a brass dado line.
 * One texture = one 1.6 m wide, full-height (4.2 m) wall module.
 */
export function getShopnetWallpaper(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const hit = extraCache.get("entrance-boiserie");
  if (hit) return hit;
  const w = 512;
  const h = 1344; // 4.2 m tall at 320 px per metre
  const { c, g } = canvas2d(w, h);
  if (!g) return null;
  const r = rng(4021);
  silk(g, w, h, "#ddd2c1", r);
  const m = (metres: number) => h - metres * 320; // canvas y for a height in metres
  const side = 0.12 * 320;
  // crown band and skirting zone
  g.fillStyle = "rgba(255,250,242,0.35)";
  g.fillRect(0, 0, w, m(4.02));
  moulding(g, side, m(3.86), w - 2 * side, m(1.02) - m(3.86), 6);
  moulding(g, side, m(0.82), w - 2 * side, m(0.16) - m(0.82), 5);
  // brass dado rail
  g.fillStyle = "#b8955c";
  g.fillRect(0, m(0.93), w, 7);
  g.fillStyle = "rgba(255,236,190,0.6)";
  g.fillRect(0, m(0.93), w, 2);
  const t = makeCanvasTexture(c, 1, 1);
  t.wrapT = THREE.ClampToEdgeWrapping;
  extraCache.set("entrance-boiserie", t);
  return t;
}

/** Herringbone oak for boutique floors (one texture = 1.2 m square). */
export function getHerringbone(tone: "light" | "smoked"): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const key = "herringbone-" + tone;
  const hit = extraCache.get(key);
  if (hit) return hit;
  const size = 512;
  const { c, g } = canvas2d(size, size);
  if (!g) return null;
  const r = rng(tone === "light" ? 88 : 99);
  const pal = tone === "light" ? ["#c9a982", "#bf9c73", "#d4b48d", "#b8946a"] : ["#6e5641", "#5f4936", "#7a604a", "#54402f"];
  g.fillStyle = pal[0];
  g.fillRect(0, 0, size, size);
  // chevron parquet: columns of 45° planks, alternating direction column by column
  const cols = 4;
  const cw = size / cols;
  const pw = 30; // plank width in px
  const step = pw * Math.SQRT2;
  for (let col = 0; col < cols; col++) {
    const dir = col % 2 === 0 ? 1 : -1;
    g.save();
    g.beginPath();
    g.rect(col * cw, 0, cw, size);
    g.clip();
    for (let y = -cw - step; y < size + cw; y += step) {
      g.save();
      g.translate(col * cw + cw / 2, y);
      g.rotate(dir * Math.PI / 4);
      const len = cw * Math.SQRT2 + 4;
      g.fillStyle = pal[Math.floor(r() * pal.length)];
      g.fillRect(-len / 2, -pw / 2, len, pw);
      for (let i = 0; i < 5; i++) {
        g.fillStyle = `rgba(40,25,10,${0.05 + r() * 0.08})`;
        g.fillRect(-len / 2, -pw / 2 + r() * pw, len, 1);
      }
      g.strokeStyle = "rgba(30,18,8,0.5)";
      g.lineWidth = 1.2;
      g.strokeRect(-len / 2, -pw / 2, len, pw);
      g.restore();
    }
    g.restore();
    g.fillStyle = "rgba(30,18,8,0.55)";
    g.fillRect(col * cw, 0, 1.5, size);
  }
  const t = makeCanvasTexture(c, 1, 1);
  extraCache.set(key, t);
  return t;
}

/** Walnut slats for the boutique side walls (one texture = 3.8 m deep wall face). */
export function getWalnutSlats(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const hit = extraCache.get("walnut");
  if (hit) return hit;
  const w = 1024;
  const h = 512;
  const { c, g } = canvas2d(w, h);
  if (!g) return null;
  const r = rng(31);
  g.fillStyle = "#2a1d14";
  g.fillRect(0, 0, w, h);
  const n = 44;
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const x = i * sw;
    const tone = 0.85 + r() * 0.3;
    const grad = g.createLinearGradient(x, 0, x + sw, 0);
    grad.addColorStop(0, `rgb(${Math.round(92 * tone)},${Math.round(64 * tone)},${Math.round(44 * tone)})`);
    grad.addColorStop(0.5, `rgb(${Math.round(118 * tone)},${Math.round(84 * tone)},${Math.round(58 * tone)})`);
    grad.addColorStop(1, `rgb(${Math.round(84 * tone)},${Math.round(58 * tone)},${Math.round(40 * tone)})`);
    g.fillStyle = grad;
    g.fillRect(x + 2, 0, sw - 4, h);
    for (let k = 0; k < 14; k++) {
      g.fillStyle = `rgba(30,18,10,${0.08 + r() * 0.1})`;
      g.fillRect(x + 2 + r() * (sw - 6), 0, 1, h);
    }
  }
  const t = makeCanvasTexture(c, 1, 1);
  extraCache.set("walnut", t);
  return t;
}

/**
 * A single leaf-cluster sprite (transparent background): dozens of overlapping glossy leaves
 * with midribs and light/dark sides. Used on crossed cards to build hedges and topiary.
 */
export function getLeafCluster(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const hit = extraCache.get("leaves");
  if (hit) return hit;
  const size = 512;
  const { c, g } = canvas2d(size, size);
  if (!g) return null;
  const r = rng(7);
  g.clearRect(0, 0, size, size);
  for (let i = 0; i < 150; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r()) * 200;
    const x = size / 2 + Math.cos(a) * rad;
    const y = size / 2 + Math.sin(a) * rad;
    const len = 34 + r() * 30;
    const wid = len * (0.38 + r() * 0.12);
    const rot = a + (r() - 0.5) * 1.4;
    const hue = 88 + r() * 26;
    const light = 16 + r() * 18 + (rad < 120 ? 0 : 5);
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    const grad = g.createLinearGradient(0, -wid / 2, 0, wid / 2);
    grad.addColorStop(0, `hsl(${hue}, ${48 + r() * 20}%, ${light + 10}%)`);
    grad.addColorStop(0.55, `hsl(${hue}, ${50 + r() * 18}%, ${light}%)`);
    grad.addColorStop(1, `hsl(${hue + 6}, 45%, ${light - 8}%)`);
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(-len / 2, 0);
    g.quadraticCurveTo(0, -wid, len / 2, 0);
    g.quadraticCurveTo(0, wid, -len / 2, 0);
    g.fill();
    g.strokeStyle = `hsla(${hue}, 30%, ${light + 22}%, 0.55)`;
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-len / 2 + 3, 0);
    g.lineTo(len / 2 - 4, 0);
    g.stroke();
    // specular sheen on half the leaf
    g.fillStyle = "rgba(255,255,240,0.035)";
    g.beginPath();
    g.moveTo(-len / 2, 0);
    g.quadraticCurveTo(0, -wid, len / 2, 0);
    g.fill();
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  extraCache.set("leaves", t);
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
