"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W } from "@/lib/config/mall";

interface SectionCampaign {
  title: string;
  lineOne: string;
  lineTwo: string;
  offerTitle: string;
  offerTicker: string;
}

const CAMPAIGNS: Record<string, SectionCampaign> = {
  "women-blazers": {
    title: "WOMEN'S BLAZERS",
    lineOne: "Tailoring that speaks volumes.",
    lineTwo: "Find the fit that leads the room.",
    offerTitle: "THE POWER TAILORING EDIT",
    offerTicker: "Explore sharp silhouettes  •  Discover new-season layers  •  Make your statement  •  ",
  },
  "women-trousers": {
    title: "WOMEN'S TROUSERS & PANTS",
    lineOne: "Find your shape. Own your stride.",
    lineTwo: "From polished days to easy evenings.",
    offerTitle: "THE PERFECT-FIT EDIT",
    offerTicker: "Explore wide-leg shapes  •  Discover everyday tailoring  •  Find your next favourite fit  •  ",
  },
  "women-tshirts": {
    title: "WOMEN'S T-SHIRTS",
    lineOne: "Everyday essentials, elevated.",
    lineTwo: "Fresh fits for your own kind of style.",
    offerTitle: "THE EVERYDAY STYLE EDIT",
    offerTicker: "Refresh your basics  •  Discover relaxed fits  •  Keep everyday iconic  •  ",
  },
  "women-shirts": {
    title: "WOMEN'S SHIRTS",
    lineOne: "A fresh take on a timeless classic.",
    lineTwo: "Bring effortless polish to every plan.",
    offerTitle: "THE MODERN CLASSICS EDIT",
    offerTicker: "Explore crisp layers  •  Discover versatile styles  •  Dress up or keep it easy  •  ",
  },
  "women-dresses": {
    title: "WOMEN'S DRESSES",
    lineOne: "Make every entrance your own.",
    lineTwo: "Find a look for every kind of moment.",
    offerTitle: "THE DRESS-UP EDIT",
    offerTicker: "Explore occasion looks  •  Discover effortless daywear  •  Find your moment  •  ",
  },
  "women-jeans": {
    title: "WOMEN'S JEANS",
    lineOne: "Denim made to move with you.",
    lineTwo: "Find your rise, cut and confidence.",
    offerTitle: "THE DENIM DESTINATION",
    offerTicker: "Explore new denim shapes  •  Find your favourite wash  •  Make every fit your own  •  ",
  },
  "women-ethnic": {
    title: "WOMEN'S ETHNIC WEAR",
    lineOne: "Craft, colour and a sense of occasion.",
    lineTwo: "Celebrate tradition in your own way.",
    offerTitle: "THE CELEBRATION EDIT",
    offerTicker: "Explore graceful occasionwear  •  Discover thoughtful details  •  Celebrate your style  •  ",
  },
  "women-skirts": {
    title: "WOMEN'S SKIRTS",
    lineOne: "Let your style find its flow.",
    lineTwo: "From easy movement to statement looks.",
    offerTitle: "THE MOVEMENT EDIT",
    offerTicker: "Explore fluid shapes  •  Discover fresh proportions  •  Find your perfect pairing  •  ",
  },
  "women-jackets": {
    title: "WOMEN'S JACKETS",
    lineOne: "Add a layer. Change the whole look.",
    lineTwo: "Find the finishing piece for your outfit.",
    offerTitle: "THE LAYERING EDIT",
    offerTicker: "Explore statement outerwear  •  Discover everyday layers  •  Make the look yours  •  ",
  },
  "women-innerwear": {
    title: "WOMEN'S INNERWEAR",
    lineOne: "Comfort begins with the right fit.",
    lineTwo: "Feel supported in your own style.",
    offerTitle: "THE COMFORT-FIRST EDIT",
    offerTicker: "Explore feel-good essentials  •  Find your fit  •  Make comfort part of every day  •  ",
  },
  "women-shoes": {
    title: "WOMEN'S SHOES",
    lineOne: "A great look starts from the ground up.",
    lineTwo: "Find the pair that moves with you.",
    offerTitle: "STEP INTO YOUR STYLE",
    offerTicker: "Explore everyday pairs  •  Discover occasion styles  •  Find your next step  •  ",
  },
  "women-handbags": {
    title: "WOMEN'S HANDBAGS",
    lineOne: "Carry the details that make it yours.",
    lineTwo: "Find the piece that completes your look.",
    offerTitle: "THE HANDBAG EDIT",
    offerTicker: "Explore everyday carry-alls  •  Discover statement pieces  •  Carry your story  •  ",
  },
  "women-accessories": {
    title: "WOMEN'S ACCESSORIES",
    lineOne: "Small details. A signature finish.",
    lineTwo: "Make every combination feel personal.",
    offerTitle: "THE FINISHING-TOUCH EDIT",
    offerTicker: "Explore the final details  •  Discover pieces to layer  •  Make the look yours  •  ",
  },
  "men-blazers": {
    title: "MEN'S BLAZERS",
    lineOne: "A sharper layer. A stronger presence.",
    lineTwo: "Find the cut that feels made for you.",
    offerTitle: "THE MODERN TAILORING EDIT",
    offerTicker: "Explore refined silhouettes  •  Discover smart layers  •  Bring your look together  •  ",
  },
  "men-trousers": {
    title: "MEN'S TROUSERS & PANTS",
    lineOne: "The right fit changes everything.",
    lineTwo: "Move from workdays to weekends with ease.",
    offerTitle: "THE EVERYDAY TAILORING EDIT",
    offerTicker: "Explore clean cuts  •  Discover relaxed fits  •  Find your everyday pair  •  ",
  },
  "men-tshirts": {
    title: "MEN'S T-SHIRTS",
    lineOne: "Keep it easy. Make it unmistakably yours.",
    lineTwo: "Discover the everyday uniform, redefined.",
    offerTitle: "THE DAILY-ESSENTIALS EDIT",
    offerTicker: "Explore new-season basics  •  Find relaxed fits  •  Keep your style authentic  •  ",
  },
  "men-shirts": {
    title: "MEN'S SHIRTS",
    lineOne: "Show up sharp, whatever the occasion.",
    lineTwo: "Discover easy layers and refined details.",
    offerTitle: "THE SHARP-DRESSING EDIT",
    offerTicker: "Explore smart-casual styles  •  Discover classic layers  •  Make every detail count  •  ",
  },
  "men-jeans": {
    title: "MEN'S JEANS",
    lineOne: "Denim built around your everyday.",
    lineTwo: "Find the wash and fit that feels right.",
    offerTitle: "THE DENIM EDIT",
    offerTicker: "Explore timeless washes  •  Discover modern cuts  •  Find your everyday denim  •  ",
  },
  "men-kurtas": {
    title: "MEN'S KURTAS",
    lineOne: "Heritage details. A distinctly modern feel.",
    lineTwo: "Find your look for every celebration.",
    offerTitle: "THE MODERN-HERITAGE EDIT",
    offerTicker: "Explore celebration styles  •  Discover traditional details  •  Wear your story  •  ",
  },
  "men-jackets": {
    title: "MEN'S JACKETS",
    lineOne: "Built for layers. Ready for your plans.",
    lineTwo: "Find the outerwear that sets the tone.",
    offerTitle: "THE OUTERWEAR EDIT",
    offerTicker: "Explore lightweight layers  •  Discover statement jackets  •  Own every season  •  ",
  },
  "men-innerwear": {
    title: "MEN'S INNERWEAR",
    lineOne: "Start every day with the right comfort.",
    lineTwo: "Find dependable essentials and easy fits.",
    offerTitle: "THE COMFORT-ESSENTIALS EDIT",
    offerTicker: "Explore everyday essentials  •  Find your fit  •  Make comfort your standard  •  ",
  },
  "men-accessories": {
    title: "MEN'S ACCESSORIES",
    lineOne: "The details are what make the look.",
    lineTwo: "Discover the pieces that feel like you.",
    offerTitle: "THE DETAIL EDIT",
    offerTicker: "Explore finishing touches  •  Discover everyday additions  •  Define your own style  •  ",
  },
  "men-shoes": {
    title: "MEN'S SHOES",
    lineOne: "Every step says something about your style.",
    lineTwo: "Find the pair for wherever you're headed.",
    offerTitle: "THE FOOTWEAR EDIT",
    offerTicker: "Explore smart and casual pairs  •  Discover everyday comfort  •  Leave your mark  •  ",
  },
  "men-watches": {
    title: "MEN'S WATCHES",
    lineOne: "Make every moment part of your style.",
    lineTwo: "Discover the detail that stands the test of time.",
    offerTitle: "THE TIMEPIECE EDIT",
    offerTicker: "Explore refined timepieces  •  Discover considered details  •  Make time your own  •  ",
  },
};

