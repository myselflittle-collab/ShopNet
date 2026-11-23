"use client";
import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MALL } from "@/lib/config/mall";
import { makePathRibbonGeometry } from "@/mall/sections/geometry";

const VERTEX = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const FRAGMENT = `uniform float uTime;varying vec2 vUv;
vec3 hsv2rgb(vec3 c){vec4 K=vec4(1.0,2.0/3.0,1.0/3.0,3.0);vec3 p=abs(fract(c.xxx+K.xyz)*6.0-K.www);return c.z*mix(K.xxx,clamp(p-K.xxx,0.0,1.0),c.y);}
void main(){float flow=fract(vUv.y*9.0-uTime*0.62);float pulse=smoothstep(0.0,0.16,flow)*(1.0-smoothstep(0.68,1.0,flow));float edge=smoothstep(0.0,0.16,vUv.x)*(1.0-smoothstep(0.84,1.0,vUv.x));float hue=fract(vUv.y*0.28+uTime*0.035);vec3 color=hsv2rgb(vec3(hue,0.88,0.92));float ambient=0.16+0.18*sin(uTime*1.2+vUv.y*38.0);gl_FragColor=vec4(color*((ambient+pulse*1.35)*edge),0.96);}`;

export function AmbientPathLights() {
  const materials = useMemo(() => Array.from({ length: 4 }, () => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })), []);
  const geometries = useMemo(() => [-0.98, -0.33, 0.33, 0.98].map((offset) =>
    makePathRibbonGeometry(0, MALL.length, offset - 0.026, offset + 0.026, 0.018, 0.25, "normalized")
  ), []);

  useFrame((_, delta) => materials.forEach((material) => { material.uniforms.uTime.value += delta; }));

  return (
    <group>
      {geometries.map((geometry, index) => (
        <mesh key={index} geometry={geometry}>
          <primitive object={materials[index]} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
