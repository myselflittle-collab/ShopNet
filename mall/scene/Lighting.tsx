"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * Warm retail light without per-store lamps: sky/ground fill, two soft key lights and a small
 * pre-filtered room reflection for the brass, lacquer and polished stone. The reflection map is
 * generated once (256 px) and shared by every material.
 */
export function Lighting() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <hemisphereLight args={["#fff4e2", "#7a6c5c", 0.95]} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[20, 30, 10]} color="#fff0d6" intensity={0.85} />
      <directionalLight position={[-15, 12, -40]} color="#e8eefc" intensity={0.3} />
      <fog attach="fog" args={["#e2dbcf", 24, 62]} />
      <color attach="background" args={["#e2dbcf"]} />
    </>
  );
}