const SCREEN_WIDTH = 3.08;
const SCREEN_HEIGHT = (SCREEN_WIDTH * 9) / 16;
const FRAME_WIDTH = 3.24;
const FRAME_HEIGHT = SCREEN_HEIGHT + 0.18;
const CAMPAIGN_SECONDS = 8;
const OVERLAY_UPDATE_INTERVAL = 1 / 12;

function getCampaign(section: PlacedSection): SectionCampaign {
  return CAMPAIGNS[section.id] ?? {
    title: (section.gender === "women" ? "WOMEN'S " : "MEN'S ") + section.label.toUpperCase(),
    lineOne: "Discover pieces that feel like you.",
    lineTwo: "Find a fresh favourite for your wardrobe.",
    offerTitle: "EXPLORE THE COLLECTION",
    offerTicker: "Discover the collection  •  Find your style  •  Shop the edit  •  ",
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smooth(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function drawCoverText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseSize: number,
  family: string,
  weight = 500,
) {
  let size = baseSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 22) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  ctx.fillText(text, x, y, maxWidth);
}

function drawCampaignOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  campaign: SectionCampaign,
  gender: "women" | "men",
  elapsed: number,
) {
  const time = ((elapsed % CAMPAIGN_SECONDS) + CAMPAIGN_SECONDS) % CAMPAIGN_SECONDS;
  const accent = gender === "women" ? "#edc99b" : "#d7c18f";
  const pale = "#fffaf2";

  ctx.clearRect(0, 0, width, height);

  // A transparent lower vignette keeps the original Flow film visible behind all copy.
  const vignette = ctx.createLinearGradient(0, height * 0.28, 0, height);
  vignette.addColorStop(0, "rgba(7,10,16,0)");
  vignette.addColorStop(0.65, "rgba(7,10,16,0.15)");
  vignette.addColorStop(1, "rgba(7,10,16,0.72)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (time < 3) {
    // 0–3s: oversized section name floats into the centre over the moving video.
    const intro = smooth(time / 0.52);
    const fadeOut = 1 - smooth((time - 2.55) / 0.45);
    const alpha = intro * fadeOut;
    const scale = 0.9 + smooth(time / 0.8) * 0.1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(width / 2, height * 0.53 + (1 - intro) * 28);
    ctx.scale(scale, scale);

    ctx.fillStyle = "rgba(5,8,14,0.48)";
    ctx.fillRect(-width * 0.46, -74, width * 0.92, 148);
    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.font = "600 16px Arial, sans-serif";
    ctx.letterSpacing = "5px";
    ctx.fillText(gender === "women" ? "SHOPNET  /  WOMEN" : "SHOPNET  /  MEN", 0, -29);

    ctx.fillStyle = pale;
    drawCoverText(ctx, campaign.title, 0, 39, width * 0.84, 54, "Georgia, serif", 600);
    ctx.fillStyle = accent;
    ctx.fillRect(-42, 59, 84, 2);
    ctx.restore();
    return;
  }

  if (time < 6) {
    // 3–6s: title contracts upwards, then two short lines type out in sequence.
    const local = time - 3;
    const intro = smooth(local / 0.28);
    const panelAlpha = 0.82 * smooth(local / 0.18);
    ctx.fillStyle = `rgba(5,8,14,${panelAlpha})`;
    ctx.fillRect(0, height * 0.43, width, height * 0.57);

    ctx.save();
    ctx.globalAlpha = intro;
    ctx.textAlign = "left";
    ctx.fillStyle = accent;
    ctx.font = "600 13px Arial, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText(gender === "women" ? "WOMEN'S COLLECTION" : "MEN'S COLLECTION", 48, height * 0.57);

    ctx.fillStyle = pale;
    drawCoverText(ctx, campaign.title, 48, height * 0.69, width - 96, 31, "Georgia, serif", 600);

    const firstCount = Math.floor(clamp01(local / 1.15) * campaign.lineOne.length);
    const secondCount = Math.floor(clamp01((local - 0.92) / 1.15) * campaign.lineTwo.length);
    ctx.fillStyle = "#fffaf2";
    ctx.font = "500 22px Arial, sans-serif";
    ctx.fillText(campaign.lineOne.slice(0, firstCount), 50, height * 0.82);
    ctx.fillText(campaign.lineTwo.slice(0, secondCount), 50, height * 0.91);

    const typing = local < 1.15 ? campaign.lineOne.slice(0, firstCount) : campaign.lineTwo.slice(0, secondCount);
    const typingX = 50 + ctx.measureText(typing).width + 3;
    const cursorOn = Math.floor(local * 2) % 2 === 0;
    if (cursorOn) {
      const cursorY = local < 1.15 ? height * 0.82 : height * 0.91;
      ctx.fillStyle = accent;
      ctx.fillRect(Math.min(typingX, width - 55), cursorY - 19, 2, 22);
    }
    ctx.restore();
    return;
  }

  // 6–8s: a distinct offer/collection spotlight with a continuously moving ticker.
  const local = time - 6;
  const intro = smooth(local / 0.2);
  ctx.save();
  ctx.globalAlpha = intro;
  ctx.fillStyle = "rgba(5,8,14,0.78)";
  ctx.fillRect(0, height * 0.30, width, height * 0.70);

  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = "600 14px Arial, sans-serif";
  ctx.letterSpacing = "5px";
  ctx.fillText("SHOPNET  /  SECTION SPOTLIGHT", width / 2, height * 0.48);

  ctx.fillStyle = pale;
  drawCoverText(ctx, campaign.offerTitle, width / 2, height * 0.63, width * 0.86, 36, "Georgia, serif", 600);

  const tickerY = height * 0.79;
  ctx.fillStyle = accent;
  ctx.fillRect(0, tickerY - 32, width, 48);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, tickerY - 32, width, 48);
  ctx.clip();
  ctx.fillStyle = "#191714";
  ctx.font = "700 17px Arial, sans-serif";
  ctx.textAlign = "left";
  const ticker = campaign.offerTicker;
  const tickerWidth = ctx.measureText(ticker).width;
  const offset = (local * 185) % Math.max(1, tickerWidth);
  for (let x = -offset; x < width + tickerWidth; x += tickerWidth) {
    ctx.fillText(ticker, x, tickerY);
  }
  ctx.restore();

  ctx.globalAlpha = intro;
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,250,242,0.86)";
  ctx.font = "500 12px Arial, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("DISCOVER YOUR NEXT FAVOURITE", width / 2, height * 0.91);
  ctx.restore();
}

