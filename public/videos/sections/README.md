# ShopNet section videos

This folder contains the individual campaign films played on the video screen inside each 3D storefront.

## Required filenames

Import one video for each section using the exact filename:

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

The corresponding screen is placed on that category's feature wall. The video starts muted and loops automatically when the visitor is within approximately 17 metres of the screen. It pauses when the visitor walks away or the browser tab is hidden.

## Recommended export settings

- Landscape 16:9.
- 1920 × 1080 (1280 × 720 is acceptable for a smaller file).
- MP4 / H.264 video, baseline or main profile.
- 24–30 fps.
- 8–15 seconds per seamless loop.
- No audio track (autoplay is muted).
- Aim for 3–8 MB per clip; use a lower bitrate if needed.
- Keep the subject and text inside the central safe area so the screen crop does not cut them off.

## Visual direction

Generate one distinct campaign film per category, matching the collection shown by that storefront. Use a slow editorial camera move, fabric movement, model movement or product close-up. Avoid fast cuts, flashing and embedded captions; the screen itself adds the category title and ShopNet branding while the clip is loading.

## Current behaviour before videos are imported

The screens show a softly animated ShopNet campaign treatment with the category name. This is a temporary live graphic, not a static product photograph. Once the correctly named MP4 is placed in this folder, the screen automatically switches to that category's video when approached.

The runtime video map is also recorded in `manifest.json`.
