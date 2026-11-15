import * as THREE from "three";

/** Draws text onto a canvas texture (no font download needed). Greybox signage only. */
export function makeLabelTexture(
  lines: { text: string; size: number; weight?: number; color?: string; letterSpacing?: number }[],
  opts: { width: number; height: number; bg: string },
) {
  const scale = 2;
  const c = document.createElement("canvas");
  c.width = opts.width * scale;
  c.height = opts.height * scale;
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  g.fillStyle = opts.bg;
  g.fillRect(0, 0, opts.width, opts.height);
  const total = lines.reduce((s, l) => s + l.size * 1.25, 0);
  let y = (opts.height - total) / 2;
  g.textAlign = "center";
  g.textBaseline = "top";
  for (const l of lines) {
    g.font = `${l.weight ?? 600} ${l.size}px "Helvetica Neue", Arial, sans-serif`;
    g.fillStyle = l.color ?? "#222";
    if (l.letterSpacing && "letterSpacing" in g) {
      (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${l.letterSpacing}px`;
    }
    g.fillText(l.text, opts.width / 2, y);
    y += l.size * 1.25;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
