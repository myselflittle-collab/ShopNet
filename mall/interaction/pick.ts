import * as THREE from "three";
import { blocked, occluderSegments, type Segment } from "@/lib/config/architecture";
import { pointAt } from "@/lib/config/path";
import { SECTIONS, type PlacedSection } from "@/lib/config/sections";
import { walker } from "@/mall/navigation/walker";

/** Oriented hit volumes for every boutique (portal + interior), built once. */
const volumes = SECTIONS.map((s) => {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(s.origin.x, 0, s.origin.z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rotationY),
    new THREE.Vector3(1, 1, 1),
  );
  const backZ = Math.min(s.backLeft.z, s.backRight.z);
  return {
    s,
    m,
    inv: m.clone().invert(),
    box: new THREE.Box3(new THREE.Vector3(-s.halfFront + 0.1, 0, backZ), new THREE.Vector3(s.halfFront - 0.1, 3.4, 0.25)),
  };
});

const ray = new THREE.Raycaster();
const local = new THREE.Ray();
const hit = new THREE.Vector3();
const MAX_DISTANCE = 16;
let segs: Segment[] | null = null;

/** The boutique under a screen point (NDC), or null for the walkway / walls. */
export function pickStore(camera: THREE.Camera, ndc: THREE.Vector2): PlacedSection | null {
  ray.setFromCamera(ndc, camera);
  const p = pointAt(walker.s);
  let best: PlacedSection | null = null;
  let bestD = Infinity;
  for (const v of volumes) {
    if (Math.hypot(v.s.origin.x - p.x, v.s.origin.z - p.z) > MAX_DISTANCE + 4) continue;
    local.copy(ray.ray).applyMatrix4(v.inv);
    if (!local.intersectBox(v.box, hit)) continue;
    const d = hit.distanceTo(local.origin);
    if (d >= bestD || d >= MAX_DISTANCE) continue;
    // ignore boutiques hidden behind walls
    hit.applyMatrix4(v.m);
    segs ??= occluderSegments();
    if (blocked(ray.ray.origin.x, ray.ray.origin.z, hit.x, hit.z, segs)) continue;
    {
      bestD = d;
      best = v.s;
    }
  }
  return best;
}
