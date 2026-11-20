"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type ShopNetModel =
  | "jacket"
  | "hoodie"
  | "t-shirt"
  | "sports-jersey"
  | "sneaker"
  | "high-heels"
  | "hiking-boots"
  | "shoe"
  | "handbag"
  | "duffel-bag"
  | "fedora"
  | "glasses"
  | "pocket-watch";

class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.warn("ShopNet 3D asset failed to load:", error.message);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function LoadedModel({
  asset,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  asset: ShopNetModel;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const { scene } = useGLTF(`/api/assets/${asset}`);
  const instance = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={instance}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

/** Loads a licensed GLB without blocking the rest of the mall scene. */
export function AssetModel(props: {
  asset: ShopNetModel;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  return (
    <ModelErrorBoundary>
      <Suspense fallback={null}>
        <LoadedModel {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
