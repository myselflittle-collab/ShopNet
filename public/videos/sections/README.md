# ShopNet section campaign videos

## Where to put the files

Copy the 24 MP4 files into this folder:

`ShopNet/public/videos/sections/`

The website loads each section's video using its exact section ID. Keep filenames lowercase, use hyphens, and do not add spaces or suffixes such as `(1)`.

## Required filenames

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

## Video settings

The wall-mounted section LCDs now use a native 16:9 display area. Your Google Flow 720p 16:9 videos fit without stretching or cropping.

Recommended:
- Resolution: 1280 × 720 (720p)
- Aspect ratio: 16:9
- Container: MP4
- Video codec: H.264
- Frame rate: 24 or 30 fps
- Audio: not required; screens autoplay muted and loop

## Import steps on Windows

1. Open the local ShopNet project folder.
2. Open `public`. Create `videos`, then create `sections` inside it if they do not exist.
3. Copy all 24 MP4 files into `public/videos/sections/`.
4. Rename them to match the list above exactly.
5. Keep the filenames and extensions exactly as shown.
6. Refresh `http://localhost:3000`. If a video does not appear, check its filename and restart `npm run dev`.

Example:

```text
ShopNet/
  public/
    videos/
      sections/
        women-blazers.mp4
        women-trousers.mp4
        women-tshirts.mp4
        ...
        men-watches.mp4
```

The mall requests a section video when the visitor approaches that section's screen. The video is muted, loops, and pauses when the visitor moves away or the tab is hidden.


## Animated LCD text sequence

Every section LCD plays its matching MP4 underneath a transparent animated text layer. The sequence follows the video time and repeats on the 8-second campaign loop:

- **0–3 seconds:** large animated section name.
- **3–6 seconds:** the name moves into a smaller heading; two section-specific lines appear with a typewriter effect.
- **6–8 seconds:** a section-specific collection/offer headline appears with a horizontally moving ticker.

The 24 distinct text sets are defined in `mall/sections/SectionVideoPanel.tsx` in the `CAMPAIGNS` object. You can edit each section's `title`, `lineOne`, `lineTwo`, `offerTitle`, and `offerTicker` there.

The current ticker messages promote collection themes and styling ideas. They deliberately do not claim a discount, price reduction, or limited-time sale that has not been configured. Add real discount amounts only after the actual promotion has been decided.

The animated overlay is drawn only while the visitor is within the screen's viewing range and updates at a limited rate to avoid unnecessarily rendering all 24 overlays continuously.
