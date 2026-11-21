"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { BAY_FRONT_X } from "@/lib/config/mall";

const MOTIVATION: Record<string, string> = {
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

function createFloorTexture(section: PlacedSection) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const women = section.gender === "women";
  const bg = ctx.createLinearGradient(0, 0, 768, 1024);
  bg.addColorStop(0, women ? "#352923" : "#18212a");
  bg.addColorStop(1, women ? "#8a6d56" : "#52606a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 1024);

  ctx.strokeStyle = "rgba(226,190,132,0.72)";
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, 720, 976);
  ctx.strokeStyle = "rgba(226,190,132,0.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, 684, 940);

  ctx.textAlign = "center";
  ctx.fillStyle = "#e8c990";
  ctx.font = "600 26px Arial";
  ctx.letterSpacing = "8px";
  ctx.fillText(section.gender === "women" ? "SHOPNET  /  WOMEN" : "SHOPNET  /  MEN", 384, 190);

  ctx.fillStyle = "#fff8ec";
  ctx.font = "600 58px Georgia";
  const words = section.label.toUpperCase().split(" ");
  const line = words.length > 2 ? words.slice(0, Math.ceil(words.length / 2)).join(" ") : section.label.toUpperCase();
  const line2 = words.length > 2 ? words.slice(Math.ceil(words.length / 2)).join(" ") : "";
  ctx.fillText(line, 384, 420, 660);
  if (line2) ctx.fillText(line2, 384, 492, 660);

  ctx.fillStyle = "#edc58b";
  ctx.font = "600 27px Arial";
  ctx.letterSpacing = "3px";
  ctx.fillText(MOTIVATION[section.id] ?? "FIND YOUR STYLE", 384, 650, 670);

  ctx.fillStyle = "rgba(255,248,236,0.75)";
  ctx.font = "500 20px Arial";
  ctx.letterSpacing = "6px";
  ctx.fillText("DISCOVER  ·  EXPRESS  ·  INSPIRE", 384, 830);
  return canvas;
}

export function FloorSectionMarker({ section }: { section: PlacedSection }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const textureKey = section.id;
  useEffect(() => {
    const canvas = createFloorTexture(section);
    if (!canvas) return;
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.anisotropy = 8;
    next.needsUpdate = true;
    setTexture(next);
    return () => next.dispose();
  }, [textureKey, section.label, section.gender]);

  const x = section.side * (BAY_FRONT_X - 0.77);
  return (
    <group position={[x, 0.028, section.cz]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.012, 0]}>
        <planeGeometry args={[1.42, 2.5]} />
        <meshStandardMaterial color="#9a805c" metalness={0.7} roughness={0.28} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, 0]}>
        <planeGeometry args={[1.34, 2.42]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#36302a" />
        )}
      </mesh>
    </group>
  );
}
