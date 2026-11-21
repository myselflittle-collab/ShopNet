"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import type { MallQuality } from "@/mall/performance/quality";

const OFFERS: Record<string, string> = {
  "women-blazers": "TAILORED COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-trousers": "NEW SEASON · OFFER CONTENT TO BE ADDED",
  "women-tshirts": "EVERYDAY ESSENTIALS · OFFER CONTENT TO BE ADDED",
  "women-shirts": "NEW ARRIVALS · OFFER CONTENT TO BE ADDED",
  "women-dresses": "FESTIVE COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-jeans": "DENIM COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-ethnic": "CELEBRATION EDIT · OFFER CONTENT TO BE ADDED",
  "women-skirts": "NEW COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-jackets": "OUTERWEAR COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-innerwear": "COMFORT COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-shoes": "FOOTWEAR COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-handbags": "HANDBAG COLLECTION · OFFER CONTENT TO BE ADDED",
  "women-accessories": "ACCESSORY COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-blazers": "TAILORED COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-trousers": "NEW SEASON · OFFER CONTENT TO BE ADDED",
  "men-tshirts": "EVERYDAY ESSENTIALS · OFFER CONTENT TO BE ADDED",
  "men-shirts": "SMART STYLE · OFFER CONTENT TO BE ADDED",
  "men-jeans": "DENIM COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-kurtas": "TRADITIONAL COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-jackets": "OUTERWEAR COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-innerwear": "COMFORT COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-accessories": "ACCESSORY COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-shoes": "FOOTWEAR COLLECTION · OFFER CONTENT TO BE ADDED",
  "men-watches": "TIMEPIECE COLLECTION · OFFER CONTENT TO BE ADDED",
};

const GLASS_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#1c718b",
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});
const EDGE_MATERIAL = new THREE.MeshBasicMaterial({
  color: "#69eaff",
  toneMapped: false,
});

function makeInfoTexture(section: PlacedSection, quality: MallQuality) {
  const canvas = document.createElement("canvas");
  canvas.width = quality === "high" ? 384 : 256;
  canvas.height = quality === "high" ? 768 : 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = "rgba(7,28,43,0.17)";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(99,231,255,0.72)";
  ctx.lineWidth = 3;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.textAlign = "center";
  ctx.fillStyle = "#a7f1ff";
  ctx.font = "600 15px Arial";
  ctx.fillText("SHOPNET  /  LIVE OFFER", w / 2, 62);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 23px Georgia";
  ctx.fillText(section.label.toUpperCase(), w / 2, h * 0.34, w - 28);

  ctx.fillStyle = "#9df5ff";
  ctx.font = "700 17px Arial";
  ctx.fillText(OFFERS[section.id] ?? "DISCOVER THE EDIT", w / 2, h * 0.52, w - 24);

  ctx.fillStyle = "rgba(229,248,255,0.84)";
  ctx.font = "500 13px Arial";
  ctx.fillText(section.gender === "women" ? "WOMEN'S COLLECTION" : "MEN'S COLLECTION", w / 2, h * 0.68);
  ctx.fillStyle = "#b4f5ff";
  ctx.fillText("SCAN · DISCOVER · SHOP", w / 2, h * 0.88);
  return canvas;
}

export function HoloPillar({
  section,
  x,
  z,
  quality,
}: {
  section: PlacedSection;
  x: number;
  z: number;
  quality: MallQuality;
}) {
  const texture = useMemo(() => {
    const next = new THREE.CanvasTexture(makeInfoTexture(section, quality));
    next.colorSpace = THREE.SRGBColorSpace;
    next.anisotropy = quality === "high" ? 4 : 1;
    next.needsUpdate = true;
    return next;
  }, [section.id, section.label, section.gender, quality]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((_, dt) => {
    if (quality !== "low") texture.offset.y = (texture.offset.y + dt * (quality === "high" ? 0.035 : 0.02)) % 1;
  });

  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={[x, 0, z]}>
      {/* Lightweight translucent smart-glass body; no physical transmission or dynamic point light. */}
      <mesh position={[0, 1.63, 0]} material={GLASS_MATERIAL}>
        <boxGeometry args={[0.22, 3.24, 0.28]} />
      </mesh>
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[edge * 0.116, 1.63, 0]} material={EDGE_MATERIAL}>
          <boxGeometry args={[0.01, 3.25, 0.3]} />
        </mesh>
      ))}
      <mesh position={[-section.side * 0.145, 1.64, 0]} rotation-y={rotationY}>
        <planeGeometry args={[0.28, 2.28]} />
        <meshBasicMaterial map={texture} transparent opacity={0.94} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
