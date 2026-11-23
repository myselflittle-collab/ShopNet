"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { registerVideoScreen } from "./videoPlayback";

type CampaignStyle =
  | "tailored-editorial" | "fit-blueprint" | "pop-art-playful" | "swiss-shirt-catalogue"
  | "romantic-runway" | "denim-patchwork" | "heritage-textile" | "kinetic-skirt"
  | "utility-layering" | "soft-luxe" | "runway-motion" | "house-luxury"
  | "jewel-specimen" | "bespoke-menswear" | "precision-trouser" | "streetwear-type"
  | "oxford-minimal" | "raw-denim" | "modern-heritage" | "urban-techwear"
  | "quiet-comfort" | "industrial-spec" | "athletic-motion" | "horology";

interface SectionCampaign {
  style: CampaignStyle;
  title: string;
  eyebrow: string;
  lineOne: string;
  lineTwo: string;
  offerTitle: string;
  offerTicker: string;
  accent: string;
  secondary: string;
  ink: string;
  copyStart: number;
  offerStart: number;
}

const CAMPAIGNS: Record<string, SectionCampaign> = {
  "women-blazers": {
    style: "tailored-editorial",
    title: "THE POWER OF A PERFECT CUT",
    eyebrow: "WOMEN'S TAILORING  /  THE NEW FORM",
    lineOne: "Tailoring that speaks volumes.",
    lineTwo: "Find the fit that leads the room.",
    offerTitle: "THE BLAZER EDIT",
    offerTicker: "Sharp shoulders  ·  Considered details  ·  Modern silhouettes",
    accent: "#d9b77d", secondary: "#f6e9d5", ink: "#221c19",
    copyStart: 2.0, offerStart: 5.85,
  },
  "women-trousers": {
    style: "fit-blueprint",
    title: "FIND YOUR LINE",
    eyebrow: "WOMEN'S TROUSERS  /  FIT STUDY Nº 02",
    lineOne: "A silhouette that moves with you.",
    lineTwo: "Precision in every proportion.",
    offerTitle: "THE PERFECT-FIT SELECTION",
    offerTicker: "Wide-leg  /  Straight cut  /  Fluid tailoring  /  Your fit, your way",
    accent: "#e8c98e", secondary: "#f4eee2", ink: "#202a32",
    copyStart: 2.35, offerStart: 5.55,
  },
  "women-tshirts": {
    style: "pop-art-playful",
    title: "TEE YOUR OWN WAY",
    eyebrow: "WOMEN'S T-SHIRTS  /  THE EVERYDAY DROP",
    lineOne: "A little colour. A lot of character.",
    lineTwo: "Make the everyday anything but ordinary.",
    offerTitle: "FRESH FITS, FRESH MOOD",
    offerTicker: "Relaxed shapes  ✳  Graphic energy  ✳  Everyday favourites",
    accent: "#ffdb38", secondary: "#f26c89", ink: "#142b66",
    copyStart: 1.72, offerStart: 5.95,
  },
  "women-shirts": {
    style: "swiss-shirt-catalogue",
    title: "THE MODERN SHIRT",
    eyebrow: "WOMEN'S SHIRTS  /  WARDROBE STUDY Nº 04",
    lineOne: "An essential, reconsidered.",
    lineTwo: "Clean lines for wherever the day goes.",
    offerTitle: "THE SHIRTING COLLECTION",
    offerTicker: "Crisp cotton  —  Relaxed volume  —  Polished simplicity",
    accent: "#a9c6db", secondary: "#f4f3ee", ink: "#1d2d3b",
    copyStart: 2.6, offerStart: 6.15,
  },
  "women-dresses": {
    style: "romantic-runway",
    title: "MAKE AN ENTRANCE",
    eyebrow: "WOMEN'S DRESSES  /  THE OCCASION EDIT",
    lineOne: "For moments that deserve a little more.",
    lineTwo: "Find the feeling before you find the dress.",
    offerTitle: "DRESS FOR THE MOMENT",
    offerTicker: "Soft movement  ·  Beautiful silhouettes  ·  A little drama",
    accent: "#efc5c6", secondary: "#fff4ec", ink: "#37232d",
    copyStart: 2.15, offerStart: 5.7,
  },
  "women-jeans": {
    style: "denim-patchwork",
    title: "MADE TO MOVE",
    eyebrow: "WOMEN'S JEANS  /  DENIM DEPARTMENT",
    lineOne: "Your favourite fit starts here.",
    lineTwo: "Find your wash. Find your own way.",
    offerTitle: "THE DENIM ARCHIVE",
    offerTicker: "Indigo stories  ·  Fresh washes  ·  Fits for every day",
    accent: "#9bc4dc", secondary: "#e8f1f4", ink: "#102f4a",
    copyStart: 2.4, offerStart: 5.9,
  },
  "women-ethnic": {
    style: "heritage-textile",
    title: "ROOTED IN BEAUTY",
    eyebrow: "WOMEN'S ETHNIC WEAR  /  CRAFT & CELEBRATION",
    lineOne: "A meeting of colour, craft and culture.",
    lineTwo: "Tradition, interpreted in your own style.",
    offerTitle: "THE CELEBRATION COLLECTION",
    offerTicker: "Artful details  ·  Rich textures  ·  Pieces with a story",
    accent: "#e3b66a", secondary: "#f5e3c1", ink: "#3b2418",
    copyStart: 2.1, offerStart: 6.0,
  },
  "women-skirts": {
    style: "kinetic-skirt",
    title: "LET IT FLOW",
    eyebrow: "WOMEN'S SKIRTS  /  MOVEMENT IN FORM Nº 08",
    lineOne: "A little movement changes everything.",
    lineTwo: "Play with length, shape and proportion.",
    offerTitle: "THE MOVEMENT EDIT",
    offerTicker: "Fluid pleats  ·  Easy volume  ·  Shapes that move",
    accent: "#d4e69d", secondary: "#fff8df", ink: "#29391f",
    copyStart: 1.88, offerStart: 5.62,
  },
  "women-jackets": {
    style: "utility-layering",
    title: "LAYER WITH INTENT",
    eyebrow: "WOMEN'S JACKETS  /  OUTERWEAR FIELD NOTES Nº 09",
    lineOne: "The layer that changes the whole look.",
    lineTwo: "Utility, shape and attitude in one move.",
    offerTitle: "THE OUTER LAYER INDEX",
    offerTicker: "Lightweight cover  /  Statement shape  /  Everyday utility",
    accent: "#d1e0a4", secondary: "#f0eee1", ink: "#27322b",
    copyStart: 2.48, offerStart: 5.88,
  },
  "women-innerwear": {
    style: "soft-luxe",
    title: "COMFORT, CLOSE TO YOU",
    eyebrow: "WOMEN'S INNERWEAR  /  THE FEEL-GOOD FOUNDATION",
    lineOne: "The best style begins with how you feel.",
    lineTwo: "Soft essentials, made for your everyday.",
    offerTitle: "THE COMFORT COLLECTION",
    offerTicker: "Soft-touch layers  ·  Easy essentials  ·  Feel-good fits",
    accent: "#d9a9a0", secondary: "#fff0e9", ink: "#49332f",
    copyStart: 2.72, offerStart: 6.05,
  },
  "women-shoes": {
    style: "runway-motion",
    title: "STEP INTO YOUR MOMENT",
    eyebrow: "WOMEN'S SHOES  /  THE SHOE ROOM",
    lineOne: "The finishing touch has its own point of view.",
    lineTwo: "Find the pair that takes you somewhere.",
    offerTitle: "THE NEW-SEASON SHOE EDIT",
    offerTicker: "Everyday ease  ·  Occasion pairs  ·  A new point of view",
    accent: "#f0c46e", secondary: "#fff8e8", ink: "#26221f",
    copyStart: 2.05, offerStart: 5.82,
  },
  "women-handbags": {
    style: "house-luxury",
    title: "CARRY YOUR SIGNATURE",
    eyebrow: "WOMEN'S HANDBAGS  /  OBJECTS OF DESIRE Nº 12",
    lineOne: "A beautiful detail, carried every day.",
    lineTwo: "Find the shape that feels unmistakably yours.",
    offerTitle: "THE HANDBAG SALON",
    offerTicker: "Sculptural forms  ·  Quiet classics  ·  Everyday icons",
    accent: "#d7ba82", secondary: "#f8edda", ink: "#261e19",
    copyStart: 2.55, offerStart: 6.12,
  },
  "women-accessories": {
    style: "jewel-specimen",
    title: "THE ART OF THE DETAIL",
    eyebrow: "WOMEN'S ACCESSORIES  /  CURATED OBJECTS",
    lineOne: "Small pieces. A very personal statement.",
    lineTwo: "Layer, pair and make the look your own.",
    offerTitle: "THE FINISHING TOUCHES",
    offerTicker: "Delicate layers  ·  Modern keepsakes  ·  Details worth noticing",
    accent: "#e2c17a", secondary: "#fff6df", ink: "#30281f",
    copyStart: 2.18, offerStart: 5.76,
  },
  "men-blazers": {
    style: "bespoke-menswear",
    title: "DRESS LIKE YOU MEAN IT",
    eyebrow: "THE BESPOKE ROOM  /  14",
    lineOne: "A sharper layer. A stronger presence.",
    lineTwo: "Find the cut that feels made for you.",
    offerTitle: "THE MODERN TAILORING EDIT",
    offerTicker: "Defined shoulders  ·  Refined lines  ·  A considered fit",
    accent: "#bd9a62", secondary: "#f3e8d5", ink: "#162536",
    copyStart: 2.26, offerStart: 5.86,
  },
  "men-trousers": {
    style: "precision-trouser",
    title: "THE RIGHT PROPORTION",
    eyebrow: "MEN'S TROUSERS  /  GARMENT SPECIFICATION Nº 15",
    lineOne: "The right fit changes everything.",
    lineTwo: "Ease through the day, without losing the line.",
    offerTitle: "THE TROUSER STUDY",
    offerTicker: "Clean break  /  Modern taper  /  Relaxed straight",
    accent: "#c6b18a", secondary: "#f5f0e5", ink: "#25303a",
    copyStart: 2.62, offerStart: 5.56,
  },
  "men-tshirts": {
    style: "streetwear-type",
    title: "NO UNIFORM. JUST YOU.",
    eyebrow: "MEN'S T-SHIRTS  /  OFF-DUTY DEPARTMENT Nº 16",
    lineOne: "Make room for your own point of view.",
    lineTwo: "Everyday pieces. Unexpected energy.",
    offerTitle: "THE STREET-READY DROP",
    offerTicker: "Graphic statements  ·  Easy proportions  ·  No rules required",
    accent: "#c8f06b", secondary: "#f6f2e8", ink: "#171b20",
    copyStart: 1.82, offerStart: 5.92,
  },
  "men-shirts": {
    style: "oxford-minimal",
    title: "ALWAYS WELL PUT",
    eyebrow: "MEN'S SHIRTS  /  THE SHIRTING OFFICE Nº 17",
    lineOne: "Show up sharp, whatever the occasion.",
    lineTwo: "Classic layers with a modern point of view.",
    offerTitle: "THE SHARP-DRESSING EDIT",
    offerTicker: "Oxford textures  ·  Clean collars  ·  Easy refinement",
    accent: "#9fc6dd", secondary: "#f4f8fa", ink: "#172d3e",
    copyStart: 2.38, offerStart: 6.18,
  },
  "men-jeans": {
    style: "raw-denim",
    title: "WORN YOUR WAY",
    eyebrow: "MEN'S JEANS  /  DENIM WORKSHOP Nº 18",
    lineOne: "Denim built around your everyday.",
    lineTwo: "Find the wash and fit that feels right.",
    offerTitle: "THE DENIM WORKSHOP",
    offerTicker: "Deep indigo  ·  Broken-in comfort  ·  Modern classics",
    accent: "#75a9ca", secondary: "#e2edf2", ink: "#152e40",
    copyStart: 2.12, offerStart: 5.72,
  },
  "men-kurtas": {
    style: "modern-heritage",
    title: "A NEW KIND OF TRADITION",
    eyebrow: "MEN'S KURTAS  /  THE MODERN HERITAGE ROOM",
    lineOne: "Heritage details. A distinctly modern feel.",
    lineTwo: "Find your look for every celebration.",
    offerTitle: "THE CONTEMPORARY KURTA EDIT",
    offerTicker: "Craft-led details  ·  Modern ease  ·  Occasion-ready style",
    accent: "#d3a65e", secondary: "#f8e9c9", ink: "#36261a",
    copyStart: 2.5, offerStart: 5.98,
  },
  "men-jackets": {
    style: "urban-techwear",
    title: "BUILT FOR WHAT'S NEXT",
    eyebrow: "MEN'S JACKETS  /  URBAN OUTERWEAR Nº 20",
    lineOne: "Function meets a fearless silhouette.",
    lineTwo: "Make every layer part of the plan.",
    offerTitle: "THE OUTERWEAR SYSTEM",
    offerTicker: "Modern utility  /  Weather-ready layers  /  City movement",
    accent: "#b6d5c1", secondary: "#edf4ed", ink: "#17211e",
    copyStart: 1.96, offerStart: 5.66,
  },
  "men-innerwear": {
    style: "quiet-comfort",
    title: "START WITH COMFORT",
    eyebrow: "MEN'S INNERWEAR  /  THE EVERYDAY FOUNDATION",
    lineOne: "Comfort is not an extra.",
    lineTwo: "It's where every good day begins.",
    offerTitle: "THE DAILY ESSENTIALS",
    offerTicker: "Soft foundations  ·  Dependable fits  ·  Everyday comfort",
    accent: "#c9c1b7", secondary: "#f6f2eb", ink: "#252525",
    copyStart: 2.8, offerStart: 6.22,
  },
  "men-accessories": {
    style: "industrial-spec",
    title: "DETAILS WITH PURPOSE",
    eyebrow: "MEN'S ACCESSORIES  /  EQUIPMENT FOR EVERYDAY Nº 22",
    lineOne: "The details are what make the look.",
    lineTwo: "Discover the pieces that feel like you.",
    offerTitle: "THE PERSONAL KIT",
    offerTicker: "Considered hardware  ·  Daily objects  ·  Finishing details",
    accent: "#c2a56d", secondary: "#e9e1d1", ink: "#1e282a",
    copyStart: 2.3, offerStart: 5.92,
  },
  "men-shoes": {
    style: "athletic-motion",
    title: "GO YOUR OWN WAY",
    eyebrow: "MEN'S SHOES  /  THE FOOTWEAR DEPARTMENT",
    lineOne: "Every step says something about your style.",
    lineTwo: "Find the pair for wherever you're headed.",
    offerTitle: "THE FOOTWEAR SELECTION",
    offerTicker: "Everyday trainers  ·  Smart steps  ·  Weekend movement",
    accent: "#e0c078", secondary: "#f5f0e5", ink: "#1c242d",
    copyStart: 1.76, offerStart: 5.8,
  },
  "men-watches": {
    style: "horology",
    title: "TIME, WELL SPENT",
    eyebrow: "MEN'S WATCHES  /  THE WATCH ROOM Nº 24",
    lineOne: "Make every moment part of your style.",
    lineTwo: "Discover the detail that stands the test of time.",
    offerTitle: "THE TIMEPIECE COLLECTION",
    offerTicker: "Quiet precision  ·  Considered design  ·  Lasting character",
    accent: "#d6bd82", secondary: "#fff4d9", ink: "#1e2228",
    copyStart: 2.42, offerStart: 6.02,
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
    style: "swiss-shirt-catalogue",
    title: section.label.toUpperCase(),
    eyebrow: "SHOPNET  /  NEW COLLECTION",
    lineOne: "Discover pieces that feel like you.",
    lineTwo: "Find a fresh favourite for your wardrobe.",
    offerTitle: "EXPLORE THE COLLECTION",
    offerTicker: "Discover the collection  ·  Find your style  ·  Shop the edit",
    accent: "#d9b77d", secondary: "#f6e9d5", ink: "#221c19",
    copyStart: 2.1, offerStart: 5.8,
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}
function easeOut(value: number) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}
function easeInOut(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  font: string,
  color: string,
  align: CanvasTextAlign = "left",
  weight = 500,
  alpha = 1,
) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,0.34)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
}
function drawTyped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  progress: number,
  color: string,
  font = "500 18px Arial, sans-serif",
) {
  const chars = Math.floor(text.length * clamp01(progress));
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.fillText(text.slice(0, chars), x, y, maxWidth);
  if (progress > 0.02 && progress < 0.99) {
    const prefix = text.slice(0, chars);
    const cursorX = x + Math.min(maxWidth - 5, ctx.measureText(prefix).width + 3);
    ctx.fillRect(cursorX, y - 16, 2, 18);
  }
  ctx.restore();
}
function drawRule(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, alpha = 1, width = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha = 1, lineWidth = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function drawBadge(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, bg: string, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.font = "700 12px Arial, sans-serif";
  const width = Math.min(208, ctx.measureText(text).width + 24);
  ctx.fillStyle = bg;
  ctx.fillRect(-width / 2, -15, width, 30);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-width / 2, -15, width, 30);
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.fillText(text, 0, 4, width - 14);
  ctx.restore();
}
function drawTicker(ctx: CanvasRenderingContext2D, text: string, time: number, x: number, y: number, width: number, color: string, size = 13) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y - 20, width, 28);
  ctx.clip();
  ctx.font = `600 ${size}px Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  const itemWidth = ctx.measureText(text).width + 100;
  const offset = (time * 52) % itemWidth;
  for (let pos = x - offset; pos < x + width + itemWidth; pos += itemWidth) {
    ctx.fillText(text, pos, y);
  }
  ctx.restore();
}
function drawHalftone(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string, time: number) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.52;
  for (let y = -radius; y <= radius; y += 12) {
    for (let x = -radius; x <= radius; x += 12) {
      const distance = Math.hypot(x, y);
      if (distance > radius) continue;
      const dot = 1.1 + 1.7 * (1 - distance / radius);
      ctx.beginPath();
      ctx.arc(cx + x + Math.sin(time * 1.2 + y * 0.03) * 1.3, cy + y, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawOfferMicro(ctx: CanvasRenderingContext2D, c: SectionCampaign, t: number, x: number, y: number, align: CanvasTextAlign = "left") {
  const p = easeOut((t - c.offerStart) / 0.34);
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha = p;
  drawText(ctx, c.offerTitle, x, y, 330, 14, "Arial, sans-serif", c.accent, align, 700);
  drawTicker(ctx, c.offerTicker, t, align === "right" ? x - 285 : x, y + 23, 285, c.secondary, 11);
  ctx.restore();
}

function drawCampaignOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  campaign: SectionCampaign,
  elapsed: number,
) {
  const t = ((elapsed % CAMPAIGN_SECONDS) + CAMPAIGN_SECONDS) % CAMPAIGN_SECONDS;
  const titleP = easeOut(t / 0.68);
  const copyOne = clamp01((t - campaign.copyStart - 0.24) / 0.9);
  const copyTwo = clamp01((t - campaign.copyStart - 0.86) / 1.0);
  const alphaOffer = easeOut((t - campaign.offerStart) / 0.36);
  const cx = width / 2;
  const cy = height / 2;
  const a = campaign.accent;
  const s = campaign.secondary;
  const ink = campaign.ink;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (campaign.style) {
    case "tailored-editorial": {
      const slide = (1 - titleP) * -34;
      drawRule(ctx, 36, 45, 36, 198, a, titleP, 2);
      drawText(ctx, campaign.eyebrow, 54, 52, 420, 11, "Arial, sans-serif", a, "left", 700, titleP);
      ctx.save();
      ctx.globalAlpha = titleP;
      ctx.translate(0, slide);
      drawText(ctx, "A STUDY IN", 54, 103, 200, 12, "Arial, sans-serif", s, "left", 600);
      drawText(ctx, campaign.title, 54, 151, 520, 39, "Georgia, serif", s, "left", 500);
      ctx.restore();
      if (copyOne > 0 || copyTwo > 0) {
        drawText(ctx, campaign.lineOne, 55, 352, 440, 17, "Arial, sans-serif", s, "left", 500, copyOne);
        drawText(ctx, campaign.lineTwo, 55, 379, 440, 15, "Arial, sans-serif", s, "left", 400, copyTwo);
      }
      drawOfferMicro(ctx, campaign, t, 55, 414);
      break;
    }
    case "fit-blueprint": {
      ctx.save();
      ctx.globalAlpha = 0.38;
      for (let i = 0; i < 11; i++) {
        const x = 36 + i * 28;
        drawRule(ctx, x, 28, x, 400, a, 1, 0.6);
      }
      for (let y = 38; y < 410; y += 42) drawRule(ctx, 32, y, 735, y, a, 0.42, 0.6);
      ctx.restore();
      drawText(ctx, "02", 720, 155, 150, 100, "Georgia, serif", a, "right", 400, titleP * 0.7);
      drawText(ctx, campaign.eyebrow, 40, 54, 390, 11, "monospace", s, "left", 700, titleP);
      drawText(ctx, campaign.title, 40, 139, 460, 42, "Arial, sans-serif", s, "left", 800, titleP);
      drawRule(ctx, 40, 164, 470, 164, a, titleP, 2);
      drawText(ctx, "PROPORTION / MOVEMENT / FORM", 40, 190, 390, 10, "monospace", a, "left", 500, titleP);
      drawTyped(ctx, campaign.lineOne, 40, 352, 485, copyOne, s, "500 16px Arial, sans-serif");
      drawTyped(ctx, campaign.lineTwo, 40, 379, 485, copyTwo, s, "500 15px Arial, sans-serif");
      drawBadge(ctx, campaign.offerTitle, 586, 385, ink, a, -0.025 * Math.sin(t * 1.8));
      break;
    }
    case "pop-art-playful": {
      drawHalftone(ctx, 650, 100, 108, a, t);
      ctx.save();
      ctx.translate(245, 166);
      ctx.rotate(-0.055 + Math.sin(t * 1.7) * 0.012);
      ctx.globalAlpha = titleP;
      drawText(ctx, "MAKE IT", 0, 0, 400, 28, "Arial Black, Arial, sans-serif", s, "left", 900);
      drawText(ctx, campaign.title, 0, 61, 540, 40, "Arial Black, Arial, sans-serif", a, "left", 900);
      ctx.restore();
      drawBadge(ctx, "YOUR STYLE / YOUR RULES", 584, 251 + Math.sin(t * 2) * 5, ink, a, 0.12);
      drawText(ctx, campaign.lineOne, 42, 354, 430, 16, "Arial, sans-serif", s, "left", 700, copyOne);
      drawText(ctx, campaign.lineTwo, 42, 381, 430, 15, "Arial, sans-serif", s, "left", 500, copyTwo);
      if (alphaOffer > 0) drawBadge(ctx, campaign.offerTitle, 174, 414, ink, s, -0.04);
      break;
    }
    case "swiss-shirt-catalogue": {
      drawText(ctx, "SHOPNET     WOMEN'S WARDROBE", 38, 38, 410, 10, "Arial, sans-serif", s, "left", 700, titleP);
      drawText(ctx, "04", 725, 50, 55, 14, "monospace", a, "right", 500, titleP);
      drawRule(ctx, 38, 58, 730, 58, a, 0.8, 1);
      drawText(ctx, campaign.title, 40, 144, 540, 42, "Arial, sans-serif", s, "left", 700, titleP);
      drawText(ctx, "AN EVERYDAY ICON, RECOMPOSED", 42, 172, 380, 10, "monospace", a, "left", 500, titleP);
      drawRule(ctx, 42, 205, 235, 205, s, titleP, 2);
      drawTyped(ctx, campaign.lineOne, 42, 349, 510, copyOne, s, "500 16px Arial, sans-serif");
      drawTyped(ctx, campaign.lineTwo, 42, 377, 510, copyTwo, s, "500 15px Arial, sans-serif");
      drawText(ctx, campaign.offerTitle, 728, 408, 330, 13, "Arial, sans-serif", a, "right", 700, alphaOffer);
      break;
    }
    case "romantic-runway": {
      ctx.save();
      ctx.globalAlpha = 0.34;
      drawCircle(ctx, 615, 145, 96 + 7 * Math.sin(t), a, 1, 1);
      drawCircle(ctx, 615, 145, 110 + 5 * Math.cos(t * 0.8), s, 0.7, 0.7);
      ctx.restore();
      drawText(ctx, "THE", 390, 99, 170, 14, "Arial, sans-serif", s, "center", 600, titleP);
      ctx.save();
      ctx.globalAlpha = titleP;
      ctx.translate(385, 164 + Math.sin(t * 1.2) * 3);
      ctx.rotate(-0.025);
      drawText(ctx, campaign.title, 0, 0, 650, 43, "Georgia, serif", s, "center", 400);
      ctx.restore();
      drawText(ctx, campaign.eyebrow, 385, 198, 470, 10, "Arial, sans-serif", a, "center", 700, titleP);
      drawText(ctx, campaign.lineOne, 384, 354, 520, 16, "Georgia, serif", s, "center", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 384, 380, 520, 14, "Arial, sans-serif", s, "center", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, 384, 414, 410, 12, "Arial, sans-serif", a, "center", 700, alphaOffer);
      break;
    }
    case "denim-patchwork": {
      ctx.save();
      ctx.translate(54, 70);
      ctx.rotate(-0.045);
      ctx.strokeStyle = a;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(0, 0, 200, 154);
      ctx.setLineDash([]);
      drawText(ctx, "DENIM", 14, 32, 165, 12, "monospace", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 14, 84, 172, 26, "Georgia, serif", s, "left", 700, titleP);
      drawText(ctx, "WASH / FIT / FEEL", 14, 126, 180, 9, "monospace", a, "left", 600, titleP);
      ctx.restore();
      drawRule(ctx, 38, 285, 310, 285, a, titleP, 3);
      drawText(ctx, campaign.lineOne, 40, 346, 460, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 40, 374, 460, 15, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawBadge(ctx, campaign.offerTitle, 610, 390, s, ink, 0.035);
      break;
    }
    case "heritage-textile": {
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 7; i++) {
        const y = 42 + i * 19;
        drawRule(ctx, 35, y, 175, y, a, 1, 1);
        drawRule(ctx, 590, y, 733, y, a, 1, 1);
      }
      drawCircle(ctx, 384, 165, 88, a, 0.6, 1.4);
      drawCircle(ctx, 384, 165, 98, a, 0.35, 1);
      ctx.restore();
      drawText(ctx, campaign.eyebrow, 384, 91, 600, 11, "Arial, sans-serif", a, "center", 700, titleP);
      drawText(ctx, campaign.title, 384, 167, 650, 39, "Georgia, serif", s, "center", 500, titleP);
      drawRule(ctx, 320, 186, 448, 186, a, titleP, 2);
      drawText(ctx, campaign.lineOne, 384, 346, 560, 16, "Georgia, serif", s, "center", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 384, 374, 560, 14, "Arial, sans-serif", s, "center", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, 384, 414, 520, 12, "Arial, sans-serif", a, "center", 700, alphaOffer);
      break;
    }
    case "kinetic-skirt": {
      ctx.save();
      ctx.translate(505, 146);
      ctx.rotate(-0.1 - Math.sin(t * 1.5) * 0.012);
      drawText(ctx, "IN", 0, -26, 150, 11, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 0, 28, 400, 43, "Georgia, serif", s, "left", 700, titleP);
      drawRule(ctx, -8, 45, 300 + 16 * Math.sin(t * 2), 45, a, titleP, 2);
      ctx.restore();
      drawText(ctx, campaign.eyebrow, 40, 53, 300, 10, "monospace", a, "left", 600, titleP);
      drawText(ctx, campaign.lineOne, 40, 345, 460, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 40, 374, 460, 15, "Georgia, serif", s, "left", 400, copyTwo);
      drawTicker(ctx, campaign.offerTicker, t, 40, 414, 430, a, 12);
      break;
    }
    case "utility-layering": {
      ctx.save();
      ctx.globalAlpha = 0.75;
      drawRule(ctx, 48, 72, 48, 235, a, titleP, 3);
      drawRule(ctx, 48, 72, 230, 72, a, titleP, 3);
      drawRule(ctx, 720, 190, 720, 360, a, titleP, 2);
      ctx.restore();
      drawText(ctx, "FIELD NOTE 09 / OUTER LAYERS", 66, 58, 390, 11, "monospace", s, "left", 700, titleP);
      drawText(ctx, campaign.title, 66, 148, 550, 38, "Arial, sans-serif", s, "left", 900, titleP);
      drawText(ctx, "UTILITY  ·  SHAPE  ·  PURPOSE", 66, 179, 340, 10, "monospace", a, "left", 600, titleP);
      drawTyped(ctx, campaign.lineOne, 66, 346, 470, copyOne, s, "500 16px Arial, sans-serif");
      drawTyped(ctx, campaign.lineTwo, 66, 376, 470, copyTwo, s, "500 14px Arial, sans-serif");
      drawBadge(ctx, campaign.offerTitle, 595, 405, a, ink);
      break;
    }
    case "soft-luxe": {
      ctx.save();
      ctx.globalAlpha = 0.24;
      drawCircle(ctx, 648, 108, 74, a, 1, 1.4);
      drawCircle(ctx, 648, 108, 90, a, 0.8, 0.8);
      ctx.restore();
      drawText(ctx, campaign.eyebrow, 44, 58, 450, 10, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 44, 142, 540, 36, "Georgia, serif", s, "left", 500, titleP);
      drawRule(ctx, 44, 161, 190, 161, a, titleP, 1.6);
      drawText(ctx, campaign.lineOne, 45, 348, 480, 16, "Georgia, serif", s, "left", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 45, 376, 480, 14, "Arial, sans-serif", s, "left", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, 45, 414, 420, 12, "Arial, sans-serif", a, "left", 700, alphaOffer);
      break;
    }
    case "runway-motion": {
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 5; i++) {
        const offset = (t * 48 + i * 37) % 180;
        drawRule(ctx, 440 + offset, 70 + i * 12, 620 + offset, 70 + i * 12, a, 0.5, 1.5);
      }
      ctx.restore();
      drawText(ctx, campaign.eyebrow, 42, 58, 400, 10, "Arial, sans-serif", a, "left", 700, titleP);
      ctx.save();
      ctx.translate(48, 150);
      ctx.rotate(-0.035);
      drawText(ctx, campaign.title, 0, 0, 620, 36, "Arial Black, Arial, sans-serif", s, "left", 900, titleP);
      ctx.restore();
      drawText(ctx, campaign.lineOne, 45, 350, 500, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 45, 379, 500, 14, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawBadge(ctx, campaign.offerTitle, 558, 407, ink, a, -0.04);
      break;
    }
    case "house-luxury": {
      ctx.save();
      ctx.globalAlpha = 0.62;
      drawCircle(ctx, cx, 155, 96, a, 1, 1);
      drawCircle(ctx, cx, 155, 104, a, 0.5, 0.7);
      drawRule(ctx, 180, 155, 588, 155, a, 0.65, 0.7);
      ctx.restore();
      drawText(ctx, "S H O P N E T   /   1 2", cx, 54, 350, 10, "Arial, sans-serif", a, "center", 600, titleP);
      drawText(ctx, campaign.title, cx, 160, 620, 37, "Georgia, serif", s, "center", 500, titleP);
      drawText(ctx, campaign.eyebrow, cx, 191, 520, 10, "Arial, sans-serif", a, "center", 600, titleP);
      drawText(ctx, campaign.lineOne, cx, 352, 520, 16, "Georgia, serif", s, "center", 500, copyOne);
      drawText(ctx, campaign.lineTwo, cx, 378, 520, 14, "Arial, sans-serif", s, "center", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, cx, 414, 420, 12, "Arial, sans-serif", a, "center", 700, alphaOffer);
      break;
    }
    case "jewel-specimen": {
      ctx.save();
      ctx.globalAlpha = 0.65;
      drawCircle(ctx, 633, 145, 63, a, 1, 1.4);
      drawCircle(ctx, 633, 145, 43, a, 0.8, 0.8);
      drawCircle(ctx, 633, 145, 22, a, 0.8, 0.8);
      drawRule(ctx, 633, 70, 633, 222, a, 0.5, 0.8);
      drawRule(ctx, 556, 145, 710, 145, a, 0.5, 0.8);
      ctx.restore();
      drawText(ctx, "CURATED OBJECTS / 13", 42, 57, 360, 10, "monospace", a, "left", 600, titleP);
      drawText(ctx, campaign.title, 42, 144, 470, 34, "Georgia, serif", s, "left", 500, titleP);
      drawText(ctx, "DETAIL IS THE DIFFERENCE", 44, 173, 320, 9, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.lineOne, 44, 352, 480, 15, "Arial, sans-serif", s, "left", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 44, 379, 480, 14, "Arial, sans-serif", s, "left", 400, copyTwo);
      drawBadge(ctx, campaign.offerTitle, 545, 407, s, ink);
      break;
    }
    case "bespoke-menswear": {
      drawRule(ctx, 63, 60, 63, 245, a, titleP, 2);
      drawRule(ctx, 57, 60, 69, 60, a, titleP, 1);
      drawRule(ctx, 57, 245, 69, 245, a, titleP, 1);
      drawText(ctx, campaign.eyebrow, 83, 58, 445, 10, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 83, 143, 570, 39, "Georgia, serif", s, "left", 500, titleP);
      drawText(ctx, "CUT   /   FORM   /   FINISH", 83, 174, 390, 10, "monospace", a, "left", 600, titleP);
      drawText(ctx, campaign.lineOne, 84, 352, 490, 16, "Georgia, serif", s, "left", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 84, 380, 490, 14, "Arial, sans-serif", s, "left", 400, copyTwo);
      drawOfferMicro(ctx, campaign, t, 84, 414);
      break;
    }
    case "precision-trouser": {
      ctx.save();
      ctx.globalAlpha = 0.34;
      for (let i = 0; i < 9; i++) drawRule(ctx, 38 + i * 31, 35, 38 + i * 31, 395, a, 1, 0.6);
      ctx.restore();
      drawText(ctx, "PATTERN / 02", 40, 52, 230, 10, "monospace", a, "left", 700, titleP);
      drawText(ctx, "FIT IS A LANGUAGE.", 40, 112, 460, 16, "Arial, sans-serif", s, "left", 500, titleP);
      drawText(ctx, campaign.title, 40, 171, 600, 38, "Arial, sans-serif", s, "left", 800, titleP);
      drawText(ctx, "FORM FOLLOWS MOVEMENT", 42, 195, 360, 9, "monospace", a, "left", 600, titleP);
      drawTyped(ctx, campaign.lineOne, 42, 349, 500, copyOne, s);
      drawTyped(ctx, campaign.lineTwo, 42, 376, 500, copyTwo, s, "500 15px Arial, sans-serif");
      drawText(ctx, campaign.offerTitle, 728, 409, 360, 12, "monospace", a, "right", 700, alphaOffer);
      break;
    }
    case "streetwear-type": {
      ctx.save();
      ctx.translate(cx, 147);
      ctx.rotate(-0.085);
      drawText(ctx, "OFF", 0, -23, 380, 16, "Arial Black, Arial, sans-serif", a, "center", 900, titleP);
      drawText(ctx, campaign.title, 0, 32, 675, 41, "Arial Black, Arial, sans-serif", s, "center", 900, titleP);
      ctx.restore();
      drawRule(ctx, 48, 198, 718, 198, a, titleP, 3);
      drawBadge(ctx, "NO DRESS CODE", 614, 238, ink, a, 0.08);
      drawText(ctx, campaign.lineOne, 45, 355, 520, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 45, 382, 520, 14, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawTicker(ctx, campaign.offerTicker, t, 45, 414, 540, a, 12);
      break;
    }
    case "oxford-minimal": {
      drawText(ctx, "SHOPNET     /     MEN'S WARDROBE", 42, 45, 420, 10, "Arial, sans-serif", a, "left", 700, titleP);
      drawRule(ctx, 42, 62, 724, 62, s, titleP, 1);
      drawText(ctx, "THE CLASSIC", 42, 111, 230, 12, "Georgia, serif", a, "left", 400, titleP);
      drawText(ctx, campaign.title, 42, 163, 530, 40, "Arial, sans-serif", s, "left", 700, titleP);
      drawText(ctx, "REWORKED FOR THE PRESENT", 44, 190, 330, 9, "monospace", a, "left", 500, titleP);
      drawRule(ctx, 42, 218, 224, 218, a, titleP, 2);
      drawText(ctx, campaign.lineOne, 43, 351, 490, 16, "Georgia, serif", s, "left", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 43, 379, 490, 14, "Arial, sans-serif", s, "left", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, 723, 414, 300, 11, "Arial, sans-serif", a, "right", 700, alphaOffer);
      break;
    }
    case "raw-denim": {
      ctx.save();
      ctx.translate(60, 65);
      ctx.rotate(-0.03);
      ctx.strokeStyle = a;
      ctx.lineWidth = 2;
      ctx.setLineDash([2, 4]);
      ctx.strokeRect(0, 0, 190, 130);
      ctx.setLineDash([]);
      drawText(ctx, "RAW / INDIGO", 12, 24, 160, 10, "monospace", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 12, 74, 170, 25, "Arial Black, Arial, sans-serif", s, "left", 800, titleP);
      drawText(ctx, "DENIM Nº 018", 12, 108, 160, 9, "monospace", a, "left", 600, titleP);
      ctx.restore();
      drawRule(ctx, 44, 281, 322, 281, a, titleP, 3);
      drawText(ctx, campaign.lineOne, 44, 348, 490, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 44, 376, 490, 14, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawBadge(ctx, campaign.offerTitle, 590, 408, a, ink, -0.035);
      break;
    }
    case "modern-heritage": {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = a;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(275, 207); ctx.lineTo(275, 112); ctx.quadraticCurveTo(384, 17, 493, 112); ctx.lineTo(493, 207);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(296, 207); ctx.lineTo(296, 121); ctx.quadraticCurveTo(384, 52, 472, 121); ctx.lineTo(472, 207);
      ctx.stroke();
      ctx.restore();
      drawText(ctx, campaign.eyebrow, cx, 88, 570, 10, "Arial, sans-serif", a, "center", 700, titleP);
      drawText(ctx, campaign.title, cx, 163, 640, 35, "Georgia, serif", s, "center", 500, titleP);
      drawText(ctx, campaign.lineOne, cx, 348, 540, 15, "Georgia, serif", s, "center", 500, copyOne);
      drawText(ctx, campaign.lineTwo, cx, 377, 540, 14, "Arial, sans-serif", s, "center", 400, copyTwo);
      drawBadge(ctx, campaign.offerTitle, cx, 411, a, ink);
      break;
    }
    case "urban-techwear": {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = a;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 62); ctx.lineTo(220, 62); ctx.lineTo(255, 97); ctx.lineTo(255, 201);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(720, 220); ctx.lineTo(720, 374); ctx.lineTo(580, 374);
      ctx.stroke();
      ctx.restore();
      drawText(ctx, "URBAN SYSTEM / 20", 54, 51, 340, 10, "monospace", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 54, 142, 590, 39, "Arial Black, Arial, sans-serif", s, "left", 900, titleP);
      drawText(ctx, "FUNCTION / FORM / FORWARD", 56, 171, 400, 10, "monospace", a, "left", 600, titleP);
      drawText(ctx, campaign.lineOne, 56, 348, 490, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 56, 377, 490, 14, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawOfferMicro(ctx, campaign, t, 56, 414);
      break;
    }
    case "quiet-comfort": {
      drawCircle(ctx, 615, 145, 76, a, 0.24 + 0.1 * Math.sin(t), 1);
      drawCircle(ctx, 615, 145, 56, a, 0.2, 0.8);
      drawText(ctx, "THE EVERYDAY FOUNDATION", 45, 78, 400, 10, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 45, 149, 500, 36, "Georgia, serif", s, "left", 400, titleP);
      drawRule(ctx, 45, 172, 174, 172, a, titleP, 1.3);
      drawText(ctx, campaign.lineOne, 46, 350, 450, 16, "Georgia, serif", s, "left", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 46, 378, 450, 14, "Arial, sans-serif", s, "left", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, 46, 414, 390, 12, "Arial, sans-serif", a, "left", 700, alphaOffer);
      break;
    }
    case "industrial-spec": {
      ctx.save();
      ctx.globalAlpha = 0.36;
      for (let i = 0; i < 6; i++) {
        drawRule(ctx, 40, 82 + i * 42, 728, 82 + i * 42, a, 1, 0.55);
      }
      ctx.restore();
      drawText(ctx, "OBJECT FILE  /  022", 42, 50, 300, 10, "monospace", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 42, 145, 520, 36, "monospace", s, "left", 700, titleP);
      drawText(ctx, "MATERIAL  /  FUNCTION  /  FINISH", 44, 174, 370, 9, "monospace", a, "left", 500, titleP);
      drawRule(ctx, 42, 203, 245, 203, a, titleP, 2);
      drawText(ctx, campaign.lineOne, 44, 350, 495, 15, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 44, 377, 495, 14, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawBadge(ctx, campaign.offerTitle, 586, 408, a, ink);
      break;
    }
    case "athletic-motion": {
      ctx.save();
      ctx.globalAlpha = 0.65;
      for (let i = 0; i < 6; i++) {
        const x = 410 + ((t * 72 + i * 54) % 330);
        drawRule(ctx, x, 75 + i * 12, x + 90, 75 + i * 12, a, 0.6, 2);
      }
      ctx.restore();
      ctx.save();
      ctx.translate(45, 147);
      ctx.rotate(-0.065);
      drawText(ctx, campaign.title, 0, 0, 650, 40, "Arial Black, Arial, sans-serif", s, "left", 900, titleP);
      ctx.restore();
      drawText(ctx, campaign.eyebrow, 46, 57, 390, 10, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.lineOne, 46, 351, 500, 16, "Arial, sans-serif", s, "left", 600, copyOne);
      drawText(ctx, campaign.lineTwo, 46, 379, 500, 14, "Arial, sans-serif", s, "left", 500, copyTwo);
      drawBadge(ctx, campaign.offerTitle, 585, 407, ink, a, -0.04);
      break;
    }
    case "horology": {
      ctx.save();
      ctx.globalAlpha = 0.64;
      drawCircle(ctx, 632, 160, 88, a, 1, 1.2);
      drawCircle(ctx, 632, 160, 73, a, 0.7, 0.7);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r1 = 77, r2 = i % 3 === 0 ? 89 : 83;
        drawRule(ctx, 632 + Math.sin(angle) * r1, 160 - Math.cos(angle) * r1, 632 + Math.sin(angle) * r2, 160 - Math.cos(angle) * r2, a, 1, i % 3 === 0 ? 1.6 : 0.8);
      }
      drawRule(ctx, 632, 160, 632 + Math.sin(t * 0.5) * 52, 160 - Math.cos(t * 0.5) * 52, a, 0.9, 1.5);
      ctx.restore();
      drawText(ctx, "THE WATCH ROOM", 43, 60, 300, 10, "Arial, sans-serif", a, "left", 700, titleP);
      drawText(ctx, campaign.title, 43, 146, 500, 39, "Georgia, serif", s, "left", 500, titleP);
      drawText(ctx, "PRECISION / CHARACTER / TIME", 45, 175, 360, 9, "monospace", a, "left", 500, titleP);
      drawText(ctx, campaign.lineOne, 45, 350, 500, 16, "Georgia, serif", s, "left", 500, copyOne);
      drawText(ctx, campaign.lineTwo, 45, 378, 500, 14, "Arial, sans-serif", s, "left", 400, copyTwo);
      drawText(ctx, campaign.offerTitle, 45, 414, 400, 12, "Arial, sans-serif", a, "left", 700, alphaOffer);
      break;
    }
  }

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
    g.addColorStop(0, "#262128");
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
  ctx.globalAlpha = 0.12;
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
  const c = getCampaign(section);
  drawText(ctx, c.eyebrow, 44, 46, 650, 15, "Arial, sans-serif", c.accent, "left", 700);
  drawText(ctx, c.title, 44, 420, 810, 48, "Georgia, serif", "#fff8ee", "left", 500);
  return canvas;
}

function VideoScreen({ section }: { section: PlacedSection }) {
  const group = useRef<THREE.Group>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTextureRef = useRef<THREE.VideoTexture | null>(null);
  const videoListenersRef = useRef<{ video: HTMLVideoElement; ready: () => void; error: () => void } | null>(null);
  const playbackStateRef = useRef<"DORMANT" | "READY" | "PLAYING">("DORMANT");
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const [playbackState, setPlaybackState] = useState<"DORMANT" | "READY" | "PLAYING">("DORMANT");
  const [videoTexture, setVideoTexture] = useState<THREE.VideoTexture | null>(null);
  const [posterTexture, setPosterTexture] = useState<THREE.Texture | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [overlayTexture, setOverlayTexture] = useState<THREE.CanvasTexture | null>(null);

  playbackStateRef.current = playbackState;

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
  const campaign = useMemo(() => getCampaign(section), [section.id, section.label, section.gender]);

  useEffect(() => {
    let live = true;
    let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().load(
      `/videos/posters/${section.id}.webp`,
      (texture) => {
        if (!live) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        loaded = texture;
        setPosterTexture(texture);
      },
      undefined,
      () => {
        // Keep the lightweight category fallback until the offline poster is generated.
      },
    );
    return () => {
      live = false;
      loaded?.dispose();
      setPosterTexture(null);
    };
  }, [section.id]);

  const releaseMedia = (updateState = true) => {
    const video = videoRef.current;
    const listeners = videoListenersRef.current;
    if (video && listeners) {
      video.removeEventListener("loadeddata", listeners.ready);
      video.removeEventListener("error", listeners.error);
    }
    videoListenersRef.current = null;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null;
    }
    videoTextureRef.current?.dispose();
    videoTextureRef.current = null;
    if (updateState) {
      setVideoTexture(null);
      setFrameReady(false);
    }
  };

  useEffect(() => {
    const object = group.current;
    if (!object) return;
    // Register this storefront at its S-path arc-length position for visibility-based playback.
    return registerVideoScreen(section.id, section.sCenter, object, setPlaybackState);
  }, [section.id, section.cz]);

  useEffect(() => () => {
    releaseMedia(false);
    fallback.dispose();
    overlayTextureRef.current?.dispose();
  }, [fallback]);

  useEffect(() => {
    if (playbackState === "DORMANT") {
      releaseMedia();
      setOverlayTexture(null);
      overlayCanvasRef.current = null;
      overlayTextureRef.current?.dispose();
      overlayTextureRef.current = null;
      setFailed(false);
      return;
    }

    let video = videoRef.current;
    if (!video) {
      const createdVideo = document.createElement("video");
      video = createdVideo;
      createdVideo.muted = true;
      createdVideo.loop = true;
      createdVideo.playsInline = true;
      createdVideo.preload = "auto";
      createdVideo.crossOrigin = "anonymous";
      createdVideo.setAttribute("muted", "");
      createdVideo.setAttribute("playsinline", "");
      createdVideo.src = `/videos/optimized/${section.id}.mp4`;
      videoRef.current = createdVideo;

      const onReady = () => {
        setFrameReady(true);
        if (playbackStateRef.current === "PLAYING") void createdVideo.play().catch(() => undefined);
      };
      let triedOriginal = false;
      const onError = () => {
        // The source MP4 remains a safe fallback until the user runs the lossless preparation script.
        if (!triedOriginal && videoRef.current === createdVideo) {
          triedOriginal = true;
          createdVideo.src = `/videos/sections/${section.id}.mp4`;
          createdVideo.load();
          return;
        }
        setFailed(true);
        setFrameReady(false);
        createdVideo.pause();
      };
      videoListenersRef.current = { video: createdVideo, ready: onReady, error: onError };
      createdVideo.addEventListener("loadeddata", onReady);
      createdVideo.addEventListener("error", onError);

      const texture = new THREE.VideoTexture(createdVideo);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      videoTextureRef.current = texture;
      setVideoTexture(texture);
      setFailed(false);
      video.load();
    }

    if (playbackState === "PLAYING") {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [playbackState, section.id]);

  useEffect(() => {
    if (playbackState !== "PLAYING" || failed) return;
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

    const ctx = canvas.getContext("2d");
    const video = videoRef.current as (HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: (now: number, metadata: { mediaTime: number }) => void) => number;
      cancelVideoFrameCallback?: (handle: number) => void;
    }) | null;
    let active = true;
    let callbackId = 0;
    let raf = 0;

    const redraw = (elapsed: number) => {
      if (!active || !ctx) return;
      drawCampaignOverlay(ctx, canvas.width, canvas.height, campaign, elapsed);
      texture.needsUpdate = true;
    };

    if (video?.requestVideoFrameCallback) {
      const onFrame = (_now: number, metadata: { mediaTime: number }) => {
        if (!active) return;
        redraw(metadata.mediaTime);
        callbackId = video.requestVideoFrameCallback!(onFrame);
      };
      callbackId = video.requestVideoFrameCallback(onFrame);
    } else {
      const tick = () => {
        if (!active) return;
        redraw(video?.currentTime ?? 0);
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    }

    return () => {
      active = false;
      if (video?.cancelVideoFrameCallback && callbackId) video.cancelVideoFrameCallback(callbackId);
      if (raf) window.cancelAnimationFrame(raf);
      overlayCanvasRef.current = null;
      overlayTextureRef.current = null;
      texture.dispose();
      setOverlayTexture(null);
    };
  }, [playbackState, failed, campaign]);

  const screenX = section.side * 5.68;
  const screenRotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group ref={group} position={[screenX, 2.04, 0]} rotation-y={screenRotationY}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[FRAME_WIDTH, FRAME_HEIGHT, 0.13]} />
        <meshStandardMaterial color="#171512" metalness={0.62} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
        <meshBasicMaterial map={frameReady && !failed && videoTexture ? videoTexture : posterTexture ?? fallback} toneMapped={false} />
      </mesh>
      {playbackState === "PLAYING" && overlayTexture && (
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
