"use client";

import { useEffect, useRef } from "react";

type CursorMode = "default" | "interactive" | "drag" | "native";

function supportsCustomCursor() {
  if (typeof window === "undefined") return false;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return finePointer && !reduced;
}

function detectMode(target: EventTarget | null): CursorMode {
  if (!(target instanceof Element)) return "default";

  // Let native date picker controls use the OS cursor to avoid double-cursor artifacts.
  if (target.closest("input[type='date']")) {
    return "native";
  }

  if (target.closest("[data-cursor='drag'], .maplibregl-canvas, input[type='range']")) {
    return "drag";
  }

  if (
    target.closest(
      "[data-cursor='interactive'], a, button, [role='button'], [role='radio'], input, select, summary, label, [aria-pressed], [aria-checked]",
    )
  ) {
    return "interactive";
  }

  return "default";
}

export function SmartCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supportsCustomCursor()) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add("cursor-enhanced");

    let raf = 0;
    let animating = false;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let visible = false;
    let pressed = false;
    let mode: CursorMode = "default";
    let lastVisible = false;
    let lastPressed = false;
    let lastMode: CursorMode = "default";

    const syncCursorState = () => {
      if (lastVisible !== visible) {
        const value = visible ? "true" : "false";
        dot.dataset.visible = value;
        ring.dataset.visible = value;
        lastVisible = visible;
      }

      if (lastPressed !== pressed) {
        const value = pressed ? "true" : "false";
        dot.dataset.pressed = value;
        ring.dataset.pressed = value;
        lastPressed = pressed;
      }

      if (lastMode !== mode) {
        dot.dataset.mode = mode;
        ring.dataset.mode = mode;
        lastMode = mode;
      }
    };

    const setDotPosition = () => {
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    };

    const startAnimation = () => {
      if (animating) return;
      animating = true;
      raf = window.requestAnimationFrame(draw);
    };

    const draw = () => {
      const ease = 0.26;
      rx += (x - rx) * ease;
      ry += (y - ry) * ease;

      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;

      const closeEnough = Math.abs(x - rx) < 0.2 && Math.abs(y - ry) < 0.2;
      if (!closeEnough || visible) {
        raf = window.requestAnimationFrame(draw);
      } else {
        animating = false;
      }
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      mode = detectMode(e.target);
      visible = mode !== "native";
      if (visible) setDotPosition();
      syncCursorState();
      if (visible) startAnimation();
    };

    const onDown = () => {
      pressed = true;
      syncCursorState();
    };

    const onUp = () => {
      pressed = false;
      syncCursorState();
    };

    const onLeave = () => {
      visible = false;
      syncCursorState();
    };

    const onEnter = () => {
      visible = true;
      syncCursorState();
      startAnimation();
    };

    setDotPosition();
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    syncCursorState();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown, { passive: true });
    window.addEventListener("mouseup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.documentElement.classList.remove("cursor-enhanced");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="smart-cursor smart-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="smart-cursor smart-cursor-dot" aria-hidden="true" />
    </>
  );
}
