"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SECTION_BY_ID, viewingPose } from "@/lib/config/sections";
import { setPose } from "@/mall/navigation/walker";
import { useMallStore } from "@/lib/bridge/mallStore";

const TEST_DURATION_MS = 5 * 60 * 1000;

interface RendererSample {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

interface BenchmarkReport {
  schemaVersion: 1;
  test: {
    startedAt: string;
    finishedAt: string;
    durationSeconds: number;
    routeLapsCompleted: number;
    deviceLabel: string;
    notes: string;
  };
  device: {
    userAgent: string;
    platform: string;
    viewport: string;
    devicePixelRatio: number;
    hardwareConcurrency: number | null;
    deviceMemoryGiB: number | null;
    connection: string | null;
    downlinkMbps: number | null;
  };
  rendering: {
    averageFps: number | null;
    p95FrameMs: number | null;
    p99FrameMs: number | null;
    onePercentLowFps: number | null;
    maxFrameMs: number | null;
    framesOver16Point7Ms: number;
    framesOver33Point3Ms: number;
    framesOver50Ms: number;
    sampleCount: number;
    averageDrawCalls: number | null;
    peakDrawCalls: number | null;
    averageTriangles: number | null;
    peakTriangles: number | null;
    geometryCountLast: number | null;
    textureCountLast: number | null;
  };
  media: {
    mp4ResourceCount: number;
    mp4TransferBytes: number;
    mp4EncodedBytes: number;
    peakPlayingMediaElements: number;
    playingMediaElementsAtEnd: number;
  };
  memory: {
    usedJsHeapMiBAtEnd: number | null;
    peakJsHeapMiB: number | null;
  };
  longTasks: {
    count: number;
    totalDurationMs: number;
    peakDurationMs: number | null;
  };
  shopInteractions: {
    opens: number;
    closes: number;
  };
}

const REFERENCE_VIEWS = [
  {
    id: "01",
    label: "Entrance — forward",
    filename: "baseline-01-entrance-forward.png",
    pose: { x: 0, z: 3.5, yaw: 0, pitch: 0 },
  },
  {
    id: "02",
    label: "Women's Blazers",
    filename: "baseline-02-womens-blazers.png",
    pose: viewingPose(SECTION_BY_ID["women-blazers"]),
  },
  {
    id: "03",
    label: "Women's Accessories",
    filename: "baseline-03-womens-accessories.png",
    pose: viewingPose(SECTION_BY_ID["women-accessories"]),
  },
  {
    id: "04",
    label: "Middle corridor",
    filename: "baseline-04-middle-corridor.png",
    pose: { x: 0, z: -26, yaw: 0, pitch: 0 },
  },
  {
    id: "05",
    label: "Men's Blazers",
    filename: "baseline-05-mens-blazers.png",
    pose: viewingPose(SECTION_BY_ID["men-blazers"]),
  },
  {
    id: "06",
    label: "Men's Jeans",
    filename: "baseline-06-mens-jeans.png",
    pose: viewingPose(SECTION_BY_ID["men-jeans"]),
  },
  {
    id: "07",
    label: "Men's Watches",
    filename: "baseline-07-mens-watches.png",
    pose: viewingPose(SECTION_BY_ID["men-watches"]),
  },
  {
    id: "08",
    label: "Far end — looking back",
    filename: "baseline-08-far-end-return.png",
    pose: { x: 0, z: -53.5, yaw: Math.PI, pitch: 0 },
  },
];

type ExtendedNavigator = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    downlink?: number;
    saveData?: boolean;
  };
};

