"use client";

import { Fragment } from "react";
import * as THREE from "three";
import { HALF_W, MALL } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";
import { AssetModel, type ShopNetModel } from "./AssetModel";

const METAL = "#a88d61";
const WOOD = "#8a7054";
const CREAM = "#ddd5c9";

interface DisplayAsset {
  asset: ShopNetModel;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}

function assetsFor(s: PlacedSection): DisplayAsset[] {
  const x = s.side * (HALF_W - MALL.bayDepth / 2 - 0.25);
  const front = s.cz - 0.8;
  const back = s.cz + 0.65;
  const side = s.side;

  switch (s.id) {
    case "women-blazers":
    case "men-blazers":
    case "women-jackets":
    case "men-jackets":
      return [
        { asset: "jacket", position: [x, 0, front], scale: 0.82 },
        { asset: "hoodie", position: [x, 0, s.cz], scale: 0.82 },
        { asset: "sports-jersey", position: [x, 0, back], scale: 0.82 },
      ];
    case "women-tshirts":
    case "men-tshirts":
    case "women-shirts":
    case "men-shirts":
    case "men-kurtas":
    case "women-ethnic":
      return [
        { asset: "t-shirt", position: [x, 0.78, front], scale: 0.9 },
        { asset: "sports-jersey", position: [x, 0, s.cz], scale: 0.78 },
        { asset: "hoodie", position: [x, 0, back], scale: 0.76 },
      ];
    case "women-shoes":
    case "men-shoes":
      return [
        { asset: "sneaker", position: [x, 0.38, front], scale: 1.0 },
        { asset: "shoe", position: [x, 0.9, s.cz], scale: 0.95 },
        { asset: "sneaker", position: [x, 1.42, back], scale: 0.82 },
      ];
    case "women-handbags":
      return [
        { asset: "handbag", position: [x, 0.95, front], scale: 1.0 },
        { asset: "handbag", position: [x, 1.35, s.cz], rotation: [0, Math.PI * 0.18, 0], scale: 0.82 },
        { asset: "handbag", position: [x, 0.95, back], rotation: [0, -Math.PI * 0.18, 0], scale: 0.9 },
      ];
    case "women-accessories":
    case "men-accessories":
    case "men-watches":
      return [
        { asset: "pocket-watch", position: [x, 1.08, front], scale: 2.0 },
        { asset: "glasses", position: [x, 1.05, s.cz], scale: 1.25 },
        { asset: "fedora", position: [x, 1.1, back], scale: 0.78 },
      ];
    case "women-trousers":
    case "men-trousers":
    case "women-jeans":
      return [
        { asset: "jacket", position: [x, 0, front], scale: 0.72 },
        { asset: "hoodie", position: [x, 0, s.cz], scale: 0.72 },
        { asset: "t-shirt", position: [x, 0.82, back], scale: 0.72 },
      ];
    case "women-dresses":
    case "women-skirts":
    case "women-innerwear":
    case "men-innerwear":
    default:
      return [
        { asset: "jacket", position: [x, 0, front], scale: 0.72 },
        { asset: "hoodie", position: [x, 0, s.cz], scale: 0.72 },
        { asset: "sports-jersey", position: [x, 0, back], scale: 0.72 },
      ];
  }
}

function Rail({ s }: { s: PlacedSection }) {
  const railX = s.side * (HALF_W - 0.55);
  const length = Math.max(1.2, s.width - 0.8);
  return (
    <group>
      <mesh position={[railX, 1.92, s.cz]}>
        <cylinderGeometry args={[0.025, 0.025, length, 12]} />
        <meshStandardMaterial color={METAL} metalness={0.82} roughness={0.28} />
      </mesh>
      {[-1, 1].map((dir) => (
        <mesh key={dir} position={[railX, 0.98, s.cz + dir * (length / 2 - 0.12)]}>
          <cylinderGeometry args={[0.035, 0.035, 1.88, 12]} />
          <meshStandardMaterial color={METAL} metalness={0.82} roughness={0.3} />
        </mesh>
      ))}
      {assetsFor(s).map((item, i) => (
        <AssetModel key={`${item.asset}-${i}`} {...item} />
      ))}
    </group>
  );
}

function Shelves({ s }: { s: PlacedSection }) {
  const x = s.side * (HALF_W - 0.45);
  const length = Math.max(1.2, s.width - 0.6);
  const levels = [0.35, 0.92, 1.49];
  return (
    <group>
      {levels.map((y) => (
        <Fragment key={y}>
          <mesh position={[x, y, s.cz]}>
            <boxGeometry args={[0.5, 0.055, length]} />
            <meshStandardMaterial color={WOOD} roughness={0.42} />
          </mesh>
          <mesh position={[x, y - 0.04, s.cz]}>
            <boxGeometry args={[0.52, 0.025, length + 0.04]} />
            <meshStandardMaterial color={METAL} metalness={0.7} roughness={0.32} />
          </mesh>
        </Fragment>
      ))}
      {assetsFor(s).map((item, i) => (
        <AssetModel key={`${item.asset}-${i}`} {...item} />
      ))}
    </group>
  );
}

function Table({ s }: { s: PlacedSection }) {
  const x = s.side * (HALF_W - MALL.bayDepth / 2 - 0.05);
  return (
    <group>
      <mesh position={[x, 0.43, s.cz]}>
        <boxGeometry args={[1.35, 0.82, 2.4]} />
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </mesh>
      <mesh position={[x, 0.86, s.cz]}>
        <boxGeometry args={[1.4, 0.06, 2.45]} />
        <meshStandardMaterial color={CREAM} roughness={0.5} />
      </mesh>
      {assetsFor(s).map((item, i) => (
        <AssetModel key={`${item.asset}-${i}`} {...item} />
      ))}
    </group>
  );
}

function Cabinet({ s }: { s: PlacedSection }) {
  const x = s.side * (HALF_W - MALL.bayDepth / 2);
  return (
    <group>
      <mesh position={[x, 0.62, s.cz]}>
        <boxGeometry args={[1.25, 1.22, 2.55]} />
        <meshStandardMaterial color="#9c8060" roughness={0.32} metalness={0.2} />
      </mesh>
      <mesh position={[x, 1.27, s.cz]}>
        <boxGeometry args={[1.22, 0.025, 2.52]} />
        <meshStandardMaterial color="#d9cfbd" roughness={0.16} metalness={0.1} />
      </mesh>
      <mesh position={[x, 1.32, s.cz]}>
        <boxGeometry args={[1.18, 0.78, 2.46]} />
        <meshPhysicalMaterial color="#dce5e7" transparent opacity={0.18} roughness={0.08} transmission={0.35} thickness={0.08} />
      </mesh>
      {assetsFor(s).map((item, i) => (
        <AssetModel key={`${item.asset}-${i}`} {...item} />
      ))}
    </group>
  );
}

/**
 * Retail fixtures now carry actual GLB merchandise instead of instanced coloured boxes.
 * Grab3D assets are CC0 but lightweight/stylised; use scanned/artist-made high-detail
 * garment models later for a genuinely photoreal final asset pass.
 */
export function Fixture({ s }: { s: PlacedSection }) {
  switch (s.fixture) {
    case "rack":
      return <Rail s={s} />;
    case "shelves":
      return <Shelves s={s} />;
    case "table":
      return <Table s={s} />;
    case "cabinet":
      return <Cabinet s={s} />;
  }
}
