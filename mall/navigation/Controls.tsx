"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MALL } from "@/lib/config/mall";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { addLook, addWheel, stepWalker, TUNING, walker } from "./walker";
import { selectTarget } from "@/mall/interaction/HoverController";

const TAP_PX = 10;
const TAP_MS = 300;

/**
 * Input.
 * Desktop: the mouse is captured (pointer lock) so moving it turns your head — left/right a full 360°,
 * up/down within limits — with no button held. The target is whatever sits under the centre reticle;
 * a click opens it. Esc releases the mouse. If the browser refuses pointer lock, moving the cursor
 * toward a screen edge steers the view instead.
 * Touch: one finger pans the view, two fingers swiped up/down walk; the walk pad also works.
 * Scroll always walks. Keys W A S D / arrows walk and turn.
 */
export function Controls() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    const store = useMallStore.getState;
    const walking = () => store().mode === "walking";

    if (process.env.NODE_ENV !== "production") {
      // dev-only hooks for automated browser tests
      (window as unknown as { __shopnet?: object }).__shopnet = {
        walker,
        look: (dx: number, dy: number) => walking() && addLook(dx, dy),
        select: () => selectTarget("mouse"),
        setLookMode: (m: "idle" | "locked" | "steer") => store().setLookMode(m),
      };
    }

    // ---------- pointer lock ----------
    const lock = () => {
      if (document.pointerLockElement === el) return;
      try {
        const req = el.requestPointerLock({ unadjustedMovement: true }) as unknown as Promise<void> | undefined;
        req?.catch?.(() => {
          const again = el.requestPointerLock() as unknown as Promise<void> | undefined;
          again?.catch?.(() => store().setLookMode("steer"));
        });
      } catch {
        store().setLookMode("steer");
      }
    };
    lookBridge.lock = lock;

    const onLockChange = () => {
      if (document.pointerLockElement === el) store().setLookMode("locked");
      else if (store().lookMode === "locked") store().setLookMode("idle");
    };
    const onLockError = () => store().setLookMode("steer");

    const onMouseMove = (e: MouseEvent) => {
      if (!walking()) return;
      const mode = store().lookMode;
      if (mode === "locked") {
        // ignore the occasional giant jump some browsers report when lock starts
        if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
        addLook(e.movementX, e.movementY);
      } else if (mode === "steer") {
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        const dz = (v: number) => (Math.abs(v) < 0.18 ? 0 : (Math.sign(v) * (Math.abs(v) - 0.18)) / 0.82);
        walker.steerX = dz(nx);
        walker.steerY = dz(ny);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || !walking()) return;
      const mode = store().lookMode;
      if (mode === "idle") {
        lock(); // first click only captures the mouse; it never opens a section
        return;
      }
      selectTarget("mouse");
    };

    const onMouseLeave = () => {
      walker.steerX = 0;
      walker.steerY = 0;
    };

    // ---------- touch ----------
    const touches = new Map<number, { x: number; y: number; sx: number; sy: number; t: number }>();
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (store().lookMode !== "touch") store().setLookMode("touch");
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* pointer already gone; capture is only a convenience */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const t = touches.get(e.pointerId);
      if (!t) return;
      const dx = e.clientX - t.x;
      const dy = e.clientY - t.y;
      t.x = e.clientX;
      t.y = e.clientY;
      if (!walking()) return;
      if (touches.size === 1) {
        // the scene follows the finger
        addLook(-dx, -dy, TUNING.touchSensitivity);
      } else if (touches.size === 2) {
        // two fingers swiped up walk forward, down walk back
        const pts = [...touches.values()];
        const avgDy = pts.reduce((s, p) => s + (p.y - p.sy), 0) / pts.length;
        walker.pad = Math.max(-1, Math.min(1, -avgDy / 120));
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const t = touches.get(e.pointerId);
      touches.delete(e.pointerId);
      if (touches.size < 2) walker.pad = 0;
      if (!t || e.pointerType === "mouse") return;
      const moved = Math.hypot(e.clientX - t.sx, e.clientY - t.sy);
      if (moved < TAP_PX && performance.now() - t.t < TAP_MS) {
        const r = el.getBoundingClientRect();
        selectTarget("touch", { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
      }
    };

    // ---------- wheel + keys ----------
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!walking()) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      // Keep trackpad micro-scrolls responsive while preserving capped mouse-wheel bursts.
      addWheel(Math.max(-180, Math.min(180, dy)));
    };
    const typing = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
    const KEYS = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (!walking() || typing(e.target) || !KEYS.includes(e.code)) return;
      e.preventDefault();
      walker.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => walker.keys.delete(e.code);
    const onBlur = () => {
      walker.keys.clear();
      walker.steerX = walker.steerY = 0;
    };

    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    document.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      lookBridge.lock = () => {};
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [gl]);

  useFrame((_, dt) => {
    if (useMallStore.getState().mode !== "walking") {
      walker.steerX = 0;
      walker.steerY = 0;
    }
    stepWalker(dt);
    camera.position.set(walker.x, MALL.eyeHeight, walker.z);
    camera.rotation.set(walker.pitch, walker.yaw, 0, "YXZ");
  }, -1);

  return null;
}
