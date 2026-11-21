"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W } from "@/lib/config/mall";

const VIDEO_POSTERS: Record<string, string> = {
  "women-blazers": "WOMEN'S TAILORING",
  "women-trousers": "THE PERFECT FIT",
  "women-tshirts": "EVERYDAY ESSENTIALS",
  "women-shirts": "THE NEW CLASSICS",
  "women-dresses": "DRESSED TO SHINE",
  "women-jeans": "DENIM, REDEFINED",
  "women-ethnic": "CRAFTED TRADITION",
  "women-skirts": "MOVE WITH GRACE",
  "women-jackets": "LAYER YOUR LOOK",
  "women-innerwear": "COMFORT, FIRST",
  "women-shoes": "STEP INTO STYLE",
  "women-handbags": "CARRY YOUR STORY",
  "women-accessories": "THE FINISHING TOUCH",
  "men-blazers": "TAILORED CONFIDENCE",
  "men-trousers": "MADE TO MOVE",
  "men-tshirts": "THE DAILY UNIFORM",
  "men-shirts": "SHARP BY NATURE",
  "men-jeans": "DENIM ESSENTIALS",
  "men-kurtas": "A MODERN HERITAGE",
  "men-jackets": "BUILT FOR LAYERS",
  "men-innerwear": "COMFORT, EVERY DAY",
  "men-accessories": "DETAILS MATTER",
  "men-shoes": "EVERY STEP COUNTS",
  "men-watches": "TIMELESS DESIGN",
};

function makeFallbackTexture(section: PlacedSection) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const women = section.gender === "women";
  const g = ctx.createLinearGradient(0, 0, 900, 675);
  if (women) {
    g.addColorStop(0, "#1d1a1c");
    g.addColorStop(0.55, "#8e7067");
    g.addColorStop(1, "#d2b99f");
  } else {
    g.addColorStop(0, "#101820");
    g.addColorStop(0.55, "#45545a");
    g.addColorStop(1, "#aa9579");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 900, 675);

  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#f4e3c4";
  ctx.beginPath();
  ctx.ellipse(700, 220, 210, 310, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f4e3c4";
  ctx.lineWidth = 2;
  for (let i = 0; i < 13; i++) {
    ctx.beginPath();
    ctx.moveTo(420 + i * 35, 0);
    ctx.lineTo(100 + i * 35, 675);
    ctx.stroke();
  }
  ctx.restore();

  const shade = ctx.createLinearGradient(0, 390, 0, 675);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.76)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 900, 675);
  ctx.fillStyle = "#e9c994";
  ctx.font = "600 21px Arial";
  ctx.letterSpacing = "7px";
  ctx.fillText("SHOPNET  /  SECTION FILM", 48, 58);
  ctx.fillStyle = "#fff8ee";
  ctx.font = "500 58px Georgia";
  ctx.fillText(VIDEO_POSTERS[section.id] ?? section.label.toUpperCase(), 48, 560, 800);
  ctx.fillStyle = "#e9c994";
  ctx.font = "500 18px Arial";
  ctx.letterSpacing = "5px";
  ctx.fillText("NEW SEASON  ·  DISCOVER THE COLLECTION", 50, 610);
  return canvas;
}

function VideoScreen({ section }: { section: PlacedSection }) {
  const camera = useThree((state) => state.camera);
  const group = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const fallback = useMemo(() => {
    const canvas = makeFallbackTexture(section);
    const texture = new THREE.CanvasTexture(canvas instanceof HTMLCanvasElement ? canvas : document.createElement("canvas"));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [section.id, section.label, section.gender]);

  useEffect(() => () => fallback.dispose(), [fallback]);

  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    videoRef.current = video;
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    setVideoTexture(texture);

    const onReady = () => setFrameReady(true);
    const onError = () => {
      setFailed(true);
      setFrameReady(false);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("error", onError);
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
      texture.dispose();
      videoRef.current = null;
    };
  }, []);

  useFrame(() => {
    const video = videoRef.current;
    const parent = group.current;
    if (!video || !parent) return;

    parent.updateWorldMatrix(true, false);
    const screenPosition = parent.getWorldPosition(new THREE.Vector3());
    const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
    const distance = screenPosition.distanceTo(cameraPosition);
    const inRange = distance < 23 && !document.hidden;

    if (inRange && !failed) {
      if (!video.src) {
        video.src = `/videos/sections/${section.id}.mp4`;
        video.load();
      }
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.paused) {
        void video.play().catch(() => undefined);
      } else if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA && video.error) {
        setFailed(true);
      }
    } else if (!video.paused) {
      video.pause();
    }
  });

  const x = section.side * (HALF_W - 0.205);
  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group ref={group} position={[x, 2.04, section.cz]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[3.24, 2.68, 0.13]} />
        <meshStandardMaterial color="#171512" metalness={0.62} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[3.08, 2.5]} />
        <meshBasicMaterial map={frameReady && !failed && videoTexture ? videoTexture : fallback} toneMapped={false} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.61, 0, 0.018]}>
          <boxGeometry args={[0.035, 2.7, 0.035]} />
          <meshStandardMaterial color="#e7c68f" emissive="#d8ad69" emissiveIntensity={0.8} metalness={0.68} roughness={0.24} />
        </mesh>
      ))}
      <mesh position={[0, 1.36, 0.018]}>
        <boxGeometry args={[3.24, 0.035, 0.035]} />
        <meshStandardMaterial color="#e7c68f" emissive="#d8ad69" emissiveIntensity={0.65} metalness={0.68} roughness={0.24} />
      </mesh>
    </group>
  );
}

export function SectionVideoPanel({ section }: { section: PlacedSection }) {
  return <VideoScreen section={section} />;
}
