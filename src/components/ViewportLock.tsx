"use client";

import { useEffect } from "react";

/**
 * Prevents pinch-to-zoom, gesture zoom, and double-tap zoom on iOS Safari & Android
 * where the browser ignores `user-scalable=no` in the viewport meta tag.
 */
export function ViewportLock() {
  useEffect(() => {
    const preventGesture = (e: Event) => {
      e.preventDefault();
    };

    const preventMultiTouchZoom = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("touchmove", preventMultiTouchZoom, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", preventMultiTouchZoom);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);

  return null;
}
