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
const DOUBLE_TAP_MS = 360;
const CLICK_SELECT_DELAY_MS = 520;

/**
 * Desktop: double-click toggles pointer-look on/off. A single click still selects a store.
 * While pointer-look is active the mouse turns the customer's head; a second double-click
 * releases the cursor, without requiring Escape.
 * Mobile: double-tap toggles one-finger head-look; two-finger vertical swipe walks.
 * The body always walks down the centreline; head direction never steers the walking path.
 */
export function Controls() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    const store = useMallStore.getState;
    const walking = () => store().mode === "walking";
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    let touchTimer: ReturnType<typeof setTimeout> | null = null;
    let lastTouchTap = 0;
    let lastTouchPoint: { x: number; y: number; w: number; h: number } | null = null;

    const clearClickTimer = () => {
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = null;
    };
    const clearTouchTimer = () => {
      if (touchTimer) clearTimeout(touchTimer);
      touchTimer = null;
    };

    const requestLookMode = () => {
      if (document.pointerLockElement === el) return;
      try {
        // Called synchronously from a real double-click user gesture.
        const request = el.requestPointerLock();
        if (request && typeof (request as Promise<void>).catch === "function") {
          (request as Promise<void>).catch(() => store().setLookMode("steer"));
        }
      } catch {
        store().setLookMode("steer");
      }
    };
    lookBridge.lock = requestLookMode;

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __shopnet?: object }).__shopnet = {
        walker,
        look: (dx: number, dy: number) => walking() && addLook(dx, dy),
        select: () => selectTarget("mouse"),
        setLookMode: (m: "idle" | "locked" | "steer" | "touch") => store().setLookMode(m),
      };
    }

    const onLockChange = () => {
      if (document.pointerLockElement === el) store().setLookMode("locked");
      else if (store().lookMode === "locked") store().setLookMode("idle");
    };
    const onLockError = () => store().setLookMode("steer");

    const onMouseMove = (e: MouseEvent) => {
      if (!walking()) return;
      const mode = store().lookMode;
      if (mode !== "locked" && mode !== "steer") return;
      if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
      addLook(e.movementX, e.movementY);
    };

    const onClick = (e: MouseEvent) => {
      if (!walking()) return;
      if (e.detail > 1) {
        clearClickTimer();
        return;
      }
      clearClickTimer();
      clickTimer = setTimeout(() => {
        clickTimer = null;
        if (walking()) selectTarget("mouse");
      }, CLICK_SELECT_DELAY_MS);
    };

    const onDoubleClick = (e: MouseEvent) => {
      if (!walking()) return;
      e.preventDefault();
      e.stopPropagation();
      clearClickTimer();

      if (document.pointerLockElement === el) {
        document.exitPointerLock();
        store().setLookMode("idle");
        return;
      }

      if (store().lookMode === "steer") {
        // Pointer lock is unavailable: the double-click still freezes the fallback look mode.
        walker.steerX = 0;
        walker.steerY = 0;
        store().setLookMode("idle");
        return;
      }

      requestLookMode();
    };

    const touches = new Map<number, { x: number; y: number; sx: number; sy: number; t: number }>();
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      touches.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        sx: e.clientX,
        sy: e.clientY,
        t: performance.now(),
      });
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* Pointer capture is only a convenience. */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const touch = touches.get(e.pointerId);
      if (!touch || !walking()) return;
      const dx = e.clientX - touch.x;
      const dy = e.clientY - touch.y;
      touch.x = e.clientX;
      touch.y = e.clientY;

      if (touches.size === 1 && store().lookMode === "touch") {
        addLook(-dx, -dy, TUNING.touchSensitivity);
      } else if (touches.size === 2) {
        const points = [...touches.values()];
        const avgDy = points.reduce((sum, point) => sum + (point.y - point.sy), 0) / points.length;
        walker.pad = Math.max(-1, Math.min(1, -avgDy / 120));
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const touch = touches.get(e.pointerId);
      touches.delete(e.pointerId);
      if (touches.size < 2) walker.pad = 0;
      if (!touch || e.pointerType === "mouse") return;

      const moved = Math.hypot(e.clientX - touch.sx, e.clientY - touch.sy);
      if (moved >= TAP_PX || performance.now() - touch.t > TAP_MS) return;

      const rect = el.getBoundingClientRect();
      const point = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        w: rect.width,
        h: rect.height,
      };
      const now = performance.now();

      if (now - lastTouchTap < DOUBLE_TAP_MS) {
        clearTouchTimer();
        lastTouchTap = 0;
        lastTouchPoint = null;
        walker.pad = 0;
        store().setLookMode(store().lookMode === "touch" ? "idle" : "touch");
        return;
      }

      lastTouchTap = now;
      lastTouchPoint = point;
      clearTouchTimer();
      touchTimer = setTimeout(() => {
        touchTimer = null;
        if (lastTouchPoint && walking()) selectTarget("touch", lastTouchPoint);
        lastTouchTap = 0;
        lastTouchPoint = null;
      }, DOUBLE_TAP_MS);
    };

    const onPointerCancel = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      if (touches.size < 2) walker.pad = 0;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!walking()) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
      addWheel(Math.max(-180, Math.min(180, delta)));
    };

    const isTyping = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName);
    const keys = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (!walking() || isTyping(e.target) || !keys.includes(e.code)) return;
      e.preventDefault();
      walker.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => walker.keys.delete(e.code);
    const onBlur = () => {
      walker.keys.clear();
      walker.steerX = walker.steerY = 0;
      walker.pad = 0;
      clearClickTimer();
      clearTouchTimer();
      if (document.pointerLockElement === el) document.exitPointerLock();
    };

    el.addEventListener("click", onClick);
    el.addEventListener("dblclick", onDoubleClick);
    document.addEventListener("pointerlockchange", onLockChange);
    document.addEventListener("pointerlockerror", onLockError);
    document.addEventListener("mousemove", onMouseMove);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      lookBridge.lock = () => {};
      clearClickTimer();
      clearTouchTimer();
      el.removeEventListener("click", onClick);
      el.removeEventListener("dblclick", onDoubleClick);
      document.removeEventListener("pointerlockchange", onLockChange);
      document.removeEventListener("pointerlockerror", onLockError);
      document.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (document.pointerLockElement === el) document.exitPointerLock();
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
