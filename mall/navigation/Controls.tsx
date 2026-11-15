"use client";

import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MALL } from "@/lib/config/mall";
import { useMallStore } from "@/lib/bridge/mallStore";
import { addLook, addWheel, stepWalker, TUNING, walker } from "./walker";
import { pointer } from "@/mall/interaction/hoverState";
import { handleCanvasClick } from "@/mall/interaction/HoverController";

/**
 * Input: scroll walks, drag looks, the free cursor glances, keys walk and turn.
 * A press that moves less than 6 px is a click; more than that is a look-drag.
 */
export function Controls() {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // dev-only hook for automated browser tests
      (window as unknown as { __shopnet?: object }).__shopnet = { walker };
    }
    const el = gl.domElement;
    el.style.touchAction = "none";
    const walking = () => useMallStore.getState().mode === "walking";

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!walking()) return;
      const dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      addWheel(Math.max(-120, Math.min(120, dy)));
    };

    const local = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };

    const onDown = (e: PointerEvent) => {
      const p = local(e);
      pointer.down = true;
      pointer.dragging = false;
      pointer.downX = p.x;
      pointer.downY = p.y;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.type = e.pointerType;
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      const p = local(e);
      const dx = p.x - (pointer.x ?? p.x);
      const dy = p.y - (pointer.y ?? p.y);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.type = e.pointerType;
      if (pointer.down) {
        const dist = Math.hypot(p.x - pointer.downX, p.y - pointer.downY);
        if (!pointer.dragging && dist > TUNING.clickThresholdPx) pointer.dragging = true;
        if (pointer.dragging && walking()) addLook(dx, dy);
      }
      // glance: the head follows the free mouse cursor slightly
      if (e.pointerType === "mouse" && !pointer.down) {
        const nx = (p.x / p.w) * 2 - 1;
        const ny = (p.y / p.h) * 2 - 1;
        walker.glanceTargetYaw = -nx * TUNING.glanceMax;
        walker.glanceTargetPitch = -ny * TUNING.glanceMax * 0.5;
      }
    };

    const onUp = (e: PointerEvent) => {
      const p = local(e);
      const wasDrag = pointer.dragging;
      pointer.down = false;
      pointer.dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (wasDrag) {
        pointer.lastDragEnd = performance.now();
        return;
      }
      handleCanvasClick(p.x, p.y, e.pointerType);
    };

    const onLeave = () => {
      if (pointer.down) return;
      pointer.x = null;
      pointer.y = null;
      walker.glanceTargetYaw = 0;
      walker.glanceTargetPitch = 0;
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
    const onBlur = () => walker.keys.clear();

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [gl]);

  useFrame((_, dt) => {
    walker.glancePaused = pointer.dragging || useMallStore.getState().hoveredId !== null;
    stepWalker(dt);
    camera.position.set(walker.x, MALL.eyeHeight, walker.z);
    camera.rotation.set(walker.pitch + walker.glancePitch, walker.yaw + walker.glanceYaw, 0, "YXZ");
  }, -1);

  return null;
}
