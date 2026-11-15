import type { ProductPhoto } from "./types";

/**
 * Real fashion photographs, free to use under the Unsplash License (https://unsplash.com/license).
 * Each entry's description is the photographer's own caption on Unsplash; products are named after what the photo shows.
 * Images are served by Unsplash's image CDN (images.unsplash.com), which supports on-the-fly cropping and resizing.
 * For the live store, replace these with the brand's own product photography.
 */
type Credit = ProductPhoto["credit"];
/** user = the photographer's Unsplash username where confirmed; otherwise the credit links to the photo page */
const c = (name: string, user: string | null, short: string): Credit => ({
  name,
  profile: user ? `https://unsplash.com/@${user}` : `https://unsplash.com/photos/${short}`,
  page: `https://unsplash.com/photos/${short}`,
});

export const PHOTO = {
  beigeWalk: { id: "photo-1559127452-829071a09516", alt: "Woman in a beige blazer and black shorts walking beside a wall", credit: c("kevin laminto", "kxvn_lx", "saF4-j_NiHc") },
  beigeLeaves: { id: "photo-1590873802674-55bb8f947bc5", alt: "Woman in a beige blazer over a black top, standing on dried leaves", credit: c("Roman Holoschchuk", "romchik_supreme", "ZnHpOhHnkDY") },
  whiteWall: { id: "photo-1618491609764-0dc04604a02a", alt: "Woman in a white blazer standing beside a beige concrete wall", credit: c("Guillaume Bolduc", "guibolduc", "ByT3r80omGs") },
  blackWhitePants: { id: "photo-1590399830217-8db7489f911e", alt: "Model in a black blazer and white trousers", credit: c("Andrea Bertozzini", "dreside", "VoertyDYyjA") },
  blackWhitePants2: { id: "photo-1590399830582-0bd885dee8e2", alt: "Model in the same black blazer with brown sunglasses", credit: c("Andrea Bertozzini", "dreside", "lpZNv5c-UEc") },
  green: { id: "photo-1572430980838-db7faca12b14", alt: "Woman in a green blazer", credit: c("Olenka V", "olva", "Wqcawg-Tako") },
  striped: { id: "photo-1628009658182-6df033109021", alt: "Woman in a black and white striped blazer wearing glasses", credit: c("Luísa Schetinger", "luschetinger", "Djc22j0dOOo") },
  blackBrownHair: { id: "photo-1586945957451-abab66e9f92d", alt: "Woman in a black blazer", credit: c("Levin Anton", "levyphoto", "08Fqp6sWQ-E") },
  blackChair: { id: "photo-1585487000372-963cbc845f01", alt: "Woman in a black blazer sitting on a wooden chair", credit: c("Kate Skumen", "skumen", "mxSo32sNYmA") },
  blackPearls: { id: "photo-1589995358068-cf709addda7a", alt: "Woman in a black blazer with pearl earrings", credit: c("Dmitry Berdnyk", null, "nafLtu3ShkE") },
  blackLaptop: { id: "photo-1594579254798-868734c3ed32", alt: "Woman in a black blazer working on a laptop", credit: c("Dmitry Rodionov", null, "Rx3TA3j5qpA") },
  orange: { id: "photo-1478803431644-b832801eefa7", alt: "Woman in an orange suit jacket", credit: c("accolorr", "accolorr", "XjIFw2ydEcU") },
  navyTan: { id: "photo-1576828831022-ca41d3905fb7", alt: "Woman in a navy and tan jacket", credit: c("Wesley Tingey", "wesleyphotography", "4WUwF9jVqMU") },
  blackSuit: { id: "photo-1707834102707-88d81a04e2f7", alt: "Woman in a black suit standing on a sidewalk", credit: c("Vital Sinkevich", "vitsinkevich", "9xrypURB1qM") },
} as const;

type PhotoKey = keyof typeof PHOTO;

/** Full look + a close-up crop of the same photo (+ another photo of the same garment where one exists). */
export function gallery(main: PhotoKey, alt?: PhotoKey, focus = { fx: 0.5, fy: 0.45 }): ProductPhoto[] {
  const m = PHOTO[main];
  const out: ProductPhoto[] = [
    { ...m, kind: "look" },
    { ...m, alt: `${m.alt} — close-up`, kind: "detail", ...focus },
  ];
  if (alt) out.splice(1, 0, { ...PHOTO[alt], kind: "alt" });
  return out;
}

/** URL on Unsplash's image CDN, cropped to the shop's 4:5 frame. */
export function photoUrl(p: ProductPhoto, width: number) {
  const h = Math.round(width * 1.25);
  const base = `https://images.unsplash.com/${p.id}?auto=format&fit=crop&w=${width}&h=${h}&q=80`;
  if (p.kind === "detail") return `${base}&crop=focalpoint&fp-x=${p.fx ?? 0.5}&fp-y=${p.fy ?? 0.45}&fp-z=2`;
  return `${base}&crop=faces,center`;
}
