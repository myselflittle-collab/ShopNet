import type { BlazerStyle } from "./types";

/**
 * Placeholder product art (mock data only). Real product photography replaces this.
 * Returns an SVG data URI of a flat-lay blazer in the given colour.
 */
function shade(hex: string, amt: number) {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return "#" + c.map((v) => Math.round(v + (t - v) * p).toString(16).padStart(2, "0")).join("");
}

export function blazerImage(hex: string, style: BlazerStyle, bg = "#F3F1EC"): string {
  const dark = shade(hex, -0.3);
  const light = shade(hex, 0.18);
  const len = style === "cropped" ? 300 : style === "longline" ? 430 : 370;
  const body = `M150 70 L200 108 L250 70 L318 98 L344 ${len - 20} L300 ${len} L100 ${len} L56 ${len - 20} L82 98 Z`;
  const sleeveL = `M82 98 L40 120 L22 ${len - 40} L56 ${len - 30} L72 160 Z`;
  const sleeveR = `M318 98 L360 120 L378 ${len - 40} L344 ${len - 30} L328 160 Z`;
  const lapels =
    style === "double"
      ? `<path d="M150 70 L200 150 L176 210 L134 120 Z M250 70 L200 150 L224 210 L266 120 Z" fill="${dark}" opacity=".55"/>`
      : `<path d="M150 70 L200 170 L170 200 L132 116 Z M250 70 L200 170 L230 200 L268 116 Z" fill="${dark}" opacity=".55"/>`;
  const buttons =
    style === "double"
      ? [215, 260].flatMap((y) => [178, 222].map((x) => `<circle cx="${x}" cy="${y}" r="6" fill="${dark}"/>`)).join("")
      : `<circle cx="204" cy="222" r="6" fill="${dark}"/><circle cx="204" cy="262" r="6" fill="${dark}"/>`;
  const pockets =
    style === "cropped"
      ? ""
      : `<path d="M100 ${len - 110} h62 M238 ${len - 110} h62" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 480"><rect width="400" height="480" fill="${bg}"/><ellipse cx="200" cy="${len + 26}" rx="150" ry="10" fill="#000" opacity=".06"/><path d="${sleeveL}" fill="${light}" stroke="${dark}" stroke-width="2"/><path d="${sleeveR}" fill="${light}" stroke="${dark}" stroke-width="2"/><path d="${body}" fill="${hex}" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/><path d="M200 108 L200 ${len}" stroke="${dark}" stroke-width="2" opacity=".5"/>${lapels}${buttons}${pockets}<path d="M136 78 Q200 60 264 78" fill="none" stroke="${dark}" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