type ExtendedPerformance = Performance & {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return sorted[index];
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function bytesLabel(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, exponent)).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function timeLabel(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function numberLabel(value: number | null, digits = 1): string {
  return value === null || !Number.isFinite(value) ? "—" : value.toFixed(digits);
}

function makeReport(args: {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  deviceLabel: string;
  notes: string;
  frameTimes: number[];
  rendererSamples: RendererSample[];
  mp4Entries: PerformanceResourceTiming[];
  peakPlayingMediaElements: number;
  playingMediaElementsAtEnd: number;
  peakHeapBytes: number | null;
  endHeapBytes: number | null;
  longTaskDurations: number[];
  shopOpens: number;
  shopCloses: number;
  routeLapsCompleted: number;
}): BenchmarkReport {
  const frames = args.frameTimes;
  const frameMean = mean(frames);
  const p95 = percentile(frames, 0.95);
  const p99 = percentile(frames, 0.99);
  const rendererCalls = args.rendererSamples.map((sample) => sample.drawCalls);
  const rendererTriangles = args.rendererSamples.map((sample) => sample.triangles);
  const lastRenderer = args.rendererSamples.at(-1);
  const transferBytes = args.mp4Entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
  const encodedBytes = args.mp4Entries.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0);
  const longTaskTotal = args.longTaskDurations.reduce((sum, duration) => sum + duration, 0);
  const extendedNavigator = navigator as ExtendedNavigator;
  const extendedPerformance = performance as ExtendedPerformance;
  const connection = extendedNavigator.connection;

  return {
    schemaVersion: 1,
    test: {
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      durationSeconds: Math.round(args.durationMs / 1000),
      routeLapsCompleted: args.routeLapsCompleted,
      deviceLabel: args.deviceLabel,
      notes: args.notes,
    },
    device: {
      userAgent: navigator.userAgent,
      platform: navigator.platform || "unknown",
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || null,
      deviceMemoryGiB: extendedNavigator.deviceMemory ?? null,
      connection: connection?.effectiveType ?? null,
      downlinkMbps: connection?.downlink ?? null,
    },
    rendering: {
      averageFps: frameMean && frameMean > 0 ? 1000 / frameMean : null,
      p95FrameMs: p95,
      p99FrameMs: p99,
      onePercentLowFps: p99 && p99 > 0 ? 1000 / p99 : null,
      maxFrameMs: frames.length ? Math.max(...frames) : null,
      framesOver16Point7Ms: frames.filter((value) => value > 16.7).length,
      framesOver33Point3Ms: frames.filter((value) => value > 33.3).length,
      framesOver50Ms: frames.filter((value) => value > 50).length,
      sampleCount: frames.length,
      averageDrawCalls: mean(rendererCalls),
      peakDrawCalls: rendererCalls.length ? Math.max(...rendererCalls) : null,
      averageTriangles: mean(rendererTriangles),
      peakTriangles: rendererTriangles.length ? Math.max(...rendererTriangles) : null,
      geometryCountLast: lastRenderer?.geometries ?? null,
      textureCountLast: lastRenderer?.textures ?? null,
    },
    media: {
      mp4ResourceCount: args.mp4Entries.length,
      mp4TransferBytes: transferBytes,
      mp4EncodedBytes: encodedBytes,
      peakPlayingMediaElements: args.peakPlayingMediaElements,
      playingMediaElementsAtEnd: args.playingMediaElementsAtEnd,
    },
    memory: {
      usedJsHeapMiBAtEnd: args.endHeapBytes === null ? null : args.endHeapBytes / (1024 * 1024),
      peakJsHeapMiB: args.peakHeapBytes === null ? null : args.peakHeapBytes / (1024 * 1024),
    },
    longTasks: {
      count: args.longTaskDurations.length,
      totalDurationMs: longTaskTotal,
      peakDurationMs: args.longTaskDurations.length ? Math.max(...args.longTaskDurations) : null,
    },
    shopInteractions: {
      opens: args.shopOpens,
      closes: args.shopCloses,
    },
  };
}


