"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W } from "@/lib/config/mall";

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

const FALLBACK_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FALLBACK_FRAGMENT = `
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float wave = 0.5 + 0.5 * sin(uv.y * 5.8 - uTime * 0.34 + sin(uv.x * 7.0) * 1.6);
  float sweep = exp(-abs(uv.x - fract(uTime * 0.035 + uv.y * 0.18)) * 18.0);
  vec3 a = vec3(0.055, 0.075, 0.11);
  vec3 b = vec3(0.34, 0.21, 0.17);
  vec3 c = vec3(0.63, 0.43, 0.27);
  vec3 color = mix(a, b, smoothstep(0.12, 0.88, wave));
  color = mix(color, c, sweep * 0.32);
  color += 0.035 * sin(uTime * 0.18 + uv.y * 10.0);
  gl_FragColor = vec4(color, 1.0);
}`;

function createTitleCanvas(section: PlacedSection) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

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
  ctx.fillText("SHOPNET  /  SECTION FILM", 48, 58);

  ctx.fillStyle = "#fff8ef";
  ctx.font = "500 58px Georgia, serif";
  ctx.fillText(section.label.toUpperCase(), 48, 548, 800);

  ctx.fillStyle = "#edcf9c";
  ctx.font = "600 19px Arial, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText(VIDEO_SLOGANS[section.id] ?? "DISCOVER YOUR STYLE", 50, 602, 800);
  return canvas;
}

function SectionVideoScreen({ section }: { section: PlacedSection }) {
  const camera = useThree((state) => state.camera);
  const group = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [titleTexture, setTitleTexture] = useState<THREE.CanvasTexture | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const fallbackMaterial = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: FALLBACK_VERTEX,
      fragmentShader: FALLBACK_FRAGMENT,
      side: THREE.DoubleSide,
    }),
    [],
  );

  useEffect(() => () => fallbackMaterial.dispose(), [fallbackMaterial]);

  useEffect(() => {
    const canvas = createTitleCanvas(section);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.needsUpdate = true;
    setTitleTexture(next);
    return () => next.dispose();
  }, [section.id, section.label]);

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
    texture.generateMipmaps = false;
    setVideoTexture(texture);

    const onReady = () => setFrameReady(true);
    const onPlaying = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => {
      setFailed(true);
      setFrameReady(false);
      setPlaying(false);
    };
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("pause", onPause);
    video.addEventListener("error", onError);

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("error", onError);
      texture.dispose();
      videoRef.current = null;
    };
  }, []);

  useFrame((_, dt) => {
    fallbackMaterial.uniforms.uTime.value += dt;
    const video = videoRef.current;
    const parent = group.current;
    if (!video || !parent) return;

    parent.updateWorldMatrix(true, false);
    const screenPosition = parent.getWorldPosition(new THREE.Vector3());
    const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
    const inRange = screenPosition.distanceTo(cameraPosition) < 17 && !document.hidden;

    if (inRange && !failed) {
      if (!video.src) {
        video.src = `/videos/sections/${section.id}.mp4`;
        video.load();
      }
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.paused) {
        void video.play().catch(() => undefined);
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
        {playing && frameReady && !failed && videoTexture ? (
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        ) : (
          <primitive object={fallbackMaterial} attach="material" />
        )}
      </mesh>
      {!(playing && frameReady) && titleTexture && (
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[3.08, 2.5]} />
          <meshBasicMaterial map={titleTexture} transparent toneMapped={false} />
        </mesh>
      )}
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
  return <SectionVideoScreen section={section} />;
}
