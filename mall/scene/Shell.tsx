"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { MALL, ATRIUM_EDGE_OFFSET } from "@/lib/config/mall";
import { makeLabelTexture } from "./labelTexture";
import { getPolishedStoneTexture, getRibbedWallTexture, getStoreWallpaper } from "./materialTextures";
import { makePathIslandGeometry, makePathRibbonGeometry, makePathWallGeometry } from "@/mall/sections/geometry";
import { pathFrameAt, pathOffsetAt } from "@/mall/navigation/path";

const FLOOR = "#d7d0c5";
const CEILING = "#f1efeb";

export function Shell() {
  const stone = useMemo(() => getPolishedStoneTexture(), []);
  const entranceWall = useMemo(() => getStoreWallpaper("women", "shopnet-entrance-wallpaper"), []);
  const womenCoreFinish = useMemo(() => getRibbedWallTexture("women"), []);
  const menCoreFinish = useMemo(() => getRibbedWallTexture("men"), []);
  const womenBack = useMemo(() => makePathWallGeometry(8, MALL.womenEndS, -5.8, 0, MALL.ceiling), []);
  const menBack = useMemo(() => makePathWallGeometry(MALL.plazaEndS, MALL.menEndS, 5.8, 0, MALL.ceiling), []);
  const womenCore = useMemo(() => makePathWallGeometry(8, MALL.womenEndS, ATRIUM_EDGE_OFFSET, 0, MALL.ceiling), []);
  const menCore = useMemo(() => makePathWallGeometry(MALL.plazaEndS, MALL.menEndS, -ATRIUM_EDGE_OFFSET, 0, MALL.ceiling), []);
  const foyerLeft = useMemo(() => makePathWallGeometry(0, MALL.foyerEndS, -2, 0, MALL.ceiling), []);
  const foyerRight = useMemo(() => makePathWallGeometry(0, MALL.foyerEndS, 2, 0, MALL.ceiling), []);
  const floorPath = useMemo(() => makePathRibbonGeometry(0, MALL.length, -2, 2, 0), []);
  const walkwayCeiling = useMemo(() => makePathRibbonGeometry(8, MALL.menEndS, -2, 2, MALL.ceiling), []);
  const womenCeiling = useMemo(() => makePathRibbonGeometry(8, MALL.womenEndS, -5.8, ATRIUM_EDGE_OFFSET, MALL.ceiling), []);
  const menCeiling = useMemo(() => makePathRibbonGeometry(MALL.plazaEndS, MALL.menEndS, -ATRIUM_EDGE_OFFSET, 5.8, MALL.ceiling), []);
  const womenAtriumFloor = useMemo(() => makePathRibbonGeometry(8, MALL.womenEndS, 2, ATRIUM_EDGE_OFFSET, 0), []);
  const womenAtriumIsland = useMemo(() => makePathIslandGeometry(8, MALL.womenEndS, ATRIUM_EDGE_OFFSET), []);
  const menAtriumFloor = useMemo(() => makePathRibbonGeometry(MALL.plazaEndS, MALL.menEndS, -ATRIUM_EDGE_OFFSET, -2, 0), []);
  const menAtriumIsland = useMemo(() => makePathIslandGeometry(MALL.plazaEndS, MALL.menEndS, -ATRIUM_EDGE_OFFSET), []);

  const signs = useMemo(() => {
    const women = makeLabelTexture([{ text: "WOMEN", size: 64, weight: 700, letterSpacing: 18 }], { width: 512, height: 128, bg: "#f7f5f1" });
    const men = makeLabelTexture([{ text: "MEN", size: 64, weight: 700, letterSpacing: 18 }], { width: 512, height: 128, bg: "#f7f5f1" });
    const brand = makeLabelTexture([
      { text: "SHOPNET", size: 96, weight: 800, letterSpacing: 22, color: "#1d1b18" },
      { text: "THE FASHION MALL", size: 28, weight: 500, letterSpacing: 12, color: "#8b6b42" },
    ], { width: 1024, height: 280, bg: "#f7f5f1" });
    return { women, men, brand };
  }, []);

  useEffect(() => () => {
    stone?.dispose();
    signs.women.dispose();
    signs.men.dispose();
    signs.brand.dispose();
    [womenBack, menBack, womenCore, menCore, foyerLeft, foyerRight, floorPath, walkwayCeiling, womenCeiling, menCeiling, womenAtriumFloor, menAtriumFloor, womenAtriumIsland, menAtriumIsland]
      .forEach((geometry) => geometry.dispose());
  }, [stone, signs, womenBack, menBack, womenCore, menCore, foyerLeft, foyerRight, floorPath, walkwayCeiling, womenCeiling, menCeiling, womenAtriumFloor, menAtriumFloor]);

  const foyer = pathFrameAt(4);
  const plaza = pathFrameAt(64.313);

  return (
    <group>
      {/* 4 m walkway floor and the retained ceiling outline now follow the S-shaped path. */}
      <mesh geometry={floorPath}>
        <meshStandardMaterial map={stone ?? undefined} color={FLOOR} roughness={0.28} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={walkwayCeiling}>
        <meshStandardMaterial color={CEILING} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={womenCeiling}>
        <meshStandardMaterial color={CEILING} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menCeiling}>
        <meshStandardMaterial color={CEILING} roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner atrium edge floor bands remain inside the two S lobes. */}
      <mesh geometry={womenAtriumFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#c9c0b3" roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menAtriumFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#c9c0b3" roughness={0.42} side={THREE.DoubleSide} />
      </mesh>

      {/* Opaque outer store backs and inner atrium-core walls provide the architecture for occlusion. */}
      <mesh geometry={womenBack}>
        <meshStandardMaterial map={entranceWall ?? undefined} color="#e4dbd6" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menBack}>
        <meshStandardMaterial map={entranceWall ?? undefined} color="#d8dbdf" roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={womenCore}>
        <meshStandardMaterial map={womenCoreFinish ?? undefined} color="#fff8ee" roughness={0.72} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menCore}>
        <meshStandardMaterial map={menCoreFinish ?? undefined} color="#f2eee8" roughness={0.72} side={THREE.DoubleSide} />
      </mesh>

      {/* ShopNet-branded textured wallpaper on both entrance-side walls. */}
      <mesh geometry={foyerLeft}>
        <meshStandardMaterial map={entranceWall ?? undefined} color="#e7e0d7" roughness={0.74} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={foyerRight}>
        <meshStandardMaterial map={entranceWall ?? undefined} color="#e7e0d7" roughness={0.74} side={THREE.DoubleSide} />
      </mesh>
      <group position={[foyer.x, 0, foyer.z]} rotation-y={foyer.yaw}>
        <mesh position={[-1.98, 2.45, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[5.2, 1.55]} />
          <meshStandardMaterial map={signs.brand} roughness={0.58} metalness={0.16} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[1.98, 2.45, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[5.2, 1.55]} />
          <meshStandardMaterial map={signs.brand} roughness={0.58} metalness={0.16} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Textured entrance pillars with brass details. */}
      {[0.7, 7.2].flatMap((s) => [-1, 1].map((side) => {
        const frame = pathFrameAt(s);
        const point = pathOffsetAt(s, side * 1.82);
        return (
          <group key={`entrance-pillar-${s}-${side}`} position={[point.x, 0, point.z]} rotation-y={frame.yaw}>
            <mesh position={[0, MALL.ceiling / 2, 0]}>
              <boxGeometry args={[0.32, MALL.ceiling, 0.32]} />
              <meshStandardMaterial map={entranceWall ?? undefined} color="#cbbba5" roughness={0.54} metalness={0.12} />
            </mesh>
            <mesh position={[0.17, MALL.ceiling / 2, 0]}>
              <boxGeometry args={[0.025, MALL.ceiling, 0.34]} />
              <meshStandardMaterial color="#c6a66f" metalness={0.72} roughness={0.25} emissive="#7c5a2e" emissiveIntensity={0.14} />
            </mesh>
          </group>
        );
      }))}

      {/* Women | Men transition pillars remain outside the 4 m walkway. */}
      {[-1, 1].map((side) => {
        const point = pathOffsetAt(64.313, side * 1.82);
        return (
          <group key={side} position={[point.x, 0, point.z]} rotation-y={plaza.yaw}>
            <mesh position={[0, MALL.ceiling / 2, 0]}>
              <boxGeometry args={[0.38, MALL.ceiling, 0.42]} />
              <meshStandardMaterial map={entranceWall ?? undefined} color="#d8c8ad" roughness={0.45} metalness={0.15} />
            </mesh>
            <mesh position={[0, 3.55, -side * 0.06]}>
              <boxGeometry args={[0.42, 0.06, 0.48]} />
              <meshStandardMaterial color="#d2b279" metalness={0.72} roughness={0.25} emissive="#a87d40" emissiveIntensity={0.25} />
            </mesh>
          </group>
        );
      })}
      <group position={[plaza.x, 3.8, plaza.z]} rotation-y={plaza.yaw}>
        <mesh>
          <boxGeometry args={[0.12, 0.5, 3.2]} />
          <meshStandardMaterial color="#1e2428" metalness={0.64} roughness={0.24} />
        </mesh>
        <mesh position={[0.075, 0, 0]} rotation-y={-Math.PI / 2}>
          <planeGeometry args={[3.1, 0.38]} />
          <meshStandardMaterial map={signs.brand} emissive="#a87d40" emissiveMap={signs.brand} emissiveIntensity={0.12} metalness={0.4} roughness={0.26} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
