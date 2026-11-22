$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $root "public/videos/sections"
$optimizedDir = Join-Path $root "public/videos/optimized"
$posterDir = Join-Path $root "public/videos/posters"

$videoIds = @(
  "women-blazers", "women-trousers", "women-tshirts", "women-shirts",
  "women-dresses", "women-jeans", "women-ethnic", "women-skirts",
  "women-jackets", "women-innerwear", "women-shoes", "women-handbags",
  "women-accessories",
  "men-blazers", "men-trousers", "men-tshirts", "men-shirts",
  "men-jeans", "men-kurtas", "men-jackets", "men-innerwear",
  "men-accessories", "men-shoes", "men-watches"
)

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "FFmpeg was not found. Install FFmpeg, reopen PowerShell, then run npm run videos:prepare again."
}

New-Item -ItemType Directory -Force -Path $optimizedDir, $posterDir | Out-Null

function Get-VideoFrameHashes([string]$path) {
  $lines = @(& ffmpeg -v error -i $path -map 0:v:0 -f framemd5 - 2>$null)
  if ($LASTEXITCODE -ne 0) { throw "Could not compute frame hashes for $path" }
  return @($lines | Where-Object { $_ -match '^\s*0,\s*-?\d+,' })
}

foreach ($id in $videoIds) {
  $source = Join-Path $sourceDir "$id.mp4"
  $optimized = Join-Path $optimizedDir "$id.mp4"
  $poster = Join-Path $posterDir "$id.webp"
  if (-not (Test-Path $source)) { throw "Missing source video: $source" }

  Write-Host "Preparing $id..." -ForegroundColor Cyan

  # Stream-copy the video picture; no video re-encoding or resolution change.
  & ffmpeg -hide_banner -loglevel error -y -i $source -map 0:v:0 -c:v copy -an -movflags +faststart $optimized
  if ($LASTEXITCODE -ne 0) { throw "Lossless MP4 preparation failed for $id" }

  $sourceHashes = @(Get-VideoFrameHashes $source)
  $optimizedHashes = @(Get-VideoFrameHashes $optimized)
  if ($sourceHashes.Count -eq 0 -or $sourceHashes.Count -ne $optimizedHashes.Count) {
    throw "Frame-count verification failed for $id"
  }
  for ($i = 0; $i -lt $sourceHashes.Count; $i++) {
    if ($sourceHashes[$i] -ne $optimizedHashes[$i]) {
      throw "Decoded frame mismatch in $id at frame $i. Keep the original file."
    }
  }

  # The WebP poster is a separate still image; the MP4 video stream stays unchanged.
  & ffmpeg -hide_banner -loglevel error -y -ss 0.5 -i $optimized -frames:v 1 -vf "scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2" -c:v libwebp -quality 88 -compression_level 6 $poster
  if ($LASTEXITCODE -ne 0) { throw "Poster extraction failed for $id" }

  Write-Host "  Frame hashes match; poster created." -ForegroundColor Green
}

Write-Host ""
Write-Host "All 24 videos prepared. Original MP4s remain unchanged." -ForegroundColor Green
Write-Host "Prepared MP4s: public/videos/optimized"
Write-Host "Static posters: public/videos/posters"
