"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { HALF_W, MALL, pathCenterX, pathYawAt } from "@/lib/config/mall";

const CAMPAIGNS = [
  {
    eyebrow: "SHOPNET  /  NEW SEASON",
    title: "A NEW SEASON. A NEW YOU.",
    body: "Fresh looks, thoughtful details and pieces made to move with you.",
    offer: "UP TO 40% OFF SELECTED STYLES",
    palette: ["#17212b", "#43525a", "#d0ae7b"],
  },
  {
    eyebrow: "THE SHOPNET EDIT",
    title: "FIND YOUR NEXT FAVOURITE.",
    body: "Explore new arrivals across clothing, footwear and accessories.",
    offer: "NEW ARRIVALS EVERY WEEK",
    palette: ["#392b28", "#876a5c", "#eccb9a"],
  },
  {
    eyebrow: "MEMBER PRIVILEGES",
    title: "A LITTLE MORE FOR YOU.",
    body: "Get early access to launches, member updates and special edits.",
    offer: "JOIN THE SHOPNET CIRCLE",
    palette: ["#142b2a", "#46645c", "#d8bd8b"],
  },
  {
    eyebrow: "THE EVERYDAY EDIT",
    title: "MADE FOR REAL LIFE.",
    body: "Easy layers, confident classics and effortless everyday essentials.",
    offer: "DISCOVER THE DAILY COLLECTION",
    palette: ["#27303a", "#596777", "#d2c0a2"],
  },
  {
    eyebrow: "THE FINISHING TOUCH",
    title: "DETAILS MAKE THE LOOK.",
    body: "Discover bags, watches, footwear and accessories with character.",
    offer: "EXPLORE THE ACCESSORY EDIT",
    palette: ["#322820", "#826548", "#e0bd86"],
  },
  {
    eyebrow: "SHOPNET STYLE NOTES",
    title: "WEAR WHAT MOVES YOU.",
    body: "Personal style has no rules. Find the pieces that feel like you.",
    offer: "YOUR STYLE. YOUR STORY.",
    palette: ["#302432", "#75556f", "#e7c5a2"],
  },
  {
    eyebrow: "A BETTER WAY TO SHOP",
    title: "DISCOVER MORE. GO FURTHER.",
    body: "One destination for the looks, details and pieces you love.",
    offer: "EXPLORE WOMEN'S & MEN'S",
    palette: ["#202b30", "#587078", "#dbc39b"],
  },
  {
    eyebrow: "THE WEEKEND EDIT",
    title: "MAKE EVERY DAY COUNT.",
    body: "From laid-back essentials to standout looks for going out.",
    offer: "FIND YOUR WEEKEND LOOK",
    palette: ["#3a3024", "#98734b", "#e6c18b"],
  },
  {
    eyebrow: "SHOPNET REWARDS",
    title: "GOOD STYLE. GOOD REWARDS.",
    body: "Stay close to the collections and launches you care about.",
    offer: "YOUR NEXT FAVOURITE IS HERE",
    palette: ["#192b39", "#475e76", "#d5b98b"],
  },
  {
    eyebrow: "NEW-SEASON INSPIRATION",
    title: "STEP INTO SOMETHING NEW.",
    body: "Fresh silhouettes, considered colours and confident details.",
    offer: "EXPLORE THE LATEST EDIT",
    palette: ["#3c292c", "#8a5c5f", "#edc39b"],
  },
];

function makeCampaignTexture(index: number) {
  const item = CAMPAIGNS[index % CAMPAIGNS.length];
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 520;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createLinearGradient(0, 0, 1200, 520);
  gradient.addColorStop(0, item.palette[0]);
  gradient.addColorStop(0.62, item.palette[1]);
  gradient.addColorStop(1, "#171816");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 520);

  // Soft editorial light field on the right, leaving the copy clean on the left.
  const glow = ctx.createRadialGradient(970, 155, 25, 970, 155, 500);
  glow.addColorStop(0, "rgba(255,230,190,0.34)");
  glow.addColorStop(1, "rgba(255,230,190,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1200, 520);

  ctx.strokeStyle = "rgba(255,239,211,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 1152, 472);
  ctx.strokeStyle = "rgba(255,239,211,0.17)";
  ctx.strokeRect(38, 38, 1124, 444);

  ctx.fillStyle = item.palette[2];
  ctx.font = "600 22px Arial, sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText(item.eyebrow, 78, 104);

  ctx.fillStyle = "#fff8ef";
  ctx.font = "500 62px Georgia, serif";
  const titleWords = item.title.split(" ");
  let line = "";
  let y = 228;
  for (const word of titleWords) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > 980 && line) {
      ctx.fillText(line, 78, y);
      y += 76;
      line = word;
    } else line = next;
  }
  if (line) ctx.fillText(line, 78, y);

  ctx.fillStyle = "rgba(255,248,239,0.83)";
  ctx.font = "400 25px Arial, sans-serif";
  ctx.letterSpacing = "0px";
  ctx.fillText(item.body, 80, 360, 1030);

  ctx.fillStyle = item.palette[2];
  ctx.font = "700 23px Arial, sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText(item.offer, 80, 438, 1030);
  return canvas;
}

function WallCampaignBoard({ index, side, z }: { index: number; side: 1 | -1; z: number }) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = makeCampaignTexture(index);
    if (!canvas) return;
    const next = new THREE.CanvasTexture(canvas);
    next.colorSpace = THREE.SRGBColorSpace;
    next.anisotropy = 8;
    next.needsUpdate = true;
    setTexture(next);
    return () => next.dispose();
  }, [index]);

  const x = pathCenterX(z) + side * (HALF_W - 0.16);
  const rotationY = (side === -1 ? Math.PI / 2 : -Math.PI / 2) + pathYawAt(z);

  return (
    <group position={[x, 2.32, z]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.075]}>
        <boxGeometry args={[4.85, 2.22, 0.16]} />
        <meshStandardMaterial color="#241f19" metalness={0.7} roughness={0.26} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[4.68, 2.04]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#34302b" />
        )}
      </mesh>
      {[-1, 1].map((edge) => (
        <mesh key={edge} position={[edge * 2.4, 0, 0.02]}>
          <boxGeometry args={[0.035, 2.22, 0.035]} />
          <meshStandardMaterial color="#d5b67e" emissive="#b48d53" emissiveIntensity={0.45} metalness={0.75} roughness={0.22} />
        </mesh>
      ))}
    </group>
  );
}

export function MallWallContent() {
  const boards = useMemo(() => {
    const out: { index: number; side: 1 | -1; z: number }[] = [];
    let index = 0;
    for (let z = -2.8; z > -MALL.length + 1; z -= 5.55) {
      out.push({ index, side: -1, z });
      out.push({ index: index + 4, side: 1, z: z - 2.7 });
      index++;
    }
    return out;
  }, []);

  return (
    <group>
      {boards.map((board, i) => (
        <WallCampaignBoard key={`${board.side}-${board.z}`} {...board} index={board.index + i} />
      ))}
    </group>
  );
}
