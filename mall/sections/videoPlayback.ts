import * as THREE from "three";

export type VideoPlaybackState = "DORMANT" | "READY" | "PLAYING";

interface ScreenEntry {
  id: string;
  pathS: number;
  object: THREE.Object3D;
  state: VideoPlaybackState;
  setState: (state: VideoPlaybackState) => void;
}

const screens = new Map<string, ScreenEntry>();
const visibilityRay = new THREE.Raycaster();
let featuredId: string | null = null;
let challengerId: string | null = null;
let challengerSince = 0;
let featuredLostSince = 0;

export function registerVideoScreen(
  id: string,
  pathS: number,
  object: THREE.Object3D,
  setState: (state: VideoPlaybackState) => void,
) {
  screens.set(id, { id, pathS, object, state: "DORMANT", setState });
  return () => {
    const current = screens.get(id);
    current?.setState("DORMANT");
    screens.delete(id);
    if (featuredId === id) featuredId = null;
  };
}

function setScreenState(entry: ScreenEntry, next: VideoPlaybackState) {
  if (entry.state === next) return;
  entry.state = next;
  entry.setState(next);
}

export function releaseAllVideos() {
  for (const entry of screens.values()) setScreenState(entry, "DORMANT");
  featuredId = null;
  challengerId = null;
  challengerSince = 0;
  featuredLostSince = 0;
}

function evaluateScreen(
  entry: ScreenEntry,
  camera: THREE.Camera,
  scene: THREE.Scene,
  frustum: THREE.Frustum,
  cameraPosition: THREE.Vector3,
  cameraForward: THREE.Vector3,
) {
  entry.object.updateWorldMatrix(true, false);
  const position = entry.object.getWorldPosition(new THREE.Vector3());
  if (!frustum.containsPoint(position)) return null;

  const toCamera = cameraPosition.clone().sub(position);
  const distance = toCamera.length();
  if (distance < 0.1 || distance > 42) return null;
  toCamera.multiplyScalar(1 / distance);

  // Frustum membership alone is insufficient: a wall or the entrance scrim may block the LCD.
  visibilityRay.set(cameraPosition, toCamera.clone().negate());
  visibilityRay.near = 0.05;
  visibilityRay.far = Math.max(0.1, distance + 0.05);
  const firstHit = visibilityRay.intersectObjects(scene.children, true)[0];
  if (!firstHit) return null;
  let hitOwner: THREE.Object3D | null = firstHit.object;
  while (hitOwner && hitOwner !== entry.object) hitOwner = hitOwner.parent;
  if (hitOwner !== entry.object) return null;

  const normal = new THREE.Vector3(0, 0, 1).transformDirection(entry.object.matrixWorld);
  const facing = normal.dot(toCamera);
  if (facing < 0.35) return null;

  const toScreen = position.clone().sub(cameraPosition).normalize();
  const centrality = Math.max(0, cameraForward.dot(toScreen));
  if (centrality <= 0) return null;

  const projectedWidth = 3.08 / Math.max(0.1, distance * 2 * Math.tan(THREE.MathUtils.degToRad(
    (camera as THREE.PerspectiveCamera).isPerspectiveCamera
      ? (camera as THREE.PerspectiveCamera).fov / 2
      : 31,
  )));
  const projectedArea = Math.min(1, projectedWidth / 0.36);
  const visibleScore = projectedArea * Math.pow(Math.max(0, facing), 0.5) * Math.pow(centrality, 1.4);
  return { entry, score: visibleScore, distance };
}

/** Runs at 10 Hz: visibility and resource decisions are intentionally outside the render loop. */
export function updateVideoPlayback(
  camera: THREE.Camera,
  scene: THREE.Scene,
  pathS: number,
  walking: boolean,
  pageVisible: boolean,
  mobile: boolean,
  pathVelocity: number,
) {
  if (!walking || !pageVisible) {
    releaseAllVideos();
    return;
  }

  camera.updateMatrixWorld();
  const frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  );
  const cameraPosition = camera.getWorldPosition(new THREE.Vector3());
  const cameraForward = camera.getWorldDirection(new THREE.Vector3());

  const candidates = [...screens.values()]
    .map((entry) => evaluateScreen(entry, camera, scene, frustum, cameraPosition, cameraForward))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.score - a.score);

  const now = performance.now();
  const best = candidates[0] ?? null;
  const current = featuredId ? candidates.find((item) => item.entry.id === featuredId) : null;

  if (!best) {
    if (featuredId && !featuredLostSince) featuredLostSince = now;
    if (!featuredId || now - featuredLostSince >= 600) featuredId = null;
  } else if (!current || best.entry.id === featuredId) {
    featuredId = best.entry.id;
    featuredLostSince = 0;
    challengerId = null;
  } else if (best.score > current.score * 1.25) {
    if (challengerId !== best.entry.id) {
      challengerId = best.entry.id;
      challengerSince = now;
    } else if (now - challengerSince >= 150) {
      featuredId = best.entry.id;
      challengerId = null;
      featuredLostSince = 0;
    }
  } else {
    challengerId = null;
  }

  if (!featuredId && best) featuredId = best.entry.id;

  const featured = featuredId ? screens.get(featuredId) : undefined;
  const readyLimit = mobile ? 1 : 2;
  const ready = new Set<string>();

  // First prepare any other genuinely visible LCD that the customer is looking toward.
  for (const item of candidates) {
    if (ready.size >= readyLimit) break;
    if (item.entry.id !== featuredId) ready.add(item.entry.id);
  }

  // Then prepare the next store in the direction of travel. If stationary, use nearest path distance.
  const remaining = [...screens.values()].filter((entry) => entry.id !== featuredId && !ready.has(entry.id));
  const next = remaining.sort((a, b) => {
    const deltaA = a.pathS - pathS;
    const deltaB = b.pathS - pathS;
    if (Math.abs(pathVelocity) < 0.05) return Math.abs(deltaA) - Math.abs(deltaB);
    const forwardA = deltaA * Math.sign(pathVelocity);
    const forwardB = deltaB * Math.sign(pathVelocity);
    const aAhead = forwardA >= 0;
    const bAhead = forwardB >= 0;
    if (aAhead !== bAhead) return aAhead ? -1 : 1;
    return Math.abs(forwardA) - Math.abs(forwardB);
  })[0];
  if (next && ready.size < readyLimit) ready.add(next.id);

  for (const entry of screens.values()) {
    setScreenState(entry, entry.id === featuredId ? "PLAYING" : ready.has(entry.id) ? "READY" : "DORMANT");
  }
}

export function getVideoPlaybackSnapshot() {
  return [...screens.values()].map(({ id, pathS, state }) => ({ id, pathS, state }));
}
