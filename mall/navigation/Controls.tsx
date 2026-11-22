"use client";

import { useEffect, useRef } from "react";
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
const TUTORIAL_FORWARD_END = 12.4;
const TUTORIAL_BACK_END = 11.4;
const W1_LOOK_MIN = (53.5 * Math.PI) / 180;
const W1_LOOK_MAX = (117.5 * Math.PI) / 180;
const TUTORIAL_LEFT_TARGET = (100 * Math.PI) / 180;
const TUTORIAL_RIGHT_DELTA = (30 * Math.PI) / 180;

interface ActiveTouch {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  axis: "look" | "walk" | null;
  startedAt: number;
}

function isW1InViewDirection() {
  return walker.yaw >= W1_LOOK_MIN && walker.yaw <= W1_LOOK_MAX;
}

export function Controls() {
  const gl = useThree((state) => state.gl);
  const camera = useThree((state) => state.camera);
  const t3StartYaw = useRef(0);
  const t3MaximumYaw = useRef(0);
  const t4InWindowSince = useRef(0);

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
      if (document.pointerLockElement === element) {
        getState().setLookMode("locked");
      } else if (getState().lookMode === "locked") {
        // Escape or a browser interruption releases capture but leaves uncaptured look usable.
        getState().setLookMode("steer");
      }
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
      const state = getState();
      const step = state.tutorialStep;
      if (step >= 1 && step <= 4) return;
      if (step === 5 && !isW1InViewDirection()) {
        state.setTutorialHint("Face the boutique, then double-click.");
        return;
      }
      if (document.pointerLockElement === element) document.exitPointerLock();
      if (step === 5) state.setTutorialComplete();
      state.setLookMode("idle");
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      touches.set(event.pointerId, {
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

      // The walkway's first tap has no visible action, so store selection never waits for a double-tap.
      if (lastEmptyTap && now - lastEmptyTap <= DOUBLE_TAP_MS) {
        lastEmptyTap = 0;
        const state = getState();
        const step = state.tutorialStep;
        if (step >= 1 && step <= 4) return;
        if (step === 5 && !isW1InViewDirection()) {
          state.setTutorialHint("Face the boutique, then double-tap.");
          return;
        }
        if (step === 5) state.setTutorialComplete();
        state.setLookMode("idle");
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
    const state = useMallStore.getState();
    if (state.mode !== "walking") walker.pad = 0;

    const before = walker.s;
    stepWalker(delta);
    const step = state.tutorialStep;

    if (step === 1) {
      if (walker.s >= TUTORIAL_FORWARD_END && walker.vel > 0) {
        walker.s = TUTORIAL_FORWARD_END;
        walker.vel = 0;
        state.setTutorialStep(2);
      }
    } else if (step === 2) {
      if (walker.s <= TUTORIAL_BACK_END && walker.vel < 0) {
        walker.s = TUTORIAL_BACK_END;
        walker.vel = 0;
        t3StartYaw.current = walker.yaw;
        state.setTutorialStep(3);
      }
    } else if (step === 3) {
      walker.s = TUTORIAL_BACK_END;
      walker.vel = 0;
      if (walker.yaw > t3StartYaw.current && walker.yaw >= TUTORIAL_LEFT_TARGET) {
        t3MaximumYaw.current = walker.yaw;
        t4InWindowSince.current = 0;
        state.setTutorialStep(4);
      }
    } else if (step === 4) {
      walker.s = TUTORIAL_BACK_END;
      walker.vel = 0;
      t3MaximumYaw.current = Math.max(t3MaximumYaw.current, walker.yaw);
      const turnedRightEnough = t3MaximumYaw.current - walker.yaw >= TUTORIAL_RIGHT_DELTA;
      const insideW1Window = isW1InViewDirection();
      if (turnedRightEnough && insideW1Window) {
        if (!t4InWindowSince.current) t4InWindowSince.current = performance.now();
        if (performance.now() - t4InWindowSince.current >= 300) {
          state.setTutorialStep(5);
        }
      } else {
        t4InWindowSince.current = 0;
      }
    } else if (step === 5) {
      walker.s = TUTORIAL_BACK_END;
      walker.vel = 0;
    }

    // T1/T2 must be completed by real movement; the subsequent look steps hold at s=11.4.
    if (step >= 3 && step <= 5) {
      walker.s = TUTORIAL_BACK_END;
      walker.vel = 0;
    }
    if (walker.s === before && Math.abs(walker.vel) < 0.002) walker.vel = 0;

    const frame = pathFrameAt(walker.s);
    camera.position.set(frame.x, MALL.eyeHeight, frame.z);
    camera.rotation.set(walker.pitch, frame.yaw + walker.yaw, 0, "YXZ");
  }, -1);

  return null;
}
