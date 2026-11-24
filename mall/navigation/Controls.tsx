"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MALL } from "@/lib/config/mall";
import { pointAt } from "@/lib/config/path";
import { useMallStore } from "@/lib/bridge/mallStore";
import { lookBridge } from "@/lib/bridge/lookBridge";
import { useTutorial } from "@/lib/bridge/tutorialStore";
import { pickStore } from "@/mall/interaction/pick";
import { openSection } from "@/mall/transitions/openSection";
import { addMouseLook, addSwipeLook, addSwipeWalk, addWheel, stepWalker, walker } from "./walker";
import { attemptStopFreeLook } from "./tutorialLogic";
import { videoStats } from "@/mall/video/videoManager";

const TAP_PX = 10;
const TAP_MS = 300;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 24;
const AXIS_LOCK_PX = 8;

/**
 * Locked controls (Blueprint 0.7):
 *  - scroll DOWN walks forward, scroll UP walks back (mouse wheel and trackpad)
 *  - mouse / trackpad MOVEMENT turns the head (no dragging); pointer lock is requested on
 *    "Enter the mall" and on walkway clicks, and the look keeps working if it is refused
 *  - single click / tap on a boutique opens it immediately (reticle when locked, cursor otherwise)
 *  - double-click / double-tap on the empty walkway stops free-look; "Look around" resumes it
 *  - touch: swipe LEFT looks left, swipe RIGHT looks right, swipe UP walks forward (axis-locked)
 * The body only ever moves along the centreline; the camera is never moved or turned automatically.
 */
