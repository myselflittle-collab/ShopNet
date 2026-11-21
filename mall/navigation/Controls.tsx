"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MALL, pathYawAt } from "@/lib/config/mall";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { addLook, addWheel, stepWalker, TUNING, walker } from "./walker";
import { selectTarget } from "@/mall/interaction/HoverController";

const TAP_PX = 10;
const TAP_MS = 300;
const DOUBLE_TAP_MS = 360;

/**
 * No pointer lock: browser tabs remain accessible at all times.
 * Move the mouse/finger to look around; double-click/double-tap freezes or resumes look.
 * Scroll is body travel along the curved centreline and is independent from head direction.
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

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __shopnet?: object }).__shopnet = {
        walker,
        look: (dx: number, dy: number) => walking() && addLook(dx, dy),
        select: () => selectTarget("mouse"),
        setLookMode: (m: "idle" | "locked" | "steer" | "touch") => store().setLookMode(m),
      };
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!walking() || store().lookMode !== "steer") return;
      // movementX/Y are ordinary cursor deltas; nothing captures or hides the cursor.
      if (Math.abs(e.movementX) > 240 || Math.abs(e.movementY) > 240) return;
      addLook(e.movementX, e.movementY);
    };

    const onClick = (e: MouseEvent) => {
      if (!walking() || e.detail > 1) return;
      if (clickTimer) clearTimeout(clickTimer);
      // Defer single-click selection long enough to distinguish a double-click toggle.
      clickTimer = setTimeout(() => {
        clickTimer = null;
        selectTarget("mouse");
      }, 520);
    };

    const onDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = null;
      const current = store().lookMode;
      store().setLookMode(current === "idle" ? "steer" : "idle");
      walker.steerX = walker.steerY = 0;
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
        /* capture is optional */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const touch = touches.get(e.pointerId);
      if (!touch || !walking()) return;
      const dx = e.clientX - touch.x;
      const dy = e.clientY - touch.y;
      touch.x = e.clientX;
      touch.y = e.clientY;

      if (touches.size === 1) {
        if (store().lookMode !== "idle") {
          store().setLookMode("touch");
          addLook(-dx, -dy, TUNING.touchSensitivity);
        }
      } else if (touches.size === 2) {
        // Two-finger vertical swipe moves the body along the path without lateral drift.
        const points = [...touches.values()];
        const avgDy = points.reduce((sum, point) => sum + (point.y - point.sy), 0) / points.length;
        walker.pad = Math.max(-1, Math.min(1, -avgDy / 110));
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
        if (touchTimer) clearTimeout(touchTimer);
        touchTimer = null;
        lastTouchTap = 0;
        store().setLookMode(store().lookMode === "idle" ? "touch" : "idle");
        return;
      }

      lastTouchTap = now;
      lastTouchPoint = point;
      if (touchTimer) clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        touchTimer = null;
        if (lastTouchPoint) selectTarget("touch", lastTouchPoint);
        lastTouchTap = 0;
        lastTouchPoint = null;
      }, DOUBLE_TAP_MS);
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
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("click", onClick);
    el.addEventListener("dblclick", onDoubleClick);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      if (clickTimer) clearTimeout(clickTimer);
      if (touchTimer) clearTimeout(touchTimer);
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("click", onClick);
      el.removeEventListener("dblclick", onDoubleClick);
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

  useFrame(() => {
    if (useMallStore.getState().mode !== "walking") {
      walker.steerX = 0;
      walker.steerY = 0;
    }
  }, -2);

  useFrame((_, dt) => {
    if (useMallStore.getState().mode !== "walking") {
      walker.steerX = 0;
      walker.steerY = 0;
    }
    stepWalker(dt);
    camera.position.set(walker.x, MALL.eyeHeight, walker.z);
    camera.rotation.set(walker.pitch, pathYawAt(walker.z) + walker.yaw, 0, "YXZ");
  }, -1);

  return null;
}