function makeFallbackTexture(section: PlacedSection) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 506;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const women = section.gender === "women";
  const g = ctx.createLinearGradient(0, 0, 900, 506);
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
  ctx.fillRect(0, 0, 900, 506);

  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#f4e3c4";
  ctx.beginPath();
  ctx.ellipse(700, 220, 210, 240, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#f4e3c4";
  ctx.lineWidth = 2;
  for (let i = 0; i < 13; i++) {
    ctx.beginPath();
    ctx.moveTo(420 + i * 35, 0);
    ctx.lineTo(100 + i * 35, 506);
    ctx.stroke();
  }
  ctx.restore();

  const shade = ctx.createLinearGradient(0, 290, 0, 506);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.76)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 900, 506);
  ctx.fillStyle = "#e9c994";
  ctx.font = "600 21px Arial";
  ctx.letterSpacing = "5px";
  ctx.fillText("SHOPNET  /  SECTION FILM", 48, 58);
  ctx.fillStyle = "#fff8ee";
  ctx.font = "500 52px Georgia";
  ctx.fillText(getCampaign(section).title, 48, 414, 800);
  ctx.fillStyle = "#e9c994";
  ctx.font = "500 18px Arial";
  ctx.letterSpacing = "3px";
  ctx.fillText("NEW SEASON  ·  DISCOVER THE COLLECTION", 50, 462);
  return canvas;
}