export function Controls() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "none";
    const store = useMallStore.getState;
    const active = () => store().mode === "walking" && store().entered;
    const tutorialDone = () => useTutorial.getState().step === 6;
    const ndc = new THREE.Vector2();

    const requestLock = () => {
      if (document.pointerLockElement === el) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;
      try {
        const r = el.requestPointerLock() as unknown as Promise<void> | undefined;
        if (r && typeof r.catch === "function") r.catch(() => undefined);
      } catch {
        /* refused: uncaptured movement look keeps working */
      }
    };
    lookBridge.lock = requestLock;
    const resumeLook = () => {
      store().setLookMode("free");
      requestLock();
    };
    lookBridge.resume = resumeLook;

    const toNdc = (clientX: number, clientY: number) => {
      const r = el.getBoundingClientRect();
      ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
      return ndc;
    };
    const pointerNdc = (e: MouseEvent) => (document.pointerLockElement === el ? ndc.set(0, 0) : toNdc(e.clientX, e.clientY));

    const stopFreeLook = () => {
      if (!attemptStopFreeLook()) return;
      if (document.pointerLockElement === el) document.exitPointerLock();
      store().setLookMode("stopped");
    };

    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __shopnet?: object }).__shopnet = {
        walker,
        camera,
        look: (dx: number, dy: number) => addMouseLook(dx, dy),
        wheel: (dy: number) => addWheel(dy),
        stopFreeLook,
        tutorial: useTutorial,
        store: useMallStore,
        videoStats,
      };
    }

    const onLockChange = () => store().setLocked(document.pointerLockElement === el);

    const onMouseMove = (e: MouseEvent) => {
      if (!active() || store().lookMode !== "free") return;
      if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return;
      // Uncaptured movement only counts while the cursor is over the mall.
      if (document.pointerLockElement !== el && e.target !== el) return;
      addMouseLook(e.movementX, e.movementY);
    };

    const onClick = (e: MouseEvent) => {
      if (!active()) return;
      const hit = pickStore(camera, pointerNdc(e));
      if (hit) {
        if (tutorialDone()) openSection(hit.id);
        return;
      }
      // empty walkway: (re)capture the mouse for unlimited 360° look; never from a store click
      if (store().lookMode === "free" && e.detail === 1) requestLock();
    };

    const onDoubleClick = (e: MouseEvent) => {
      if (!active()) return;
      e.preventDefault();
      // During the tour the customer is facing W1, so a double-click anywhere counts as the 5th step.
      if (tutorialDone() && pickStore(camera, pointerNdc(e))) return;
      stopFreeLook();
    };

    // touch
    type T = { x: number; y: number; sx: number; sy: number; t: number; axis: "x" | "y" | null };
    const touches = new Map<number, T>();
    let lastTap = { t: 0, x: 0, y: 0 };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), axis: null });
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* optional */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const tp = touches.get(e.pointerId);
      if (!tp || !active() || touches.size !== 1) return;
      const dx = e.clientX - tp.x;
      const dy = e.clientY - tp.y;
      tp.x = e.clientX;
      tp.y = e.clientY;
      if (!tp.axis) {
        const mx = Math.abs(e.clientX - tp.sx);
        const my = Math.abs(e.clientY - tp.sy);
        if (Math.max(mx, my) < AXIS_LOCK_PX) return;
        tp.axis = mx > my ? "x" : "y";
      }
      if (tp.axis === "x") {
        if (store().lookMode === "free") addSwipeLook(dx);
      } else {
        addSwipeWalk(dy);
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      const tp = touches.get(e.pointerId);
      touches.delete(e.pointerId);
      if (!tp || e.pointerType === "mouse" || !active()) return;
      const moved = Math.hypot(e.clientX - tp.sx, e.clientY - tp.sy);
      const now = performance.now();
      if (moved >= TAP_PX || now - tp.t > TAP_MS) return;
      const hit = tutorialDone() ? pickStore(camera, toNdc(e.clientX, e.clientY)) : null;
      if (hit) {
        // a store tap opens immediately and never starts a double-tap window
        lastTap = { t: 0, x: 0, y: 0 };
        openSection(hit.id);
        return;
      }
      if (now - lastTap.t < DOUBLE_TAP_MS && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < DOUBLE_TAP_PX) {
        lastTap = { t: 0, x: 0, y: 0 };
        stopFreeLook();
        return;
      }
      lastTap = { t: now, x: e.clientX, y: e.clientY };
    };
    const onPointerCancel = (e: PointerEvent) => touches.delete(e.pointerId);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!active()) return;
      const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY;
      addWheel(Math.max(-120, Math.min(120, delta)));
    };

    const isTyping = (t: EventTarget | null) => t instanceof HTMLElement && ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName);
    const keys = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"];
    const onKeyDown = (e: KeyboardEvent) => {
      if (!active() || isTyping(e.target)) return;
      if (e.code === "KeyL") {
        if (store().lookMode === "free") stopFreeLook();
        else resumeLook();
        return;
      }
      if (!keys.includes(e.code)) return;
      e.preventDefault();
      walker.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => walker.keys.delete(e.code);
    const onBlur = () => {
      walker.keys.clear();
      walker.pad = 0;
    };

    el.addEventListener("click", onClick);
    el.addEventListener("dblclick", onDoubleClick);
    document.addEventListener("pointerlockchange", onLockChange);
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
      lookBridge.resume = () => {};
      el.removeEventListener("click", onClick);
      el.removeEventListener("dblclick", onDoubleClick);
      document.removeEventListener("pointerlockchange", onLockChange);
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
  }, [gl, camera]);

  useFrame((state, dt) => {
    if (process.env.NODE_ENV !== "production" && (window as unknown as { __overview?: boolean }).__overview) {
      // developer plan view (used for layout checks only)
      camera.position.set(25, 95, -2);
      camera.rotation.set(-Math.PI / 2, 0, 0, "YXZ");
      const c = state.scene.getObjectByName("ceiling");
      if (c) c.visible = false;
      state.scene.fog = null;
      const pc = camera as THREE.PerspectiveCamera;
      if (pc.far !== 200) {
        pc.far = 200;
        pc.fov = 62;
        pc.updateProjectionMatrix();
      }
      return;
    }
    if (useMallStore.getState().mode === "walking") stepWalker(dt);
    const p = pointAt(walker.s);
    camera.position.set(p.x, MALL.eyeHeight, p.z);
    camera.rotation.set(walker.pitch, p.yaw + walker.headYaw, 0, "YXZ");
  }, -1);

  return null;
}
