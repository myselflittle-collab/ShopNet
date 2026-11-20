"use client";

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { PlacedSection } from "@/lib/config/sections";
import { HALF_W } from "@/lib/config/mall";

const FASHION_PHOTOS: Record<string, { image: string; alt: string }> = {
  "women-blazers": { image: "photo-1559127452-829071a09516", alt: "Women's blazer campaign" },
  "women-trousers": { image: "photo-1565325058701-b1cb0be324f3", alt: "Women's tailored trousers fashion photograph" },
  "women-tshirts": { image: "photo-1616006897093-5e4635c0de35", alt: "Woman in a white crew-neck T-shirt" },
  "women-shirts": { image: "photo-1616006897093-5e4635c0de35", alt: "Women's casual shirt styling" },
  "women-dresses": { image: "photo-1610047402714-307d99a677db", alt: "Woman in a floral dress" },
  "women-jeans": { image: "photo-1565325058701-b1cb0be324f3", alt: "Denim and trouser fashion photograph" },
  "women-ethnic": { image: "photo-1610189013429-a703f4b245cf", alt: "Woman in a blue and yellow sari" },
  "women-skirts": { image: "photo-1682397125309-56077754235d", alt: "Woman wearing a skirt and boots" },
  "women-jackets": { image: "photo-1576828831022-ca41d3905fb7", alt: "Women's tailored jacket fashion photograph" },
  "women-innerwear": { image: "photo-1616006897093-5e4635c0de35", alt: "Women's cotton apparel campaign" },
  "women-shoes": { image: "photo-1704273944825-b9bcf7f85c59", alt: "Women's high heels displayed in a row" },
  "women-handbags": { image: "photo-1681747685985-a401c271156c", alt: "Pink leather handbag product photograph" },
  "women-accessories": { image: "photo-1589995358068-cf709addda7a", alt: "Fashion accessories styling" },
  "men-blazers": { image: "photo-1543132220-4bf3de6e10ae", alt: "Man wearing a black blazer" },
  "men-trousers": { image: "photo-1538978939284-4ecb3fc4ad5e", alt: "Man in a formal suit" },
  "men-tshirts": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's white shirt fashion photograph" },
  "men-shirts": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Man wearing a white shirt" },
  "men-jeans": { image: "photo-1675442141177-b99b70652416", alt: "Men's denim fashion photograph" },
  "men-kurtas": { image: "photo-1774437790995-9a8513532a25", alt: "Man wearing a pink traditional kurta" },
  "men-jackets": { image: "photo-1675442141177-b99b70652416", alt: "Man wearing a denim jacket" },
  "men-innerwear": { image: "photo-1542368826-9a7df1d9fd0b", alt: "Men's everyday apparel campaign" },
  "men-accessories": { image: "photo-1780337092951-7d7fc330db71", alt: "Men's formal accessories flat lay" },
  "men-shoes": { image: "photo-1616663308968-58162d332720", alt: "Brown leather formal shoes" },
  "men-watches": { image: "photo-1780337092951-7d7fc330db71", alt: "Men's watch and formal accessories flat lay" },
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
