# ShopNet — 3D Fashion Mall

Walk an S-shaped luxury fashion mall: **women's boutiques on your left** in the first curve, a store-free plaza,
then **men's boutiques on your right** in the second curve. No store ever faces another store; the other side of the
walkway is a planted atrium edge with printed-stone pillars. Click or tap any boutique to shop it, and you return to
exactly where you stood.

## Run it

Needs Node.js 20 or newer.

```
npm install
npm run dev
```

Open http://localhost:3000

## Controls

| Desktop | Phone / tablet |
| --- | --- |
| **Scroll down** — walk forward · **scroll up** — walk back (mouse wheel or trackpad) | **Swipe up** — walk forward · **swipe down** — walk back (or hold ▲ / ▼) |
| **Move the mouse / trackpad** — look around (full 360°). "Enter the mall" captures the mouse when the browser allows it | **Swipe left** — look left · **swipe right** — look right |
| **Click** a boutique — open it | **Tap** a boutique — open it |
| **Double-click** the walkway — stop looking around · **Look around** button (or L) — resume | **Double-tap** the walkway — stop looking around · **Look around** — resume |
| W / S or ↑ / ↓ walk (Shift = faster) · A / D or ← / → turn | |

The first visit starts with a five-step guided walk that ends by revealing the first boutique (Women's Blazers).

## Layout (locked Blueprint 0.7)

* Route: 8 m foyer → R14 m curve turning 210° (women, left) → 10 m plaza → R14 m curve turning 210° (men, right) → 6 m exit; 126.6 m, 5 m clothoid transitions.
* 30 ft section: 1.344 m atrium edge + 4.000 m walkway + 3.800 m boutique = 9.144 m.
* Boutiques: 4 m frontage with a 2.8 m framed portal; Men's Shoes and Watches are 8 m with a 5.6 m portal.
* Everything (walls, floor, ceiling, light lines, stores) is generated from one centreline in `lib/config/path.ts`, so pieces always meet without gaps.

## Campaign videos

Only the store the customer is actually looking at plays its film (one at a time); at most two others are kept ready
(one on phones). Every other screen shows a still poster. Everything pauses while the shop is open or the tab is hidden.
Served files are 720p (desktop) / 540p (phones) H.264 with 1 s keyframes — never smaller than the screen can show.
The 1080p masters stay in `assets/video-masters/` (Git LFS) and are not downloaded by visitors. See
`public/videos/sections/README.md` to re-encode.

## Checks

```
npm run typecheck     # TypeScript
npm test              # controls, layout and catalogue unit tests
npm run build         # production build
npm run check:photos  # confirms every product photo loads (needs internet)
```

## Product photos

Women's Blazers uses real fashion photographs from Unsplash, free under the [Unsplash License](https://unsplash.com/license);
photographers are credited in each product's gallery. They load from Unsplash's image CDN. Replace them with the brand's own
product photography before launch (`lib/catalog/photos.ts`).

`tests/e2e-run.py` is the browser test used during development (Python + Playwright).

## Structure

```
app/                  routes; the mall is mounted once in layout.tsx
  shop/[gender]/[category]/   2D shop page (opens over the paused mall)
components/           MallRoot (route sync), Hud
mall/                 3D only (React Three Fiber)
  scene/              shell (walls, floor, ceiling swept along the path), plaza, lighting, textures
  sections/           boutiques, divider fins, garment rails
  video/              campaign screens, video lifecycle manager, campaign artwork
  navigation/         walker (path position + head yaw), Controls (input), guided-walk logic
  interaction/        store picking, highlight light
  transitions/        open a store, return to the mall
shop/                 2D e-commerce only, no three.js
  components/         ProductCard, Filters, Rating
  preview/            FloatingPreview card
lib/
  bridge/             mallStore, shopStore, previewBridge (the only link between mall and shop)
  catalog/            types, mock catalogue, placeholder product images
  config/             centreline (path.ts), dimensions, store placement, walls
legacy/almirah/       previous prototype, kept for reference
```

## Pinned versions

Next.js 16.4.6 · React 19.3.1 · three 0.187.0 · @react-three/fiber 9.8.2 · @react-three/drei 10.7.9 · zustand 5.1.0 · TypeScript 6.0.3 · Tailwind 4.3.4
