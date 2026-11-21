"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

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

float starLayer(vec2 uv, vec2 density, float seedOffset, float speed) {
  vec2 grid = uv * density;
  vec2 cell = floor(grid);
  vec2 local = fract(grid) - 0.5;
  float seed = hash(cell + seedOffset);
  vec2 offset = vec2(hash(cell + seedOffset + 11.7), hash(cell + seedOffset + 37.2)) - 0.5;
  float radius = mix(0.018, 0.095, pow(seed, 3.0));
  float distanceToStar = length(local - offset * 0.72);
  float point = 1.0 - smoothstep(radius * 0.25, radius, distanceToStar);
  float halo = 1.0 - smoothstep(radius, radius * 3.8, distanceToStar);
  float twinkle = 0.48 + 0.52 * sin(uTime * (0.7 + seed * speed) + seed * 31.0);
  float visible = step(0.84, seed);
  return (point + halo * 0.16) * twinkle * visible;
}

void main() {
  vec2 uv = vUv;
  float vertical = smoothstep(0.0, 1.0, uv.y);
  vec3 sky = mix(vec3(0.018, 0.035, 0.075), vec3(0.055, 0.075, 0.14), vertical);

  float nebulaA = exp(-length((uv - vec2(0.28, 0.32)) * vec2(1.3, 2.1)) * 5.0);
  float nebulaB = exp(-length((uv - vec2(0.78, 0.72)) * vec2(1.1, 1.8)) * 5.5);
  sky += vec3(0.10, 0.12, 0.25) * nebulaA * 0.32;
  sky += vec3(0.12, 0.055, 0.17) * nebulaB * 0.25;

  float stars = starLayer(uv, vec2(76.0, 430.0), 0.0, 2.5);
  stars += starLayer(uv, vec2(34.0, 210.0), 83.0, 1.8) * 0.75;
  stars += starLayer(uv, vec2(115.0, 610.0), 171.0, 3.2) * 0.45;

  // Occasional soft meteor-like glints, extremely subtle and slow.
  float drift = fract(uv.y * 0.42 + uTime * 0.012);
  float streak = exp(-abs(uv.x - (0.24 + 0.08 * sin(uTime * 0.08 + uv.y * 4.0))) * 210.0)
    * exp(-abs(drift - 0.62) * 85.0) * 0.08;

  vec3 starColor = mix(vec3(0.65, 0.78, 1.0), vec3(1.0, 0.82, 0.61), hash(floor(uv * vec2(120.0, 600.0))));
  sky += starColor * stars * 1.65;
  sky += vec3(0.54, 0.72, 1.0) * streak;

  gl_FragColor = vec4(sky, 1.0);
}
`;

export function StarryCeiling({
  width,
  length,
  zMid,
  height,
}: {
  width: number;
  length: number;
  zMid: number;
  height: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  );

  useFrame((_, dt) => {
    material.uniforms.uTime.value += dt;
  });

  return (
    <mesh
      rotation-x={Math.PI / 2}
      position={[0, height, zMid]}
      material={material}
    >
      <planeGeometry args={[width, length]} />
    </mesh>
  );
}
