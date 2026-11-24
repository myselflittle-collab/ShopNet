import * as THREE from "three";
import { blocked, occluderSegments, type Segment } from "@/lib/config/architecture";
import { pointAt } from "@/lib/config/path";
import { SECTIONS, lcdLocal, type PlacedSection } from "@/lib/config/sections";
import { FRAME_HEIGHT, FRAME_WIDTH } from "@/mall/video/campaignOverlay";
import { walker } from "@/mall/navigation/walker";

/**
 * The only hotspot of a boutique is its campaign screen (LCD). Each screen is a rectangle on the
 * store's back wall; a ray counts only when it lands inside that rectangle and no wall stands between.
 */
export interface LcdFrame {
  s: PlacedSection;
  /** screen centre → world */
  matrix: THREE.Matrix4;
  inv: THREE.Matrix4;
  /** world yaw of the screen's facing direction */
  yaw: number;
  centre: THREE.Vector3;
}

export const LCD_FRAMES: Record<string, LcdFrame> = Object.fromEntries(
  SECTIONS.map((s) => {
    const back = { l: s.backLeft, r: s.backRight };
    const backAngle = -Math.atan2(back.r.z - back.l.z, back.r.x - back.l.x);
    const l = lcdLocal(s);
    const store = new THREE.Matrix4().compose(
      new THREE.Vector3(s.origin.x, 0, s.origin.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.rotationY),
      new THREE.Vector3(1, 1, 1),
    );
    const screen = new THREE.Matrix4().compose(
      new THREE.Vector3(l.x, l.y, l.z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), backAngle),
      new THREE.Vector3(1, 1, 1),
    );
    const matrix = store.multiply(screen);
    const centre = new THREE.Vector3().setFromMatrixPosition(matrix);
    return [s.id, { s, matrix, inv: matrix.clone().invert(), yaw: s.rotationY + backAngle, centre }];
  }),
);

const ray = new THREE.Raycaster();
const local = new THREE.Ray();
const hit = new THREE.Vector3();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const MAX_DISTANCE = 16;
const PAD = 0.04;
let segs: Segment[] | null = null;

/** The boutique whose screen is under a screen point (NDC), or null. */
export function pickStore(camera: THREE.Camera, ndc: THREE.Vector2): PlacedSection | null {
  ray.setFromCamera(ndc, camera);
  const p = pointAt(walker.s);
  let best: PlacedSection | null = null;
  let bestD = Infinity;
  for (const f of Object.values(LCD_FRAMES)) {
    if (Math.hypot(f.centre.x - p.x, f.centre.z - p.z) > MAX_DISTANCE + 2) continue;
    local.copy(ray.ray).applyMatrix4(f.inv);
    if (local.direction.z >= 0) continue; // looking at the back of the screen
    if (!local.intersectPlane(plane, hit)) continue;
    if (Math.abs(hit.x) > FRAME_WIDTH / 2 + PAD || Math.abs(hit.y) > FRAME_HEIGHT / 2 + PAD) continue;
    const d = hit.distanceTo(local.origin);
    if (d >= bestD || d >= MAX_DISTANCE) continue;
    hit.applyMatrix4(f.matrix);
    segs ??= occluderSegments();
    if (blocked(ray.ray.origin.x, ray.ray.origin.z, hit.x, hit.z, segs)) continue;
    bestD = d;
    best = f.s;
  }
  return best;
}
