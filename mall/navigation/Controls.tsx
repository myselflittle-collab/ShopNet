"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MALL } from "@/lib/config/mall";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { addLook, addWheel, stepWalker, TUNING, walker } from "./walker";
import { pathFrameAt } from "./path";
import { selectTarget } from "@/mall/interaction/HoverController";

const TAP_MOVE_PX = 8;
const TAP_TIME_MS = 250;
const DOUBLE_TAP_MS = 300;

interface ActiveTouch {
  id: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  axis: "look" | "walk" | null;
  startedAt: number;
}

/** The customer's body follows the S-path; head-look is independent and unwrapped. */
export function Controls() {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    const element = gl.domElement;
    element.style.touchAction = "none";
    const getState = useMallStore.getState;
    const isWalking = () => getState().mode === "walking";
    let lastEmptyTap = 0;
    const touches = new Map<number, ActiveTouch>();

    const requestPointerLock = () => {
      if (document.pointerLockElement === element) return;
      getState().setLookMode("steer");
      try {
        const result = element.requestPointerLock();
        if (result && typeof (result as Promise<void>).catch === "function") {
          (result as Promise<void>).catch(() => getState().setLookMode("steer"));
        }
      } catch {
        getState().setLookMode("steer");
      }
    };
    lookBridge.lock = requestPointerLock;

    const onPointerLockChange = () => {
      if (document.pointerLockElement === element) getState().setLookMode("locked");
      else if (getState().lookMode === "locked") getState().setLookMode("idle");
    };
    const onPointerLockError = () => getState().setLookMode("steer");

    const onMouseMove = (event: MouseEvent) => {
      if (!isWalking()) return;
      const mode = getState().lookMode;
      if (mode !== "locked" && mode !== "steer") return;
      if (Math.abs(event.movementX) > 300 || Math.abs(event.movementY) > 300) return;
      addLook(event.movementX, event.movementY);
    };

    const onClick = (event: MouseEvent) => {
      if (!isWalking() || event.detail > 1) return;
      const rect = element.getBoundingClientRect();
      if (document.pointerLockElement === element) {
        selectTarget("mouse");
      } else {
        selectTarget("mouse", {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          w: rect.width,
          h: rect.height,
        });
      }
    };

    const onDoubleClick = (event: MouseEvent) => {
      if (!isWalking()) return;
      event.preventDefault();
      event.stopPropagation();
      if (document.pointerLockElement === element) document.exitPointerLock();
      getState().setLookMode("idle");
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      touches.set(event.pointerId, {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        axis: null,
        startedAt: performance.now(),
      });
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is a best-effort convenience.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const touch = touches.get(event.pointerId);
      if (!touch || !isWalking() || touches.size > 1) return;
      const dx = event.clientX - touch.lastX;
      const dy = event.clientY - touch.lastY;
      const totalX = event.clientX - touch.startX;
      const totalY = event.clientY - touch.startY;
      touch.lastX = event.clientX;
      touch.lastY = event.clientY;

      if (!touch.axis && Math.hypot(totalX, totalY) >= TAP_MOVE_PX) {
        touch.axis = Math.abs(totalX) >= Math.abs(totalY) ? "look" : "walk";
      }
      if (touch.axis === "look" && getState().lookMode === "touch") {
        addLook(dx, 0, TUNING.touchSensitivity);
      } else if (touch.axis === "walk") {
        walker.pad = Math.max(-1, Math.min(1, -dy / 120));
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const touch = touches.get(event.pointerId);
      touches.delete(event.pointerId);
      if (touches.size === 0) walker.pad = 0;
      if (!touch || !isWalking()) return;

      const moved = Math.hypot(event.clientX - touch.startX, event.clientY - touch.startY);
      const duration = performance.now() - touch.startedAt;
      if (moved >= TAP_MOVE_PX || duration >= TAP_TIME_MS) return;

      const rect = element.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        w: rect.width,
        h: rect.height,
      };
      const openedStore = selectTarget("touch", point);
      const now = performance.now();
      if (openedStore) {
        lastEmptyTap = 0;
        return;
      }

      // Empty walkway tap 1 does nothing. Tap 2 toggles look without delaying store taps.
      if (lastEmptyTap && now - lastEmptyTap <= DOUBLE_TAP_MS) {
        lastEmptyTap = 0;
        getState().setLookMode(getState().lookMode === "touch" ? "idle" : "touch");
      } else {
        lastEmptyTap = now;
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      touches.delete(event.pointerId);
      if (touches.size === 0) walker.pad = 0;
    };

    const onWheel = (event: WheelEvent) => {
      if (!isWalking()) return;
      event.preventDefault();
      const multiplier = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
      addWheel(Math.max(-180, Math.min(180, event.deltaY * multiplier)));
    };

    const keys = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isWalking() || !keys.includes(event.code)) return;
      if (event.target instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName)) return;
      event.preventDefault();
      walker.keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => walker.keys.delete(event.code);
    const onBlur = () => {
      walker.keys.clear();
      walker.pad = 0;
      touches.clear();
      if (document.pointerLockElement === element) document.exitPointerLock();
    };

    element.addEventListener("click", onClick);
    element.addEventListener("dblclick", onDoubleClick);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("pointerlockerror", onPointerLockError);
    document.addEventListener("mousemove", onMouseMove);
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      lookBridge.lock = () => {};
      if (document.pointerLockElement === element) document.exitPointerLock();
      element.removeEventListener("click", onClick);
      element.removeEventListener("dblclick", onDoubleClick);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("pointerlockerror", onPointerLockError);
      document.removeEventListener("mousemove", onMouseMove);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (useMallStore.getState().mode !== "walking") {
      walker.pad = 0;
    }
    stepWalker(delta);
    const frame = pathFrameAt(walker.s);
    camera.position.set(frame.x, MALL.eyeHeight, frame.z);
    camera.rotation.set(walker.pitch, frame.yaw + walker.yaw, 0, "YXZ");
  }, -1);

  return null;
}
