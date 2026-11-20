"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W } from "@/lib/config/mall";

const FASHION_PHOTOS: Record<string, { image: string; alt: string }> = {
  "women-blazers": { image: "photo-1559127452-829071a09516", alt: "Women's blazer fashion campaign" },
  "women-trousers": { image: "photo-1565325058701-b1cb0be324f3", alt: "Women's blue trousers fashion photograph" },
  "women-tshirts": { image: "photo-1559127452-829071a09516", alt: "Women's casual fashion campaign" },
  "women-shirts": { image: "photo-1559127452-829071a09516", alt: "Women's smart casual fashion campaign" },
  "women-dresses": { image: "photo-1610047402714-307d99a677db", alt: "Woman wearing a floral dress" },
  "women-jeans": { image: "photo-1565325058701-b1cb0be324f3", alt: "Women's denim fashion photograph" },
  "women-ethnic": { image: "photo-1610189013429-a703f4b245cf", alt: "Woman wearing a blue and yellow sari" },
  "women-skirts": { image: "photo-1610047402714-307d99a677db", alt: "Women's dress and skirt fashion campaign" },
  "women-jackets": { image: "photo-1559127452-829071a09516", alt: "Women's outerwear fashion campaign" },
  "women-innerwear": { image: "photo-1559127452-829071a09516", alt: "Women's apparel campaign" },
  "women-shoes": { image: "photo-1728724794795-681832a6afd0", alt: "White and grey sneakers" },
  "women-handbags": { image: "photo-1681747685985-a401c271156c", alt: "Pink leather handbag" },
  "women-accessories": { image: "photo-1681747685985-a401c271156c", alt: "Fashion accessories campaign" },
  "men-blazers": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's formal shirt and fashion styling" },
  "men-trousers": { image: "photo-1565325058701-b1cb0be324f3", alt: "Tailored trousers fashion photograph" },
  "men-tshirts": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's casual shirt fashion photograph" },
  "men-shirts": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Man wearing a white shirt" },
  "men-jeans": { image: "photo-1565325058701-b1cb0be324f3", alt: "Denim fashion photograph" },
  "men-kurtas": { image: "photo-1610189013429-a703f4b245cf", alt: "Traditional Indian fashion photograph" },
  "men-jackets": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's jacket fashion photograph" },
  "men-innerwear": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's casual apparel photograph" },
  "men-accessories": { image: "photo-1681747685985-a401c271156c", alt: "Fashion accessories photograph" },
  "men-shoes": { image: "photo-1616663308968-58162d332720", alt: "Brown leather dress shoes" },
  "men-watches": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's fashion styling with accessories" },
};

class PhotoErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn("ShopNet campaign image failed to load:", error.message);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function LoadedPhotoPanel({ section }: { section: PlacedSection }) {
  const entry = FASHION_PHOTOS[section.id];
  const texture = useTexture(
    `https://images.unsplash.com/${entry.image}?auto=format&fit=crop&w=900&h=1100&q=82`,
  );
  const material = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
  }, [texture]);
  const x = section.side * (HALF_W - 0.11);
  const rotationY = section.side === -1 ? Math.PI / 2 : -Math.PI / 2;

  return (
    <group position={[x, 2.0, section.cz]} rotation-y={rotationY}>
      <mesh position={[0, 0, -0.035]}>
        <boxGeometry args={[1.38, 1.82, 0.07]} />
        <meshStandardMaterial color="#b79a69" metalness={0.58} roughness={0.34} />
      </mesh>
      <mesh position={[0, 0, 0.006]}>
        <planeGeometry args={[1.27, 1.69]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  );
}

/** A real fashion photograph mounted as a framed campaign panel inside each storefront. */
export function SectionPhotoPanel({ section }: { section: PlacedSection }) {
  if (!FASHION_PHOTOS[section.id]) return null;
  return (
    <PhotoErrorBoundary>
      <Suspense fallback={null}>
        <LoadedPhotoPanel section={section} />
      </Suspense>
    </PhotoErrorBoundary>
  );
}
