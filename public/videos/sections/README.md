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
