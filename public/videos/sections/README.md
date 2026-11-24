# ShopNet campaign videos

The 24 campaign films are served in two sizes:

* `720/<section-id>.mp4` — desktops, laptops and tablets
* `540/<section-id>.mp4` — phones

and a still poster for every screen that is not playing: `../posters/<section-id>.webp`.

The 1080p originals live in `assets/video-masters/<section-id>.mp4` (Git LFS). They are kept unchanged and are not
downloaded by visitors. An LCD in the mall is never wider than about 1,220 device pixels on a desktop (≈510 on a
phone), so 1280×720 and 960×540 always carry at least the detail the screen can show.

## Re-encoding (after replacing a master)

Requires ffmpeg. Same frames, 1 s keyframes for instant loops, `faststart` so playback starts before the whole file
arrives, and no audio track (the mall plays videos muted):

```
id=women-blazers
common="-an -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -g 24 -keyint_min 24 -sc_threshold 0 -movflags +faststart"
ffmpeg -i assets/video-masters/$id.mp4 -vf scale=1280:720:flags=lanczos $common -crf 20 public/videos/sections/720/$id.mp4
ffmpeg -i assets/video-masters/$id.mp4 -vf scale=960:540:flags=lanczos  $common -crf 21 public/videos/sections/540/$id.mp4
ffmpeg -ss 4 -i assets/video-masters/$id.mp4 -frames:v 1 -vf scale=960:540:flags=lanczos -c:v libwebp -quality 84 public/videos/posters/$id.webp
```

Measured on all 24 films: SSIM against the master at the same size is at least 0.988 (720p) and 0.985 (540p);
totals are 76 MB (720p) and 45 MB (540p), versus 145 MB for the masters.
