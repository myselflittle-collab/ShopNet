"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { MALL } from "@/lib/config/mall";
import { pathFrameAt, pathOffsetAt } from "@/mall/navigation/path";
import { makePathRibbonGeometry, makePathWallGeometry } from "@/mall/sections/geometry";
import { getPolishedStoneTexture, getRibbedWallTexture, getStoreWallpaper } from "./materialTextures";
import { makeLabelTexture } from "./labelTexture";

const SOFFIT = "#34302c";
const BRASS = "#b99a6a";

function IslandSet({ side, positions, gender }: {
  side: -1 | 1;
  positions: number[];
  gender: "women" | "men";
}) {
  const ribbed = useMemo(() => getRibbedWallTexture(gender), [gender]);
  return (
    <group>
      {positions.map((s) => {
        const frame = pathFrameAt(s);
        return (
          <group key={`${gender}-atrium-${s}`} position={[frame.x, 0, frame.z]} rotation-y={frame.yaw}>
            {/* A low, open planter and a sculptural brand marker: no full-height atrium walls. */}
            <mesh position={[side * 2.72, 0.22, 0]}>
              <boxGeometry args={[1.12, 0.44, 2.7]} />
              <meshStandardMaterial map={ribbed ?? undefined} color={gender === "women" ? "#c9b49d" : "#69645d"} roughness={0.72} />
            </mesh>
            <mesh position={[side * 2.72, 0.46, 0]}>
              <boxGeometry args={[1.04, 0.06, 2.58]} />
              <meshStandardMaterial color="#2b2926" metalness={0.48} roughness={0.3} />
            </mesh>
            <mesh position={[side * 2.72, 1.02, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 1.08, 8]} />
              <meshStandardMaterial color="#5f4838" roughness={0.78} />
            </mesh>
            <mesh position={[side * 2.72, 1.68, 0]}>
              <sphereGeometry args={[0.38, 12, 10]} />
              <meshStandardMaterial color={gender === "women" ? "#65745a" : "#53665b"} roughness={0.92} />
            </mesh>
            <mesh position={[side * 2.72, 2.25, 0.82]}>
              <boxGeometry args={[0.07, 1.1, 0.07]} />
              <meshStandardMaterial color={BRASS} metalness={0.68} roughness={0.3} emissive="#805c31" emissiveIntensity={0.12} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Shell() {
  const stone = useMemo(() => getPolishedStoneTexture(), []);
  const womenWall = useMemo(() => getStoreWallpaper("women", "shopnet-women-outer-wall"), []);
  const menWall = useMemo(() => getStoreWallpaper("men", "shopnet-men-outer-wall"), []);
  const foyerWall = useMemo(() => getStoreWallpaper("women", "shopnet-entrance-wallpaper"), []);
  const foyerBrand = useMemo(() => makeLabelTexture([
    { text: "SHOPNET", size: 94, weight: 800, letterSpacing: 20, color: "#201c18" },
    { text: "THE FASHION MALL", size: 28, weight: 500, letterSpacing: 12, color: "#9b7443" },
  ], { width: 1024, height: 260, bg: "#f5f0e7" }), []);

  const floor = useMemo(() => makePathRibbonGeometry(0, MALL.length, -2, 2, 0), []);
  const womenFloor = useMemo(() => makePathRibbonGeometry(8, MALL.womenEndS, -5.8, -2, 0.003), []);
  const menFloor = useMemo(() => makePathRibbonGeometry(MALL.plazaEndS, MALL.menEndS, 2, 5.8, 0.003), []);
  // The narrow inner-side atrium bands are real floor, not voids or enclosed rooms.
  const womenAtriumFloor = useMemo(() => makePathRibbonGeometry(8, MALL.womenEndS, 2, 3.344, 0.003), []);
  const menAtriumFloor = useMemo(() => makePathRibbonGeometry(MALL.plazaEndS, MALL.menEndS, -3.344, -2, 0.003), []);
  // The store-free 10 m plaza opens across both inner display bands around the walkway.
  const plazaFloor = useMemo(() => makePathRibbonGeometry(MALL.womenEndS, MALL.plazaEndS, -3.344, 3.344, 0.003), []);
  const walkwaySoffit = useMemo(() => makePathRibbonGeometry(0, MALL.length, -2, 2, MALL.ceiling), []);
  const womenSoffit = useMemo(() => makePathRibbonGeometry(8, MALL.womenEndS, -5.8, -2, MALL.ceiling), []);
  const menSoffit = useMemo(() => makePathRibbonGeometry(MALL.plazaEndS, MALL.menEndS, 2, 5.8, MALL.ceiling), []);
  const womenOuter = useMemo(() => makePathWallGeometry(8, MALL.womenEndS, -5.8), []);
  const menOuter = useMemo(() => makePathWallGeometry(MALL.plazaEndS, MALL.menEndS, 5.8), []);
  const foyerLeft = useMemo(() => makePathWallGeometry(0, 8, -2.05), []);
  const foyerRight = useMemo(() => makePathWallGeometry(0, 8, 2.05), []);
  const ceilingTrim = useMemo(() => [
    makePathRibbonGeometry(0, MALL.length, -1.98, -1.94, MALL.ceiling - 0.025),
    makePathRibbonGeometry(0, MALL.length, 1.94, 1.98, MALL.ceiling - 0.025),
  ], []);

  useEffect(() => () => {
    [floor, womenFloor, menFloor, womenAtriumFloor, menAtriumFloor, plazaFloor, walkwaySoffit, womenSoffit, menSoffit, womenOuter, menOuter, foyerLeft, foyerRight, ...ceilingTrim]
      .forEach((geometry) => geometry.dispose());
    stone?.dispose();
    foyerBrand.dispose();
  }, [floor, womenFloor, menFloor, womenAtriumFloor, menAtriumFloor, plazaFloor, walkwaySoffit, womenSoffit, menSoffit, womenOuter, menOuter, foyerLeft, foyerRight, ceilingTrim, stone, foyerBrand]);

  const foyer = pathFrameAt(4);
  const entrancePillars = [
    { s: 1.1, side: -1 as const }, { s: 1.1, side: 1 as const },
    { s: 6.9, side: -1 as const }, { s: 6.9, side: 1 as const },
  ].map(({ s, side }) => ({
    s, side, point: pathOffsetAt(s, side * 1.82), frame: pathFrameAt(s),
  }));

  return (
    <group>
      {/* One continuous 4 m stone walkway; the shop floors meet it without gaps or raised thresholds. */}
      <mesh geometry={floor}>
        <meshStandardMaterial map={stone ?? undefined} color="#d7d0c5" roughness={0.3} metalness={0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={womenFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#b9aa98" roughness={0.32} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#8d8980" roughness={0.34} metalness={0.08} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={womenAtriumFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#c9bba9" roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menAtriumFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#908c83" roughness={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={plazaFloor}>
        <meshStandardMaterial map={stone ?? undefined} color="#b8ac9b" roughness={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Continuous dark soffit above the route and each retail row; atrium islands remain open, not rooms. */}
      <mesh geometry={walkwaySoffit}>
        <meshStandardMaterial color={SOFFIT} roughness={0.82} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={womenSoffit}>
        <meshStandardMaterial color="#514238" roughness={0.74} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menSoffit}>
        <meshStandardMaterial color="#34383a" roughness={0.74} side={THREE.DoubleSide} />
      </mesh>
      {ceilingTrim.map((geometry, i) => (
        <mesh key={i} geometry={geometry}>
          <meshBasicMaterial color="#d5b780" />
        </mesh>
      ))}

      {/* Continuous outer rear walls. These close every gap between storefronts and prevent outside bleed-through. */}
      <mesh geometry={womenOuter}>
        <meshStandardMaterial map={womenWall ?? undefined} color="#eadbca" roughness={0.68} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={menOuter}>
        <meshStandardMaterial map={menWall ?? undefined} color="#c5c0b6" roughness={0.68} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={foyerLeft}>
        <meshStandardMaterial map={foyerWall ?? undefined} color="#e9dfd2" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={foyerRight}>
        <meshStandardMaterial map={foyerWall ?? undefined} color="#e9dfd2" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* The foyer sign floats between two thin, premium-finish entrance piers. */}
      <group position={[foyer.x, 0, foyer.z]} rotation-y={foyer.yaw}>
        <mesh position={[0, 3.08, 0]} rotation-y={Math.PI}>
          <planeGeometry args={[3.7, 0.94]} />
          <meshStandardMaterial map={foyerBrand} emissive="#b98a4b" emissiveMap={foyerBrand} emissiveIntensity={0.08} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {entrancePillars.map(({ s, side, point, frame }) => (
        <group key={`foyer-pillar-${s}-${side}`} position={[point.x, 0, point.z]} rotation-y={frame.yaw}>
          <mesh position={[0, MALL.ceiling / 2, 0]}>
            <boxGeometry args={[0.28, MALL.ceiling, 0.28]} />
            <meshStandardMaterial map={foyerWall ?? undefined} color="#c7b59e" roughness={0.54} metalness={0.1} />
          </mesh>
          <mesh position={[0.145, MALL.ceiling / 2, 0]}>
            <boxGeometry args={[0.022, MALL.ceiling, 0.3]} />
            <meshStandardMaterial color={BRASS} metalness={0.7} roughness={0.26} emissive="#805c31" emissiveIntensity={0.16} />
          </mesh>
        </group>
      ))}

      {/* Atrium islands are open landscape/display elements, not white or black enclosed rooms. */}
      <IslandSet side={1} positions={[18, 29, 40, 51]} gender="women" />
      <IslandSet side={-1} positions={[78, 89, 100, 113]} gender="men" />
    </group>
  );
}
