"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { BAY_FRONT_X } from "@/lib/config/mall";

const SLOGANS: Record<string, string> = {
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
  "women-handbags": "CARRY YOUR STORY",
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

function createTickerTexture(section: PlacedSection) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Transparent canvas preserves the stone colour and grain below the hologram.
  const glow = ctx.createRadialGradient(256, 512, 30, 256, 512, 430);
  glow.addColorStop(0, "rgba(33,201,255,0.16)");
  glow.addColorStop(1, "rgba(33,201,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 512, 1024);

  ctx.strokeStyle = "rgba(105,232,255,0.8)";
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, 472, 984);
  ctx.strokeStyle = "rgba(192,246,255,0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, 444, 956);

  const title = section.label.toUpperCase();
  const slogan = SLOGANS[section.id] ?? "FIND YOUR STYLE";
  const blocks = [
    { eyebrow: "SHOPNET  /  " + section.gender.toUpperCase(), main: title, note: slogan },
    { eyebrow: "NEW SEASON", main: "DISCOVER YOUR NEXT LOOK", note: "STYLE THAT MOVES WITH YOU" },
    { eyebrow: "THE SHOPNET EDIT", main: "EXPRESS YOURSELF", note: slogan },
  ];

  ctx.textAlign = "center";
  blocks.forEach((block, index) => {
    const y = 155 + index * 310;
    ctx.fillStyle = "rgba(150,242,255,0.95)";
    ctx.font = "600 22px Arial";
    ctx.letterSpacing = "5px";
    ctx.fillText(block.eyebrow, 256, y, 430);
    ctx.fillStyle = "#f4fcff";
    ctx.font = "600 40px Georgia";
    const words = block.main.split(" ");
    let line = "";
    let lineY = y + 82;
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (ctx.measureText(next).width > 420 && line) {
        ctx.fillText(line, 256, lineY, 430);
        lineY += 48;
        line = word;
      } else line = next;
    }
    if (line) ctx.fillText(line, 256, lineY, 430);
    ctx.fillStyle = "#6beaff";
    ctx.font = "700 22px Arial";
    ctx.letterSpacing = "2px";
    ctx.fillText(block.note, 256, y + 180, 430);
    if (index < blocks.length - 1) {
      ctx.strokeStyle = "rgba(108,226,255,0.42)";
      ctx.beginPath();
      ctx.moveTo(86, y + 240);
      ctx.lineTo(426, y + 240);
      ctx.stroke();
    }
  });
  return canvas;
}

export function HoloFloorDisplay({ section }: { section: PlacedSection }) {
  const texture = useMemo(() => {
    const canvas = createTickerTexture(section);
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.wrapT = THREE.RepeatWrapping;
    next.anisotropy = 8;
    next.needsUpdate = true;
    return next;
  }, [section.id, section.label, section.gender]);

  const borderMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#62eaff", transparent: true, opacity: 0.76 }),
    [],
  );

  useEffect(() => () => {
    texture.dispose();
    borderMaterial.dispose();
  }, [texture, borderMaterial]);

  useFrame((_, dt) => {
    texture.offset.y = (texture.offset.y + dt * 0.052) % 1;
    borderMaterial.opacity = 0.55 + Math.sin(performance.now() * 0.0015) * 0.16;
  });

  const x = section.side * (BAY_FRONT_X + 0.86);
  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={[x, 0.028, section.cz]} rotation-y={rotationY}>
      {/* The content floats over the actual floor; there is no black tile or opaque slab. */}
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.18, 1.7]} />
        <meshBasicMaterial map={texture} transparent opacity={0.86} toneMapped={false} depthWrite={false} />
      </mesh>
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[edge * 0.61, 0.004, 0]}>
          <boxGeometry args={[0.012, 0.008, 1.7]} />
          <primitive object={borderMaterial} attach="material" />
        </mesh>
      ))}
      {[-1, 1].map((edge) => (
        <mesh key={`end-${edge}`} position={[0, 0.004, edge * 0.86]}>
          <boxGeometry args={[1.22, 0.008, 0.012]} />
          <primitive object={borderMaterial} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