function smoothStep(value: number): number {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function segmentValue(time: number, start: number, end: number, from: number, to: number): number {
  return from + (to - from) * smoothStep((time - start) / (end - start));
}

function baselineRoutePose(lapElapsedMs: number): { x: number; z: number; yaw: number; pitch: number } {
  const seconds = lapElapsedMs / 1000;
  const startZ = 3.5;
  const farZ = -53.5;
  const travelSeconds = 22;
  const returning = seconds >= travelSeconds && seconds < travelSeconds * 2;
  const travelProgress = seconds < travelSeconds
    ? seconds / travelSeconds
    : returning
      ? (seconds - travelSeconds) / travelSeconds
      : 1;
  const z = seconds < travelSeconds
    ? startZ + (farZ - startZ) * travelProgress
    : returning
      ? farZ + (startZ - farZ) * travelProgress
      : startZ;

  let yaw = 0;
  if (seconds >= 2 && seconds < 6) yaw = segmentValue(seconds, 2, 6, 0, Math.PI / 2);
  else if (seconds >= 6 && seconds < 9) yaw = Math.PI / 2;
  else if (seconds >= 9 && seconds < 12) yaw = segmentValue(seconds, 9, 12, Math.PI / 2, 0);
  else if (seconds >= 12 && seconds < 16) yaw = segmentValue(seconds, 12, 16, 0, -Math.PI / 2);
  else if (seconds >= 16 && seconds < 18) yaw = -Math.PI / 2;
  else if (seconds >= 18 && seconds < 22) yaw = segmentValue(seconds, 18, 22, -Math.PI / 2, 0);
  else if (seconds >= 24 && seconds < 28) yaw = segmentValue(seconds, 24, 28, 0, Math.PI / 2);
  else if (seconds >= 28 && seconds < 31) yaw = Math.PI / 2;
  else if (seconds >= 31 && seconds < 34) yaw = segmentValue(seconds, 31, 34, Math.PI / 2, 0);
  else if (seconds >= 34 && seconds < 38) yaw = segmentValue(seconds, 34, 38, 0, -Math.PI / 2);
  else if (seconds >= 38 && seconds < 40) yaw = -Math.PI / 2;
  else if (seconds >= 40 && seconds < 44) yaw = segmentValue(seconds, 40, 44, -Math.PI / 2, 0);

  return { x: 0, z, yaw, pitch: 0 };
}

export function BenchmarkPanel() {
  const router = useRouter();
  const shopVisible = useMallStore((state) => state.shopVisible);
  const mode = useMallStore((state) => state.mode);
  const [deviceLabel, setDeviceLabel] = useState("Desktop / laptop");
  const [notes, setNotes] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [selectedView, setSelectedView] = useState("01");
  const [collapsed, setCollapsed] = useState(false);
  const [mediaCounts, setMediaCounts] = useState({ opens: 0, closes: 0 });
  const shopCountsRef = useRef({ opens: 0, closes: 0 });
  const previousShopVisibleRef = useRef(false);
  const lastRouteLapRef = useRef(-1);
  const routeLapsCompletedRef = useRef(0);
  const openedLapRef = useRef(-1);
  const closedLapRef = useRef(-1);

  useEffect(() => {
    const wasVisible = previousShopVisibleRef.current;
    if (recording) {
      if (shopVisible && !wasVisible) {
        shopCountsRef.current.opens += 1;
        setMediaCounts({ ...shopCountsRef.current });
      } else if (!shopVisible && wasVisible) {
        shopCountsRef.current.closes += 1;
        setMediaCounts({ ...shopCountsRef.current });
      }
    }
    previousShopVisibleRef.current = shopVisible;
  }, [shopVisible, recording]);

  useEffect(() => {
    if (!recording) return;

    const startedAtPerf = performance.now();
    const startedAt = new Date().toISOString();
    const rendererSamples: RendererSample[] = [];
    const longTaskDurations: number[] = [];
    const playingMedia = new Set<HTMLMediaElement>();
    const watchedMedia = new WeakSet<HTMLMediaElement>();
    const mediaPrototype = HTMLMediaElement.prototype;
    const originalPlay = mediaPrototype.play;
    const originalPause = mediaPrototype.pause;
    let peakPlayingMediaElements = 0;
    let lastRendererSampleAt = 0;
    let peakHeapBytes: number | null = null;
    let endHeapBytes: number | null = null;
    let intervalId: number | null = null;
    let lastElapsedUiUpdate = 0;
    let observer: PerformanceObserver | null = null;
    let disposed = false;

    shopCountsRef.current = { opens: 0, closes: 0 };
    routeLapsCompletedRef.current = 0;
    lastRouteLapRef.current = -1;
    openedLapRef.current = -1;
    closedLapRef.current = -1;
    setMediaCounts({ opens: 0, closes: 0 });
    window.__shopnetBenchFrameTimes = [];
    window.__shopnetBenchStats = undefined;
    window.__shopnetBenchRecording = true;

    const addMediaListeners = (media: HTMLMediaElement) => {
      if (watchedMedia.has(media)) return;
      watchedMedia.add(media);
      media.addEventListener("playing", () => playingMedia.add(media));
      media.addEventListener("pause", () => playingMedia.delete(media));
      media.addEventListener("ended", () => playingMedia.delete(media));
    };

    document.querySelectorAll<HTMLMediaElement>("video, audio").forEach((media) => {
      addMediaListeners(media);
      if (!media.paused && !media.ended) playingMedia.add(media);
    });

    const patchedPlay: typeof mediaPrototype.play = function (this: HTMLMediaElement) {
      addMediaListeners(this);
      const promise = originalPlay.call(this);
      return promise.catch((error) => {
        playingMedia.delete(this);
        throw error;
      });
    };
    const patchedPause: typeof mediaPrototype.pause = function (this: HTMLMediaElement) {
      playingMedia.delete(this);
      return originalPause.call(this);
    };

    try {
      mediaPrototype.play = patchedPlay;
      mediaPrototype.pause = patchedPause;
    } catch {
      // Some browsers may disallow temporary prototype instrumentation.
    }

    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTaskDurations.push(entry.duration);
        }
      });
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      observer = null;
    }

    const cleanup = () => {
      if (disposed) return;
      disposed = true;
      window.__shopnetBenchRecording = false;
      if (intervalId !== null) window.clearInterval(intervalId);
      observer?.disconnect();
      if (mediaPrototype.play === patchedPlay) mediaPrototype.play = originalPlay;
      if (mediaPrototype.pause === patchedPause) mediaPrototype.pause = originalPause;
    };

    const finish = () => {
      if (disposed) return;
      const durationMs = performance.now() - startedAtPerf;
      const extendedPerformance = performance as ExtendedPerformance;
      endHeapBytes = extendedPerformance.memory?.usedJSHeapSize ?? null;
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const mp4Entries = resources.filter(
        (entry) => entry.startTime >= startedAtPerf && /\.mp4(?:$|[?#])/i.test(entry.name),
      );
      const finalReport = makeReport({
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs,
        deviceLabel,
        notes,
        frameTimes: (window.__shopnetBenchFrameTimes ?? []).filter((value) => Number.isFinite(value) && value > 0),
        rendererSamples,
        mp4Entries,
        peakPlayingMediaElements,
        playingMediaElementsAtEnd: playingMedia.size,
        peakHeapBytes,
        endHeapBytes,
        longTaskDurations,
        shopOpens: shopCountsRef.current.opens,
        shopCloses: shopCountsRef.current.closes,
        routeLapsCompleted: routeLapsCompletedRef.current,
      });
      cleanup();
      setElapsedMs(durationMs);
      setReport(finalReport);
      setRecording(false);
    };

    const sample = () => {
      if (disposed) return;
      const currentDuration = performance.now() - startedAtPerf;
      const routeLap = Math.floor(currentDuration / 60_000);
      const routeLapElapsed = currentDuration % 60_000;
      const state = useMallStore.getState();

      if (routeLap !== lastRouteLapRef.current) {
        if (lastRouteLapRef.current >= 0) routeLapsCompletedRef.current += 1;
        lastRouteLapRef.current = routeLap;
      }

      // Before the store entry, follow the same 60-second corridor route on every lap.
      if (routeLapElapsed < 44_000 && state.mode === "walking" && !state.shopVisible) {
        setPose(baselineRoutePose(routeLapElapsed));
      }

      // Open Women's Blazers near the entrance once per lap, using the real store transition.
      if (
        routeLapElapsed >= 44_000 &&
        openedLapRef.current !== routeLap &&
        state.mode === "walking" &&
        !state.shopVisible
      ) {
        setPose({ x: 0, z: 3.5, yaw: 0, pitch: 0 });
        state.requestOpen("women-blazers");
        openedLapRef.current = routeLap;
      }

      // Keep the catalogue open for the scripted dwell, then return through the real route handler.
      if (
        routeLapElapsed >= 52_000 &&
        closedLapRef.current !== routeLap &&
        state.mode === "shop"
      ) {
        router.push("/", { scroll: false });
        closedLapRef.current = routeLap;
      }

      peakPlayingMediaElements = Math.max(peakPlayingMediaElements, playingMedia.size);
      const stats = window.__shopnetBenchStats;
      if (stats && stats.sampledAt > lastRendererSampleAt) {
        rendererSamples.push({
          drawCalls: stats.drawCalls,
          triangles: stats.triangles,
          geometries: stats.geometries,
          textures: stats.textures,
        });
        lastRendererSampleAt = stats.sampledAt;
      }
      const extendedPerformance = performance as ExtendedPerformance;
      const usedHeap = extendedPerformance.memory?.usedJSHeapSize;
      if (typeof usedHeap === "number") {
        peakHeapBytes = peakHeapBytes === null ? usedHeap : Math.max(peakHeapBytes, usedHeap);
      }

      if (currentDuration - lastElapsedUiUpdate >= 1000) {
        lastElapsedUiUpdate = currentDuration;
        setElapsedMs(currentDuration);
      }
      if (currentDuration >= TEST_DURATION_MS) finish();
    };

    intervalId = window.setInterval(sample, 16);

    return cleanup;
  }, [recording, deviceLabel, notes, router]);

  const startTest = () => {
    setReport(null);
    setElapsedMs(0);
    shopCountsRef.current = { opens: 0, closes: 0 };
    routeLapsCompletedRef.current = 0;
    lastRouteLapRef.current = -1;
    openedLapRef.current = -1;
    closedLapRef.current = -1;
    setMediaCounts({ opens: 0, closes: 0 });
    setPose({ x: 0, z: 3.5, yaw: 0, pitch: 0 });
    setRecording(true);
  };

  const setReferenceView = (viewId: string) => {
    const view = REFERENCE_VIEWS.find((item) => item.id === viewId);
    if (!view) return;
    setPose(view.pose);
    setSelectedView(view.id);
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const label = deviceLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    anchor.href = url;
    anchor.download = `shopnet-baseline-${label || "device"}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const remainingMs = Math.max(0, TEST_DURATION_MS - elapsedMs);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-3 top-3 z-[120] rounded-full border border-white/20 bg-[#101820]/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur"
      >
        ShopNet benchmark
      </button>
    );
  }

  return (
    <aside className="fixed right-3 top-3 z-[120] w-[min(94vw,430px)] max-h-[94vh] overflow-y-auto rounded-2xl border border-white/15 bg-[#101820]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#d5b77f]">SHOPNET / BASELINE</p>
          <h1 className="mt-1 text-lg font-semibold">Performance benchmark</h1>
          <p className="mt-1 text-[11px] leading-relaxed text-white/65">
            Baseline commit a4f9c70 · original straight corridor · 5-minute device run
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          aria-label="Minimise benchmark panel"
          className="rounded-lg border border-white/15 px-2 py-1 text-sm text-white/80"
        >
          Minimise
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200/20 bg-amber-100/5 p-3 text-[11px] leading-relaxed text-white/80">
        Open this route on the <b>baseline checkpoint branch</b>, dismiss the welcome screen, and complete a normal walk before starting. The benchmark panel stays above the mall so you can operate it while testing.
      </div>

      <section className="mt-4">
        <h2 className="text-xs font-semibold tracking-wide text-white/90">1 · Reference screenshots</h2>
        <p className="mt-1 text-[11px] text-white/60">
          Select each fixed camera position, wait for the frame to settle, then save a screenshot using the filename shown.
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {REFERENCE_VIEWS.map((view) => (
            <button
              key={view.id}
              type="button"
              disabled={recording || shopVisible}
              onClick={() => setReferenceView(view.id)}
              className={`rounded-lg border px-2.5 py-2 text-left text-[11px] disabled:cursor-not-allowed disabled:opacity-40 ${selectedView === view.id ? "border-[#d5b77f] bg-[#d5b77f]/10" : "border-white/15 bg-white/5"}`}
            >
              <span className="block font-semibold">{view.id} · {view.label}</span>
              <span className="mt-1 block truncate text-[9px] text-white/50">{view.filename}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 border-t border-white/10 pt-3">
        <h2 className="text-xs font-semibold tracking-wide text-white/90">2 · Five-minute route test</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-white/70">
          <li>The app automatically repeats the same 60-second entrance-to-far-end-and-back route five times.</li>
          <li>The scripted route turns to view both storefront sides at fixed points.</li>
          <li>Each lap automatically opens Women's Blazers for a fixed dwell, then returns to the mall.</li>
          <li>Do not touch the movement controls while recording. Keep the browser tab visible.</li>
        </ol>

        <label className="mt-3 block text-[10px] font-semibold text-white/70" htmlFor="benchmark-device">
          Device label
        </label>
        <input
          id="benchmark-device"
          value={deviceLabel}
          onChange={(event) => setDeviceLabel(event.target.value)}
          disabled={recording}
          className="mt-1 w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[#d5b77f] disabled:opacity-50"
        />

        <label className="mt-3 block text-[10px] font-semibold text-white/70" htmlFor="benchmark-notes">
          Test conditions (battery saver, low-power mode, browser, etc.)
        </label>
        <textarea
          id="benchmark-notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={recording}
          className="mt-1 w-full resize-y rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-[#d5b77f] disabled:opacity-50"
        />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-white/55">Recording status</p>
            <p className="text-xl font-semibold tabular-nums">{recording ? timeLabel(remainingMs) : "5:00"}</p>
          </div>
          <button
            type="button"
            disabled={recording || !deviceLabel.trim() || mode !== "walking" || shopVisible}
            onClick={startTest}
            className="rounded-xl bg-[#d5b77f] px-4 py-2.5 text-xs font-bold text-[#171a1d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start 5-minute test
          </button>
        </div>
        {recording && (
          <p className="mt-2 text-[10px] text-emerald-200" role="status">
            Recording frame times, WebGL scene counts, MP4 transfers, active media players and shop transitions…
          </p>
        )}
        <p className="mt-2 text-[10px] text-white/45">
          Frame-time sampling uses the browser animation clock. Draw calls and triangle counts come from Three.js renderer statistics. Memory is reported only where the browser exposes it.
        </p>
      </section>

      <section className="mt-4 border-t border-white/10 pt-3">
        <h2 className="text-xs font-semibold tracking-wide text-white/90">3 · Live interaction counts</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 p-2.5">
            <p className="text-[10px] text-white/50">Shop opens</p>
            <p className="text-lg font-semibold tabular-nums">{mediaCounts.opens}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-2.5">
            <p className="text-[10px] text-white/50">Shop closes</p>
            <p className="text-lg font-semibold tabular-nums">{mediaCounts.closes}</p>
          </div>
        </div>
      </section>

      {report && (
        <section className="mt-4 border-t border-white/10 pt-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-white/90">4 · Results</h2>
            <button
              type="button"
              onClick={downloadReport}
              className="rounded-lg border border-[#d5b77f]/50 px-3 py-1.5 text-[10px] font-semibold text-[#f0d7a6]"
            >
              Download JSON
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="Average FPS" value={numberLabel(report.rendering.averageFps)} />
            <Metric label="1% low FPS" value={numberLabel(report.rendering.onePercentLowFps)} />
            <Metric label="p95 frame time" value={report.rendering.p95FrameMs === null ? "—" : `${numberLabel(report.rendering.p95FrameMs)} ms`} />
            <Metric label="p99 frame time" value={report.rendering.p99FrameMs === null ? "—" : `${numberLabel(report.rendering.p99FrameMs)} ms`} />
            <Metric label="Peak draw calls" value={report.rendering.peakDrawCalls?.toString() ?? "—"} />
            <Metric label="Peak triangles" value={report.rendering.peakTriangles?.toLocaleString() ?? "—"} />
            <Metric label="MP4 transfer" value={bytesLabel(report.media.mp4TransferBytes)} />
            <Metric label="Peak playing media" value={report.media.peakPlayingMediaElements.toString()} />
            <Metric label="Frames over 50 ms" value={report.rendering.framesOver50Ms.toString()} />
            <Metric label="Route laps" value={report.test.routeLapsCompleted.toString()} />
            <Metric label="Long tasks" value={report.longTasks.count.toString()} />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-white/55">
            JSON includes device details, p95/p99, 1% low, WebGL counters, MP4 resource sizes, JS heap (when available), long tasks and shop transitions.
          </p>
        </section>
      )}
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-2">
      <p className="text-[9px] text-white/50">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
