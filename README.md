# ShopNet — 3D Fashion Mall (greybox prototype)

Walk through a 30 ft wide fashion mall, hover a section for a preview, click to shop it, and return to exactly where you stood.
This is the **greybox** stage: shapes are placeholders. Photoreal assets come after this prototype is approved.

## Run it

Needs Node.js 20 or newer.

```
npm install
npm run dev
```

Open http://localhost:3000

## Controls

| Desktop | Mobile |
| --- | --- |
| Click once to capture the mouse, then **move the mouse to look** (full 360°, up/down limited) | **One finger** — look around |
| **Scroll** up / down — walk forward / back | **Two fingers** up / down, or hold ▲ / ▼ — walk |
| Aim the **centre dot** at a store — it highlights and shows a preview | **Tap** a store — turn to face it and preview |
| **Click** — enter the targeted store | **Tap again** — enter |
| W A S D / arrow keys — walk, strafe, turn · **Esc** frees the mouse | |
| Esc or "Back to mall" — close the shop | Back to mall |

If the browser refuses to capture the mouse, moving the cursor toward a screen edge turns the view instead.

Only **Women's Blazers** is open in this stage (first section on the left).

## Checks

```
npm run typecheck     # TypeScript
npm test              # walking + collision unit tests
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
  scene/              shell, lighting, sign textures
  sections/           bay, fixtures, hit volumes
  navigation/         walker (movement, collision), Controls (input)
  interaction/        hover picking, highlight light
  transitions/        open section, return to mall
shop/                 2D e-commerce only, no three.js
  components/         ProductCard, Filters, Rating
  preview/            FloatingPreview card
lib/
  bridge/             mallStore, shopStore, previewBridge (the only link between mall and shop)
  catalog/            types, mock catalogue, placeholder product images
  config/             mall dimensions (provisional), section registry
legacy/almirah/       previous prototype, kept for reference
```

## Pinned versions

Next.js 16.4.6 · React 19.3.1 · three 0.187.0 · @react-three/fiber 9.8.2 · @react-three/drei 10.7.9 · zustand 5.1.0 · TypeScript 6.0.3 · Tailwind 4.3.4
