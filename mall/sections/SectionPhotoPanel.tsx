"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W } from "@/lib/config/mall";

const FASHION_PHOTOS: Record<string, { image: string }> = {
  "women-blazers": { image: "photo-1559127452-829071a09516" },
  "women-trousers": { image: "photo-1565325058701-b1cb0be324f3" },
  "women-tshirts": { image: "photo-1616006897093-5e4635c0de35" },
  "women-shirts": { image: "photo-1616006897093-5e4635c0de35" },
  "women-dresses": { image: "photo-1610047402714-307d99a677db" },
  "women-jeans": { image: "photo-1565325058701-b1cb0be324f3" },
  "women-ethnic": { image: "photo-1610189013429-a703f4b245cf" },
  "women-skirts": { image: "photo-1682397125309-56077754235d" },
  "women-jackets": { image: "photo-1576828831022-ca41d3905fb7" },
  "women-innerwear": { image: "photo-1616006897093-5e4635c0de35" },
  "women-shoes": { image: "photo-1704273944825-b9bcf7f85c59" },
  "women-handbags": { image: "photo-1681747685985-a401c271156c" },
  "women-accessories": { image: "photo-1589995358068-cf709addda7a" },
  "men-blazers": { image: "photo-1543132220-4bf3de6e10ae" },
  "men-trousers": { image: "photo-1538978939284-4ecb3fc4ad5e" },
  "men-tshirts": { image: "photo-1542368826-9a7df1d9fd0b" },
  "men-shirts": { image: "photo-1542368826-9a7df1d9fd0b" },
  "men-jeans": { image: "photo-1675442141177-b99b70652416" },
  "men-kurtas": { image: "photo-1774437790995-9a8513532a25" },
  "men-jackets": { image: "photo-1675442141177-b99b70652416" },
  "men-innerwear": { image: "photo-1542368826-9a7df1d9fd0b" },
  "men-accessories": { image: "photo-1780337092951-7d7fc330db71" },
  "men-shoes": { image: "photo-1616663308968-58162d332720" },
  "men-watches": { image: "photo-1780337092951-7d7fc330db71" },
};

const WOMEN_COLORS = ["#b88978", "#8c746b", "#a88e75", "#77785f", "#ad8c99"];
const MEN_COLORS = ["#6c7476", "#79695c", "#5e6262", "#897967", "#59616a"];

function drawFallback(canvas: HTMLCanvasElement, section: PlacedSection) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const colors = section.gender === "women" ? WOMEN_COLORS : MEN_COLORS;
  const seed = Array.from(section.id).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const accent = colors[seed % colors.length];
  const dark = section.gender === "women" ? "#322b27" : "#22282b";
  const light = section.gender === "women" ? "#e9ddd0" : "#d9d8d1";

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, dark);
  gradient.addColorStop(0.54, accent);
  gradient.addColorStop(1, light);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Editorial fallback: always visible before the photograph arrives.
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#f6ead6";
  ctx.beginPath();
  ctx.ellipse(760, 285, 245, 330, -0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f6ead6";
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(600 + i * 42, 0);
    ctx.lineTo(250 + i * 42, canvas.height);
    ctx.stroke();
  }
  ctx.restore();

  const shade = ctx.createLinearGradient(0, canvas.height * 0.48, 0, canvas.height);
  shade.addColorStop(0, "rgba(15,14,13,0)");
  shade.addColorStop(1, "rgba(15,14,13,0.82)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f8f3ea";
  ctx.font = "600 24px Arial, sans-serif";
  ctx.fillText("SHOPNET  /  THE FASHION MALL", 58, 72);
  ctx.font = "500 70px Georgia, serif";
  ctx.fillText(section.label.toUpperCase(), 58, 610, 900);
  ctx.font = "500 22px Arial, sans-serif";
  ctx.fillStyle = "#e8c997";
  ctx.fillText(section.gender === "women" ? "WOMEN'S COLLECTION  ·  NEW SEASON" : "MEN'S COLLECTION  ·  NEW SEASON", 60, 662);
}

function drawCover(ctx: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const cropW = width / scale;
  const cropH = height / scale;
  const sx = (image.naturalWidth - cropW) / 2;
  const sy = (image.naturalHeight - cropH) / 2;
  ctx.drawImage(image, sx, sy, cropW, cropH, 0, 0, width, height);
}

function CampaignMaterial({ section }: { section: PlacedSection }) {
  const { canvas, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 900;
    drawFallback(canvas, section);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return { canvas, texture };
  }, [section.id, section.label, section.gender]);

  useEffect(() => {
    const entry = FASHION_PHOTOS[section.id];
    if (!entry) return;

    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      drawCover(ctx, image, canvas.width, canvas.height);
      const shade = ctx.createLinearGradient(0, canvas.height * 0.54, 0, canvas.height);
      shade.addColorStop(0, "rgba(10,10,10,0)");
      shade.addColorStop(1, "rgba(10,10,10,0.76)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(20,18,16,0.68)";
      ctx.fillRect(0, 0, canvas.width, 105);
      ctx.fillStyle = "#f8f2e9";
      ctx.font = "600 25px Arial, sans-serif";
      ctx.fillText("SHOPNET  /  THE FASHION MALL", 58, 66);
      ctx.font = "500 72px Georgia, serif";
      ctx.fillText(section.label.toUpperCase(), 58, 790, 1050);
      ctx.font = "500 22px Arial, sans-serif";
      ctx.fillStyle = "#ebc995";
      ctx.fillText(section.gender === "women" ? "WOMEN'S COLLECTION  ·  NEW SEASON" : "MEN'S COLLECTION  ·  NEW SEASON", 60, 842);
      texture.needsUpdate = true;
    };
    image.onerror = () => {
      console.warn(`ShopNet campaign image unavailable for ${section.id}; keeping the designed campaign fallback.`);
    };
    image.src = `https://images.unsplash.com/${entry.image}?auto=format&fit=crop&w=1200&h=900&q=85`;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [canvas, texture, section]);

  useEffect(() => () => texture.dispose(), [texture]);
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

export function SectionPhotoPanel({ section }: { section: PlacedSection }) {
  // Place the panel on the corridor-facing side of the feature wall; the previous
  // position buried the image plane inside the wall thickness.
  const x = section.side * (HALF_W - 0.21);
  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={[x, 2.04, section.cz]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.055]}>
        <boxGeometry args={[3.18, 2.62, 0.12]} />
        <meshStandardMaterial color="#9f835b" metalness={0.72} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[3.02, 2.46]} />
        <CampaignMaterial section={section} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.58, 0, 0.018]}>
          <boxGeometry args={[0.035, 2.64, 0.035]} />
          <meshStandardMaterial color="#f1d7a4" emissive="#d0a666" emissiveIntensity={0.85} metalness={0.65} roughness={0.22} />
        </mesh>
      ))}
    </group>
  );
}
