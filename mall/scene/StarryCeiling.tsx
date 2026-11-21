"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { pathCenterX } from "@/lib/config/mall";

const VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAGMENT = `
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += noise(p) * amplitude;
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}

float stars(vec2 uv, vec2 density, float seed, float threshold) {
  vec2 cell = floor(uv * density);
  vec2 local = fract(uv * density) - 0.5;
  float rnd = hash(cell + seed);
  vec2 offset = vec2(hash(cell + seed + 13.7), hash(cell + seed + 47.1)) - 0.5;
  float radius = mix(0.018, 0.105, pow(rnd, 4.0));
  float d = length(local - offset * 0.72);
  float core = 1.0 - smoothstep(radius * 0.28, radius, d);
  float halo = 1.0 - smoothstep(radius, radius * 4.2, d);
  float twinkle = 0.56 + 0.44 * sin(uTime * (0.8 + rnd * 3.0) + rnd * 46.0);
  return (core + halo * 0.18) * twinkle * step(threshold, rnd);
}

void main() {
  vec2 uv = vUv;
  vec2 p = (uv - vec2(0.5, 0.51)) * vec2(2.15, 1.48);
  float radius = max(length(p), 0.025);
  float angle = atan(p.y, p.x);

  // Large, luminous spiral nebula inspired by the supplied blue-galaxy mall reference.
  float rotation = angle + log(radius + 0.07) * 4.5 - uTime * 0.018;
  float spiralA = pow(max(0.0, 0.5 + 0.5 * cos(rotation * 3.0)), 3.0);
  float spiralB = pow(max(0.0, 0.5 + 0.5 * cos(rotation * 5.0 + 1.25)), 5.0);
  float cloud = fbm(uv * vec2(9.0, 8.0) + vec2(uTime * 0.006, -uTime * 0.004));
  float dust = fbm(uv * vec2(23.0, 17.0) - uTime * 0.009);
  float radial = exp(-radius * 1.85);
  float arms = (spiralA * 0.78 + spiralB * 0.48) * radial;
  float nebula = radial * (0.19 + cloud * 0.66 + dust * 0.22) * (0.34 + arms * 1.35);
  float core = exp(-radius * 11.0);

  vec3 sky = vec3(0.002, 0.008, 0.035);
  sky += vec3(0.015, 0.12, 0.52) * nebula * 1.45;
  sky += vec3(0.00, 0.56, 0.96) * arms * cloud * 0.86;
  sky += vec3(0.13, 0.22, 0.92) * spiralB * radial * 0.65;
  sky += vec3(0.54, 0.12, 0.74) * spiralA * radial * dust * 0.52;
  sky += vec3(0.34, 0.86, 1.0) * core * 0.72;

  // Bright cyan star-forming clouds and violet dust lanes.
  float filaments = pow(max(0.0, sin(angle * 7.0 + log(radius + 0.08) * 5.2 - uTime * 0.024)), 8.0);
  sky += vec3(0.04, 0.58, 1.0) * filaments * radial * cloud * 0.75;
  sky -= vec3(0.018, 0.006, 0.035) * (1.0 - dust) * radial * 0.6;

  float starField = stars(uv, vec2(165.0, 520.0), 3.0, 0.77);
  starField += stars(uv, vec2(82.0, 280.0), 91.0, 0.83) * 0.78;
  starField += stars(uv, vec2(240.0, 760.0), 173.0, 0.91) * 0.52;
  vec3 starTint = mix(vec3(0.58, 0.82, 1.0), vec3(1.0, 0.86, 0.72), hash(floor(uv * vec2(180.0, 580.0))));
  sky += starTint * starField * 2.25;

  // Slow, subtle travelling glints, never strobing.
  float glint = exp(-abs(uv.x - (0.2 + 0.6 * fract(uTime * 0.009 + uv.y * 0.3))) * 160.0)
              * exp(-abs(fract(uv.y * 0.7 + uTime * 0.006) - 0.53) * 130.0);
  sky += vec3(0.05, 0.28, 0.8) * glint * 0.16;

  gl_FragColor = vec4(sky, 1.0);
}`;

function createVaultGeometry(width: number, length: number, zMid: number, height: number, rise: number) {
  const across = 48;
  const along = 180;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const zStart = zMid + length / 2;
  const zEnd = zMid - length / 2;

  for (let j = 0; j <= along; j++) {
    const v = j / along;
    const z = zStart + (zEnd - zStart) * v;
    const pathX = pathCenterX(z);
    for (let i = 0; i <= across; i++) {
      const u = i / across;
      const xNorm = u * 2 - 1;
      const x = pathX + xNorm * width / 2;
      const y = height + rise * (1 - xNorm * xNorm);
      positions.push(x, y, z);
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

export function StarryCeiling({
  width,
  length,
  zMid,
  height,
  rise = 1.5,
}: {
  width: number;
  length: number;
  zMid: number;
  height: number;
  rise?: number;
}) {
  const geometry = useMemo(() => createVaultGeometry(width, length, zMid, height, rise), [width, length, zMid, height, rise]);
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
    [],
  );

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  return <mesh geometry={geometry} material={material} />;
}
