"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { MALL } from "@/lib/config/mall";
import { PLAZA, S_INFLECTION, offsetAt, pointAt } from "@/lib/config/path";
import { Foliage } from "./Foliage";

const H = MALL.ceiling;

function boardTexture(main: string, sub: string) {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 160;
  const g = c.getContext("2d")!;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (const [blur, a] of [
    [30, 0.85],
    [10, 0.9],
    [0, 0],
  ] as const) {
    g.save();
    g.shadowColor = `rgba(255,196,120,${a})`;
    g.shadowBlur = blur;
    g.fillStyle = "#ffe2b0";
    g.font = '600 74px Georgia, "Times New Roman", serif';
    if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "22px";
    g.fillText(main, 512, 70);
    g.restore();
  }
  g.font = '500 22px "Helvetica Neue", Arial, sans-serif';
  if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "10px";
  g.fillStyle = "rgba(226,190,130,0.95)";
  g.fillText(sub, 512, 134);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function medallionTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(256, 256, 20, 256, 256, 256);
  grad.addColorStop(0, "#efe6d6");
  grad.addColorStop(1, "#d8ccb8");
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 512);
  g.strokeStyle = "#b8955c";
  g.lineWidth = 6;
  for (const r of [250, 236, 120]) {
    g.beginPath();
    g.arc(256, 256, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "rgba(184,149,92,0.85)";
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r = i % 2 === 0 ? 230 : 150;
    g.beginPath();
    g.moveTo(256, 256);
    g.lineTo(256 + Math.cos(a - 0.08) * 60, 256 + Math.sin(a - 0.08) * 60);
    g.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r);
    g.lineTo(256 + Math.cos(a + 0.08) * 60, 256 + Math.sin(a + 0.08) * 60);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#3a2f24";
  g.font = '600 54px Georgia, serif';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("SN", 256, 258);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * The 10 m transition plaza (store-free): a floor medallion at the inflection point, two gateway
 * pylons carrying a glossy double-sided WOMEN | MEN board, and planted seating niches in the widened sides.
 */
export function Plaza() {
  const assets = useMemo(() => {
    const men = boardTexture("MEN", "THE MEN'S COLLECTION  ·  SHOPNET");
    const women = boardTexture("WOMEN", "THE WOMEN'S COLLECTION  ·  SHOPNET");
    const medal = medallionTexture();
    return {
      men,
      women,
      medal,
      lacquer: new THREE.MeshPhysicalMaterial({ color: "#211c1d", roughness: 0.15, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3 }),
      brass: new THREE.MeshStandardMaterial({ color: "#c9a56a", metalness: 0.88, roughness: 0.22, envMapIntensity: 1.3 }),
      pylon: new THREE.MeshStandardMaterial({ color: "#efe7da", roughness: 0.35, envMapIntensity: 0.7 }),
      wood: new THREE.MeshStandardMaterial({ color: "#7a5a3e", roughness: 0.5 }),
      planter: new THREE.MeshStandardMaterial({ color: "#e4dccf", roughness: 0.45 }),
      foliage: new THREE.MeshStandardMaterial({ color: "#1d2a17", roughness: 1 }),
      medalMat: new THREE.MeshStandardMaterial({ roughness: 0.18, metalness: 0.08, envMapIntensity: 1 }),
      menMat: new THREE.MeshBasicMaterial({ map: men, transparent: true, toneMapped: false, depthWrite: false }),
      womenMat: new THREE.MeshBasicMaterial({ map: women, transparent: true, toneMapped: false, depthWrite: false }),
    };
  }, []);
  useEffect(() => {
    assets.medalMat.map = assets.medal;
    assets.medalMat.needsUpdate = true;
    return () => {
      assets.men.dispose();
      assets.women.dispose();
      assets.medal.dispose();
    };
  }, [assets]);

  const c = pointAt(S_INFLECTION);
  const gate = pointAt(PLAZA.start + 1.2);
  const niches = useMemo(() => {
    const out: { x: number; z: number; yaw: number }[] = [];
    for (const [s, d] of [
      [S_INFLECTION - 2.2, 3.55],
      [S_INFLECTION + 2.2, 3.55],
      [S_INFLECTION - 2.2, -3.55],
      [S_INFLECTION + 2.2, -3.55],
    ] as const) {
      const p = offsetAt(s, d);
      const yaw = pointAt(s).yaw;
      out.push({ x: p.x, z: p.z, yaw });
    }
    return out;
  }, []);

  const balls = useMemo(() => niches.map((n) => ({ x: n.x, y: 0.88, z: n.z, r: 0.6 })), [niches]);

  return (
    <group>
      <Foliage runs={[]} balls={balls} />
      {/* floor medallion at the inflection point */}
      <mesh position={[c.x, 0.008, c.z]} rotation-x={-Math.PI / 2} rotation-z={c.yaw} material={assets.medalMat}>
        <circleGeometry args={[1.7, 64]} />
      </mesh>
      {/* gateway: two pylons and a glossy board facing both directions */}
      <group position={[gate.x, 0, gate.z]} rotation-y={gate.yaw}>
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 2.25, 0, 0]}>
            <mesh position={[0, H / 2, 0]} material={assets.pylon}>
              <boxGeometry args={[0.42, H, 0.42]} />
            </mesh>
            <mesh position={[0, H / 2, 0]} material={assets.brass}>
              <boxGeometry args={[0.46, 0.05, 0.46]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 3.55, 0]} material={assets.lacquer}>
          <boxGeometry args={[4.08, 0.72, 0.16]} />
        </mesh>
        <mesh position={[0, 3.18, 0]} material={assets.brass}>
          <boxGeometry args={[4.08, 0.03, 0.18]} />
        </mesh>
        {/* local -Z faces the direction of travel: the face toward an approaching customer reads MEN, the other WOMEN */}
        <mesh position={[0, 3.56, 0.085]} material={assets.menMat}>
          <planeGeometry args={[3.7, 0.58]} />
        </mesh>
        <mesh position={[0, 3.56, -0.085]} rotation-y={Math.PI} material={assets.womenMat}>
          <planeGeometry args={[3.7, 0.58]} />
        </mesh>
      </group>
      {/* planted seating niches in the widened plaza sides */}
      {niches.map((n, i) => (
        <group key={i} position={[n.x, 0, n.z]} rotation-y={n.yaw}>
          <mesh position={[0, 0.3, 0]} material={assets.planter}>
            <cylinderGeometry args={[0.55, 0.5, 0.6, 32]} />
          </mesh>
          <mesh position={[0, 0.88, 0]} material={assets.foliage}>
            <sphereGeometry args={[0.52, 20, 14]} />
          </mesh>
          <mesh position={[0, 0.235, i < 2 ? 1.15 : -1.15]} material={assets.wood}>
            <boxGeometry args={[0.5, 0.09, 1.3]} />
          </mesh>
          <mesh position={[0, 0.1, i < 2 ? 1.15 : -1.15]} material={assets.brass}>
            <boxGeometry args={[0.44, 0.2, 1.24]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
