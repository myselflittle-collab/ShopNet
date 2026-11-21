"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";

const OFFERS: Record<string, string> = {
  "women-blazers": "UP TO 35% OFF",
  "women-trousers": "UP TO 30% OFF",
  "women-tshirts": "BUY 2 · SAVE 20%",
  "women-shirts": "NEW SEASON · 20% OFF",
  "women-dresses": "FESTIVE EDIT · 30% OFF",
  "women-jeans": "DENIM WEEK · 25% OFF",
  "women-ethnic": "CELEBRATION EDIT",
  "women-skirts": "NEW ARRIVALS",
  "women-jackets": "LAYER UP · 25% OFF",
  "women-innerwear": "COMFORT EDIT",
  "women-shoes": "FOOTWEAR · 20% OFF",
  "women-handbags": "NEW COLLECTION",
  "women-accessories": "THE STYLE EDIT",
  "men-blazers": "TAILORED EDIT · 30% OFF",
  "men-trousers": "UP TO 25% OFF",
  "men-tshirts": "BUY 2 · SAVE 20%",
  "men-shirts": "WORKWEAR EDIT",
  "men-jeans": "DENIM WEEK · 25% OFF",
  "men-kurtas": "FESTIVE EDIT",
  "men-jackets": "OUTERWEAR · 25% OFF",
  "men-innerwear": "EVERYDAY ESSENTIALS",
  "men-accessories": "THE DETAIL EDIT",
  "men-shoes": "FOOTWEAR · 20% OFF",
  "men-watches": "TIMELESS COLLECTION",
};

function makeInfoTexture(section: PlacedSection) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const wash = ctx.createLinearGradient(0, 0, 512, 1024);
  wash.addColorStop(0, "rgba(9,34,49,0.34)");
  wash.addColorStop(1, "rgba(5,14,25,0.12)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 512, 1024);

  ctx.strokeStyle = "rgba(99,231,255,0.72)";
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, 476, 988);
  ctx.strokeStyle = "rgba(170,235,255,0.22)";
  ctx.lineWidth = 2;
  ctx.strokeRect(31, 31, 450, 962);

  ctx.textAlign = "center";
  ctx.fillStyle = "#a7f1ff";
  ctx.font = "600 25px Arial";
  ctx.letterSpacing = "6px";
  ctx.fillText("SHOPNET  /  LIVE OFFER", 256, 115);

  ctx.fillStyle = "#ffffff";
  ctx.font = "500 40px Georgia";
  const label = section.label.toUpperCase();
  const words = label.split(" ");
  let line = "";
  let y = 320;
  for (const word of words) {
    const next = line ? line + " " + word : word;
    if (ctx.measureText(next).width > 440 && line) {
      ctx.fillText(line, 256, y);
      y += 58;
      line = word;
    } else line = next;
  }
  if (line) ctx.fillText(line, 256, y);

  ctx.fillStyle = "#9df5ff";
  ctx.font = "700 34px Arial";
  ctx.letterSpacing = "1px";
  ctx.fillText(OFFERS[section.id] ?? "DISCOVER THE EDIT", 256, 540, 440);

  ctx.fillStyle = "rgba(229,248,255,0.84)";
  ctx.font = "500 24px Arial";
  ctx.letterSpacing = "3px";
  ctx.fillText(section.gender === "women" ? "WOMEN'S COLLECTION" : "MEN'S COLLECTION", 256, 650);

  ctx.fillStyle = "#b4f5ff";
  ctx.font = "500 20px Arial";
  ctx.fillText("SCAN · DISCOVER · SHOP", 256, 865);
  return canvas;
}

export function HoloPillar({
  section,
  x,
  z,
}: {
  section: PlacedSection;
  x: number;
  z: number;
}) {
  const material = useMemo(
    () => new THREE.MeshPhysicalMaterial({
      color: "#75dfff",
      metalness: 0.08,
      roughness: 0.12,
      transmission: 0.78,
      thickness: 0.28,
      ior: 1.16,
      transparent: true,
      opacity: 0.48,
      emissive: new THREE.Color("#0c526e"),
      emissiveIntensity: 0.42,
    }),
    [],
  );

  const texture = useMemo(() => {
    const canvas = makeInfoTexture(section);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.wrapT = THREE.RepeatWrapping;
    next.anisotropy = 8;
    next.needsUpdate = true;
    return next;
  }, [section.id, section.label, section.gender]);

  useEffect(() => () => {
    material.dispose();
    texture.dispose();
  }, [material, texture]);

  useFrame((_, dt) => {
    texture.offset.y = (texture.offset.y + dt * 0.035) % 1;
  });

  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={[x, 0, z]}>
      {/* Transparent smart-glass pillar: architecture remains visible through it. */}
      <mesh position={[0, 1.63, 0]}>
        <boxGeometry args={[0.24, 3.26, 0.3]} />
        <primitive object={material} attach="material" />
      </mesh>
      {/* Fine cyan edge rails make the glass pillar read as a digital architectural element. */}
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[edge * 0.126, 1.63, 0]}>
          <boxGeometry args={[0.012, 3.28, 0.32]} />
          <meshStandardMaterial color="#8beeff" emissive="#21cfff" emissiveIntensity={1.2} metalness={0.4} roughness={0.2} />
        </mesh>
      ))}
      <mesh position={[-section.side * 0.158, 1.64, 0]} rotation-y={rotationY}>
        <planeGeometry args={[0.31, 2.34]} />
        <meshBasicMaterial map={texture} transparent opacity={0.92} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 2.55, 0]} color="#4edfff" intensity={0.34} distance={2.6} decay={2} />
    </group>
  );
}
