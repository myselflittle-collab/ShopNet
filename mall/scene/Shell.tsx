"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BAY_FRONT_X, CORRIDOR_WIDTH, HALF_W, MALL, pathCenterX } from "@/lib/config/mall";
import { makeLabelTexture } from "./labelTexture";
import { getPolishedStoneTexture, getStoreWallpaper } from "./materialTextures";
import { StarryCeiling } from "./StarryCeiling";
import { MallWallContent } from "./MallWallContent";

const FLOOR = "#59616b";
const CORRIDOR = "#333b46";
const WALL = "#27323d";

function makeCurvedFloor(width: number, zStart: number, zEnd: number, across = 22, along = 180) {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= along; j++) {
    const v = j / along;
    const z = zStart + (zEnd - zStart) * v;
    const centre = pathCenterX(z);
    for (let i = 0; i <= across; i++) {
      const u = i / across;
      positions.push(centre + (u - 0.5) * width, 0.002, z);
      uvs.push(u, v);
    }
  }
  const row = across + 1;
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < across; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeCurvedSideWall(side: 1 | -1, zStart: number, zEnd: number, height: number) {
  const along = 180;
  const vertical = 5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= along; j++) {
    const v = j / along;
    const z = zStart + (zEnd - zStart) * v;
    const x = pathCenterX(z) + side * (HALF_W - 0.06);
    for (let i = 0; i <= vertical; i++) {
      const u = i / vertical;
      positions.push(x, u * height, z);
      uvs.push(v * 2, u);
    }
  }
  const row = vertical + 1;
  for (let j = 0; j < along; j++) {
    for (let i = 0; i < vertical; i++) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeCoveCurve(side: 1 | -1, zStart: number, zEnd: number, y: number) {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    const z = zStart + (zEnd - zStart) * t;
    points.push(new THREE.Vector3(pathCenterX(z) + side * (HALF_W - 0.18), y, z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 180, 0.027, 8, false);
}

/** Curved architectural shell, with a vaulted animated galaxy canopy. */
export function Shell() {
  const zStart = MALL.entranceZ + 4;
  const zEnd = -MALL.length - 4;
  const length = zStart - zEnd;
  const zMid = (zStart + zEnd) / 2;

  const floor = useMemo(() => makeCurvedFloor(MALL.width, zStart, zEnd), [zStart, zEnd]);
  const corridor = useMemo(() => makeCurvedFloor(CORRIDOR_WIDTH - 0.4, zStart, zEnd), [zStart, zEnd]);
  const leftWall = useMemo(() => makeCurvedSideWall(-1, zStart, zEnd, MALL.ceiling), [zStart, zEnd]);
  const rightWall = useMemo(() => makeCurvedSideWall(1, zStart, zEnd, MALL.ceiling), [zStart, zEnd]);
  const leftCove = useMemo(() => makeCoveCurve(-1, zStart, zEnd, MALL.ceiling - 0.08), [zStart, zEnd]);
  const rightCove = useMemo(() => makeCoveCurve(1, zStart, zEnd, MALL.ceiling - 0.08), [zStart, zEnd]);

  const stone = useMemo(() => getPolishedStoneTexture(), []);
  const wallFinish = useMemo(() => getStoreWallpaper("men", "mall-outer-wall"), []);

  const signs = useMemo(() => {
    const women = makeLabelTexture([{ text: "WOMEN", size: 64, weight: 700, letterSpacing: 18 }], {
      width: 512, height: 128, bg: "#f7f5f1",
    });
    const men = makeLabelTexture([{ text: "MEN", size: 64, weight: 700, letterSpacing: 18 }], {
      width: 512, height: 128, bg: "#f7f5f1",
    });
    const brand = makeLabelTexture(
      [
        { text: "SHOPNET", size: 80, weight: 800, letterSpacing: 20, color: "#1d1b18" },
        { text: "FASHION MALL", size: 26, weight: 500, letterSpacing: 12, color: "#6b665d" },
      ],
      { width: 1024, height: 256, bg: "#f7f5f1" },
    );
    return { women, men, brand };
  }, []);

  useEffect(() => () => {
    signs.women.dispose();
    signs.men.dispose();
    signs.brand.dispose();
    floor.dispose();
    corridor.dispose();
    leftWall.dispose();
    rightWall.dispose();
    leftCove.dispose();
    rightCove.dispose();
  }, [signs, floor, corridor, leftWall, rightWall, leftCove, rightCove]);

  const entranceX = pathCenterX(MALL.entranceZ + 0.6);
  const endX = pathCenterX(-MALL.length - 0.1);

  return (
    <group>
      {/* Darker, simple polished stone walking surface follows the mall curve. */}
      <mesh geometry={floor}>
        <meshStandardMaterial map={stone ?? undefined} color={FLOOR} roughness={0.24} metalness={0.12} />
      </mesh>
      <mesh geometry={corridor}>
        <meshStandardMaterial map={stone ?? undefined} color={CORRIDOR} roughness={0.2} metalness={0.16} />
      </mesh>

      {/* Curved outer walls follow the same centreline as stores and camera. */}
      <mesh geometry={leftWall}>
        <meshStandardMaterial map={wallFinish ?? undefined} color={WALL} roughness={0.76} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={rightWall}>
        <meshStandardMaterial map={wallFinish ?? undefined} color={WALL} roughness={0.76} side={THREE.DoubleSide} />
      </mesh>

      {/* Large vaulted blue galaxy canopy. */}
      <StarryCeiling
        width={MALL.width}
        length={length}
        zMid={zMid}
        height={MALL.ceiling}
        rise={MALL.ceilingRise}
      />

      {/* Warm perimeter cove lights follow the curve rather than remaining ruler-straight. */}
      <mesh geometry={leftCove}>
        <meshStandardMaterial color="#f5d6a2" emissive="#d6a969" emissiveIntensity={1.1} metalness={0.58} roughness={0.26} />
      </mesh>
      <mesh geometry={rightCove}>
        <meshStandardMaterial color="#f5d6a2" emissive="#d6a969" emissiveIntensity={1.1} metalness={0.58} roughness={0.26} />
      </mesh>

      <MallWallContent />

      {/* End-of-mall brand wall is centred on the curved route. */}
      <mesh position={[endX, MALL.ceiling / 2, -MALL.length - 0.1]}>
        <boxGeometry args={[MALL.width, MALL.ceiling, 0.2]} />
        <meshStandardMaterial color="#d1c9bc" roughness={0.72} />
      </mesh>
      <mesh position={[endX, 2.4, -MALL.length + 0.01]}>
        <planeGeometry args={[4, 1]} />
        <meshStandardMaterial map={signs.brand} roughness={0.8} />
      </mesh>

      {/* Entrance framing tracks the centreline start. */}
      <group position={[entranceX, 0, MALL.entranceZ + 0.6]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (BAY_FRONT_X + 0.25), MALL.ceiling / 2, 0]}>
            <boxGeometry args={[0.5, MALL.ceiling, 0.5]} />
            <meshStandardMaterial color="#77736c" metalness={0.25} roughness={0.42} />
          </mesh>
        ))}
        <mesh position={[0, MALL.ceiling - 0.3, 0]}>
          <boxGeometry args={[BAY_FRONT_X * 2 + 1, 0.6, 0.5]} />
          <meshStandardMaterial color="#77736c" metalness={0.25} roughness={0.42} />
        </mesh>
      </group>

      <mesh position={[entranceX - BAY_FRONT_X + 0.9, 3.35, MALL.entranceZ - 0.5]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial map={signs.women} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[entranceX + BAY_FRONT_X - 0.9, 3.35, MALL.entranceZ - 0.5]}>
        <planeGeometry args={[1.6, 0.4]} />
        <meshStandardMaterial map={signs.men} roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