function VideoScreen({ section }: { section: PlacedSection }) {
  const camera = useThree((state) => state.camera);
  const group = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const fallback = useMemo(() => {
    const canvas = makeFallbackTexture(section);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }, [section.id, section.label, section.gender]);

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const overlayAccumulator = useRef(0);
  const fallbackElapsed = useRef(0);
  const wasInRange = useRef(false);
  const screenPosition = useMemo(() => new THREE.Vector3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const [overlayActive, setOverlayActive] = useState(false);
  const [overlayTexture, setOverlayTexture] = useState<THREE.CanvasTexture | null>(null);
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const campaign = useMemo(() => getCampaign(section), [section.id, section.label, section.gender]);

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
    texture.generateMipmaps = false;
    videoTextureRef.current = texture;
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
      videoTextureRef.current = null;
      videoRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!overlayActive) {
      overlayCanvasRef.current = null;
      overlayTextureRef.current = null;
      setOverlayTexture(null);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 432;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    overlayCanvasRef.current = canvas;
    overlayTextureRef.current = texture;
    setOverlayTexture(texture);

    return () => {
      overlayCanvasRef.current = null;
      overlayTextureRef.current = null;
      texture.dispose();
    };
  }, [overlayActive]);

  useFrame((_, delta) => {
    const video = videoRef.current;
    const parent = group.current;
    if (!video || !parent) return;

    parent.getWorldPosition(screenPosition);
    camera.getWorldPosition(cameraPosition);
    const distance = screenPosition.distanceTo(cameraPosition);
    const inRange = distance < 23 && !document.hidden;

    if (inRange !== wasInRange.current) {
      wasInRange.current = inRange;
      setOverlayActive(inRange);
      overlayAccumulator.current = 0;
      if (inRange) fallbackElapsed.current = 0;
    }

    if (inRange) {
      fallbackElapsed.current += delta;

      if (!failed) {
        if (!video.src) {
          video.src = `/videos/sections/${section.id}.mp4`;
          video.load();
        }
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.paused) {
          void video.play().catch(() => undefined);
        }
      }
    } else if (!video.paused) {
      video.pause();
    }

    const canvas = overlayCanvasRef.current;
    const texture = overlayTextureRef.current;
    if (inRange && canvas && texture) {
      overlayAccumulator.current += delta;
      if (overlayAccumulator.current >= OVERLAY_UPDATE_INTERVAL) {
        overlayAccumulator.current = 0;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const elapsed = !video.paused && Number.isFinite(video.currentTime)
            ? video.currentTime % CAMPAIGN_SECONDS
            : fallbackElapsed.current % CAMPAIGN_SECONDS;
          drawCampaignOverlay(ctx, canvas.width, canvas.height, campaign, section.gender, elapsed);
          texture.needsUpdate = true;
        }
      }
    }
  });

  const x = section.side * (HALF_W - 0.205);
  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group ref={group} position={[x, 2.04, section.cz]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[FRAME_WIDTH, FRAME_HEIGHT, 0.13]} />
        <meshStandardMaterial color="#171512" metalness={0.62} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
        <meshBasicMaterial map={frameReady && !failed && videoTexture ? videoTexture : fallback} toneMapped={false} />
      </mesh>
      {overlayActive && overlayTexture && (
        <mesh position={[0, 0, 0.026]}>
          <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
          <meshBasicMaterial map={overlayTexture} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      )}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (FRAME_WIDTH / 2 - 0.015), 0, 0.018]}>
          <boxGeometry args={[0.035, FRAME_HEIGHT + 0.02, 0.035]} />
          <meshStandardMaterial color="#e7c68f" emissive="#d8ad69" emissiveIntensity={0.8} metalness={0.68} roughness={0.24} />
        </mesh>
      ))}
      <mesh position={[0, SCREEN_HEIGHT / 2 + 0.09, 0.018]}>
        <boxGeometry args={[FRAME_WIDTH, 0.035, 0.035]} />
        <meshStandardMaterial color="#e7c68f" emissive="#d8ad69" emissiveIntensity={0.65} metalness={0.68} roughness={0.24} />
      </mesh>
    </group>
  );
}

export function SectionVideoPanel({ section }: { section: PlacedSection }) {
  return <VideoScreen section={section} />;
}
