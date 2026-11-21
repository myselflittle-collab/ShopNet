"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W, MALL } from "@/lib/config/mall";
import { QUALITY_LIMITS, type MallQuality } from "@/mall/performance/quality";

type ScreenKind = "wall" | "overview";

const VIDEO_SLOGANS: Record<string, string> = {
  "women-blazers": "OWN THE ROOM",
  "women-trousers": "FIND YOUR PERFECT FIT",
  "women-tshirts": "MAKE EVERYDAY ICONIC",
  "women-shirts": "CONFIDENCE IN EVERY DETAIL",
  "women-dresses": "MAKE AN ENTRANCE",
  "women-jeans": "MOVE IN YOUR OWN WAY",
  "women-ethnic": "CELEBRATE YOUR ROOTS",
  "women-skirts": "LET YOUR STYLE FLOW",
  "women-jackets": "LAYER ON CONFIDENCE",
  "women-innerwear": "COMFORT IS YOUR POWER",
  "women-shoes": "TAKE EVERY STEP BOLDLY",
  "women-handbags": "CARRY WHAT MOVES YOU",
  "women-accessories": "MAKE THE LOOK YOURS",
  "men-blazers": "DRESS LIKE YOU MEAN IT",
  "men-trousers": "MADE FOR YOUR NEXT MOVE",
  "men-tshirts": "KEEP IT AUTHENTIC",
  "men-shirts": "SHOW UP SHARP",
  "men-jeans": "WRITE YOUR OWN RULES",
  "men-kurtas": "TRADITION WITH ATTITUDE",
  "men-jackets": "OWN EVERY SEASON",
  "men-innerwear": "START WITH COMFORT",
  "men-accessories": "THE DETAILS DEFINE YOU",
  "men-shoes": "LEAVE YOUR MARK",
  "men-watches": "MAKE EVERY MOMENT COUNT",
};

// A global candidate list keeps only the nearest one or two screens decoding video.
const VIDEO_CANDIDATES = new Map<string, number>();

function registerCandidate(id: string, distance: number) {
  VIDEO_CANDIDATES.set(id, distance);
}

function hasVideoSlot(id: string, limit: number) {
  const nearest = [...VIDEO_CANDIDATES.entries()]
    .filter(([, distance]) => Number.isFinite(distance))
    .sort((a, b) => a[1] - b[1])
    .slice(0, limit);
  return nearest.some(([candidateId]) => candidateId === id);
}

function createTitleCanvas(section: PlacedSection, kind: ScreenKind) {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Draw in the original 900x675 design coordinate system at a smaller texture size.
  ctx.scale(2 / 3, 2 / 3);
  const shade = ctx.createLinearGradient(0, 400, 0, 675);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.78)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 900, 675);

  ctx.fillStyle = "rgba(15,14,13,0.45)";
  ctx.fillRect(0, 0, 900, 92);
  ctx.fillStyle = "#edcf9c";
  ctx.font = "600 22px Arial, sans-serif";
  ctx.letterSpacing = "7px";
  ctx.fillText(kind === "overview" ? "SHOPNET  /  STORE OVERVIEW" : "SHOPNET  /  SECTION FILM", 48, 58);

  ctx.fillStyle = "#fff8ef";
  ctx.font = "500 58px Georgia, serif";
  ctx.fillText(section.label.toUpperCase(), 48, 548, 800);

  ctx.fillStyle = "#edcf9c";
  ctx.font = "600 19px Arial, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText(VIDEO_SLOGANS[section.id] ?? "DISCOVER YOUR STYLE", 50, 602, 800);
  return canvas;
}

function SectionVideoScreen({
  section,
  kind,
  quality,
}: {
  section: PlacedSection;
  kind: ScreenKind;
  quality: MallQuality;
}) {
  const camera = useThree((state) => state.camera);
  const group = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [titleTexture, setTitleTexture] = useState<THREE.CanvasTexture | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const screenPosition = useMemo(() => new THREE.Vector3(), []);

  const isOverview = kind === "overview";
  const width = isOverview ? 2.5 : 3.08;
  const height = isOverview ? 1.62 : 2.5;
  const videoId = section.id + ":" + kind;
  const limits = QUALITY_LIMITS[quality];

  useEffect(() => {
    const canvas = createTitleCanvas(section, kind);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.anisotropy = quality === "high" ? 4 : 1;
    next.needsUpdate = true;
    setTitleTexture(next);
    return () => next.dispose();
  }, [section.id, section.label, kind, quality]);

  useEffect(() => {
    if (quality === "low") return;

    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    videoRef.current = video;

    const onReady = () => setFrameReady(true);
    const onPlaying = () => setFrameReady(true);
    const onError = () => setFailed(true);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    return () => {
      VIDEO_CANDIDATES.delete(videoId);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      videoTextureRef.current?.dispose();
      videoTextureRef.current = null;
      videoRef.current = null;
    };
  }, [quality, videoId]);

  useFrame(() => {
    if (quality === "low") return;
    const parent = group.current;
    const video = videoRef.current;
    if (!parent || !video) return;

    parent.getWorldPosition(screenPosition);
    camera.getWorldPosition(cameraPosition);
    const distance = screenPosition.distanceTo(cameraPosition);
    const inRange = !document.hidden && !failed && distance < limits.videoDistance;
    registerCandidate(videoId, inRange ? distance : Number.POSITIVE_INFINITY);

    const wantsPlayback = inRange && !failed && hasVideoSlot(videoId, limits.maxVideoPlayers);
    if (wantsPlayback) {
      // Allocate a VideoTexture and request the MP4 only after this screen wins a playback slot.
      if (!videoTextureRef.current) {
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        videoTextureRef.current = texture;
        setVideoTexture(texture);
      }
      if (!video.src) {
        video.src = isOverview
          ? `/videos/sections/${section.id}-overview.mp4`
          : `/videos/sections/${section.id}.mp4`;
        video.load();
      }
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.paused) {
        void video.play().catch(() => undefined);
      }
    } else if (!video.paused) {
      video.pause();
    }
  });

  const x = isOverview
    ? section.side * (HALF_W - MALL.bayDepth / 2)
    : section.side * (HALF_W - 0.205);
  const z = isOverview ? section.z1 + 0.13 : section.cz;
  const y = isOverview ? 2.08 : 2.04;
  const rotationY = isOverview ? 0 : section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group ref={group} position={[x, y, z]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[width + 0.16, height + 0.18, 0.13]} />
        <meshBasicMaterial color="#171d27" />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[width, height]} />
        {frameReady && videoTexture && !failed ? (
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#0b1b2c" />
        )}
      </mesh>
      {!(frameReady && videoTexture && !failed) && titleTexture && (
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial map={titleTexture} transparent toneMapped={false} />
        </mesh>
      )}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 0.035), 0, 0.018]}>
          <boxGeometry args={[0.025, height + 0.16, 0.025]} />
          <meshBasicMaterial color="#d4b77f" toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[0, height / 2 + 0.07, 0.018]}>
        <boxGeometry args={[width + 0.12, 0.025, 0.025]} />
        <meshBasicMaterial color="#d4b77f" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function SectionVideoPanel({
  section,
  kind = "wall",
  quality,
}: {
  section: PlacedSection;
  kind?: ScreenKind;
  quality: MallQuality;
}) {
  return <SectionVideoScreen section={section} kind={kind} quality={quality} />;
}
