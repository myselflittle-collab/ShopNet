export type MallQuality = "low" | "balanced" | "high";

export function detectMallQuality(): MallQuality {
  if (typeof window === "undefined" || typeof navigator === "undefined") return "balanced";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const narrowScreen = Math.min(window.innerWidth, window.innerHeight) < 720;
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 6;

  // Phones and entry-level devices use a conservative preset by default.
  if (coarsePointer || narrowScreen || memory <= 4 || cores <= 4) return "low";
  if (memory >= 16 && cores >= 12) return "high";
  return "balanced";
}

export const QUALITY_LIMITS: Record<MallQuality, {
  dpr: number;
  fps: number;
  maxVideoPlayers: number;
  videoDistance: number;
  ceilingSegments: number;
  pathLights: number;
}> = {
  low: {
    dpr: 0.72,
    fps: 30,
    maxVideoPlayers: 0,
    videoDistance: 0,
    ceilingSegments: 20,
    pathLights: 26,
  },
  balanced: {
    dpr: 0.92,
    fps: 40,
    maxVideoPlayers: 1,
    videoDistance: 9,
    ceilingSegments: 32,
    pathLights: 38,
  },
  high: {
    dpr: 1.1,
    fps: 60,
    maxVideoPlayers: 2,
    videoDistance: 12,
    ceilingSegments: 48,
    pathLights: 54,
  },
};
