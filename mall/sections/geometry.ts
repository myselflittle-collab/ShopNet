import * as THREE from "three";
import { MALL, STORE_BACK_OFFSET, STORE_FRONT_OFFSET } from "@/lib/config/mall";
import type { PlacedSection } from "@/lib/config/sections";
import { pathFrameAt, pathOffsetAt, pathSamples } from "@/mall/navigation/path";

export type RibbonUvMode = "world" | "normalized";

export function makePathRibbonGeometry(
  s0: number,
  s1: number,
  lateralMin: number,
  lateralMax: number,
  y: number,
  sampleStep = 0.25,
  uvMode: RibbonUvMode = "world",
) {
  const samples = pathSamples(s0, s1, sampleStep);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const pathSpan = Math.max(1e-6, s1 - s0);
  for (const sample of samples) {
    const a = pathOffsetAt(sample.s, lateralMin);
    const b = pathOffsetAt(sample.s, lateralMax);
    positions.push(a.x, y, a.z, b.x, y, b.z);
    if (uvMode === "normalized") {
      const v = (sample.s - s0) / pathSpan;
      uvs.push(0, v, 1, v);
    } else {
      uvs.push(lateralMin * 0.25, sample.s * 0.25, lateralMax * 0.25, sample.s * 0.25);
    }
  }
  for (let i = 0; i < samples.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

export function makePathWallGeometry(
  s0: number,
  s1: number,
  lateral: number,
  bottom = 0,
  top = MALL.ceiling,
  sampleStep = 0.25,
) {
  const samples = pathSamples(s0, s1, sampleStep);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (const sample of samples) {
    const p = pathOffsetAt(sample.s, lateral);
    const along = (sample.s - s0) * 0.25;
    positions.push(p.x, bottom, p.z, p.x, top, p.z);
    uvs.push(along, bottom * 0.25, along, top * 0.25);
  }
  for (let i = 0; i < samples.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Axis-aligned hit box around one angled bay. Used only for hover/raycast selection. */
export function sectionHitBox(section: PlacedSection, expand = 0): THREE.Box3 {
  const box = new THREE.Box3();
  const near = section.side * STORE_FRONT_OFFSET;
  const far = section.side * STORE_BACK_OFFSET;
  for (const s of [section.s0, section.sCenter, section.s1]) {
    for (const lateral of [near, far]) {
      const p = pathOffsetAt(s, lateral);
      box.expandByPoint(new THREE.Vector3(p.x, 0, p.z));
      box.expandByPoint(new THREE.Vector3(p.x, MALL.ceiling, p.z));
    }
  }
  if (expand > 0) box.expandByScalar(expand);
  return box;
}

export function sectionAnchor(section: PlacedSection): THREE.Vector3 {
  const p = pathOffsetAt(section.sCenter, section.side * (STORE_FRONT_OFFSET - 0.18));
  return new THREE.Vector3(p.x, 2.55, p.z);
}

export function sectionScreenPosition(section: PlacedSection): THREE.Vector3 {
  const p = pathOffsetAt(section.sCenter, section.side * (STORE_BACK_OFFSET - 0.21));
  return new THREE.Vector3(p.x, 2.04, p.z);
}

export function pathTransform(distance: number) {
  const frame = pathFrameAt(distance);
  return {
    position: [frame.x, 0, frame.z] as [number, number, number],
    yaw: frame.yaw,
  };
}
