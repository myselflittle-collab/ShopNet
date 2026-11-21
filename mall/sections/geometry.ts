import * as THREE from "three";
import { BAY_FRONT_X, HALF_W, MALL, pathCenterX } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";

/** Hover hit volume for a bay: covers the display area inside the opening. */
export function sectionHitBox(s: PlacedSection, expand = 0): THREE.Box3 {
  const front = s.side * (BAY_FRONT_X + 0.3);
  const back = s.side * (HALF_W - 0.15);
  const curveX = pathCenterX(s.cz);
  const minX = curveX + Math.min(front, back);
  const maxX = curveX + Math.max(front, back);
  const pad = 0.15;
  const box = new THREE.Box3(
    new THREE.Vector3(minX, 0, s.z1 + pad),
    new THREE.Vector3(maxX, 3.0, s.z0 - pad),
  );
  if (expand > 0) {
    const size = box.getSize(new THREE.Vector3()).multiplyScalar(expand / 2);
    box.expandByVector(size);
  }
  return box;
}

/** World point the floating preview card is pinned to (top of the bay opening). */
export function sectionAnchor(s: PlacedSection): THREE.Vector3 {
  return new THREE.Vector3(pathCenterX(s.cz) + s.side * (BAY_FRONT_X + 0.4), 2.35, s.cz);
}

export const BAY_INNER = {
  frontX: (s: PlacedSection) => s.side * BAY_FRONT_X,
  backX: (s: PlacedSection) => s.side * HALF_W,
  centreX: (s: PlacedSection) => s.side * (BAY_FRONT_X + MALL.bayDepth / 2),
};
