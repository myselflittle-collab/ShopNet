# ShopNet video assets

This folder supports three video groups: a curved galaxy canopy film, a campaign film for each storefront, and a store-overview film at the far end of each storefront.

## 1. Galaxy canopy (optional)

Import the galaxy video as:

- `public/videos/galaxy-ceiling.mp4`

The ceiling is a vaulted curved surface. This video is mapped across the full canopy and loops muted. Until it is present, a vivid animated blue/cyan/purple spiral-galaxy shader is used automatically.

Recommended: 2560x1440 or 1920x1080, H.264 MP4, 24–30 fps, 12–25 seconds, no audio, slow nebula movement, dense stars, deep electric blue/cyan, purple and pink highlights. Keep the brightest spiral detail near the middle of the frame.

## 2. Storefront campaign films

These retain the existing wall-mounted LCD screen at the side wall of each store. Use the exact filenames:

- `women-blazers.mp4`
- `women-trousers.mp4`
- `women-tshirts.mp4`
- `women-shirts.mp4`
- `women-dresses.mp4`
- `women-jeans.mp4`
- `women-ethnic.mp4`
- `women-skirts.mp4`
- `women-jackets.mp4`
- `women-innerwear.mp4`
- `women-shoes.mp4`
- `women-handbags.mp4`
- `women-accessories.mp4`
- `men-blazers.mp4`
- `men-trousers.mp4`
- `men-tshirts.mp4`
- `men-shirts.mp4`
- `men-jeans.mp4`
- `men-kurtas.mp4`
- `men-jackets.mp4`
- `men-innerwear.mp4`
- `men-accessories.mp4`
- `men-shoes.mp4`
- `men-watches.mp4`

## 3. Store overview films

Each store also has a separate, larger LCD at its far end. It is intended to explain the section, collection, current promotions, highlights and brand story. Use:

- `women-blazers-overview.mp4`
- `women-trousers-overview.mp4`
- `women-tshirts-overview.mp4`
- `women-shirts-overview.mp4`
- `women-dresses-overview.mp4`
- `women-jeans-overview.mp4`
- `women-ethnic-overview.mp4`
- `women-skirts-overview.mp4`
- `women-jackets-overview.mp4`
- `women-innerwear-overview.mp4`
- `women-shoes-overview.mp4`
- `women-handbags-overview.mp4`
- `women-accessories-overview.mp4`
- `men-blazers-overview.mp4`
- `men-trousers-overview.mp4`
- `men-tshirts-overview.mp4`
- `men-shirts-overview.mp4`
- `men-jeans-overview.mp4`
- `men-kurtas-overview.mp4`
- `men-jackets-overview.mp4`
- `men-innerwear-overview.mp4`
- `men-accessories-overview.mp4`
- `men-shoes-overview.mp4`
- `men-watches-overview.mp4`

## Playback and export

- Landscape 16:9.
- 1920x1080 recommended; 1280x720 acceptable for smaller files.
- MP4 / H.264, 24–30 fps.
- 8–20 seconds for campaign loops; 20–45 seconds for overview films.
- No audio track: autoplay is muted.
- Use a slow editorial camera movement, fabric movement, model movement, or close-up product shots.
- Keep essential text inside the central safe area; ShopNet's screens add section titles and branding.
- Aim for 3–8 MB per short campaign; overview videos may be larger but should remain compressed.

Videos are loaded only when a visitor approaches a relevant screen and pause when the visitor leaves or switches browser tabs. The current code uses a separate fallback visual if a file is missing. The exact import map is recorded in `manifest.json`.
