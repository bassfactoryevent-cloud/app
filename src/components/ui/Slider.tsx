"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  label?: string;
}

export function Slider({ min = 0, max = 100, step = 1, defaultValue = 50, onChange, label }: SliderProps) {
  const [value, setValue] = useState(defaultValue);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    const track = trackRef.current.getBoundingClientRect();
    const updateValue = (clientX: number) => {
      const newPct = Math.max(0, Math.min(1, (clientX - track.left) / track.width));
      let newVal = min + newPct * (max - min);
      // Snap to step
      newVal = Math.round(newVal / step) * step;
      setValue(newVal);
      onChange?.(newVal);
    };

    updateValue(e.clientX);

    const handlePointerMove = (e: PointerEvent) => {
      updateValue(e.clientX);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div style={{ width: "100%", padding: "0.5rem 0" }}>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>{label}</span>
          <span style={{ color: "var(--color-text-primary)", fontWeight: 600 }}>{value}</span>
        </div>
      )}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        style={{
          position: "relative",
          height: "24px",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          touchAction: "none",
        }}
      >
        {/* Track background */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "6px",
            background: "var(--color-border)",
            borderRadius: "3px",
          }}
        />
        {/* Track active */}
        <div
          style={{
            position: "absolute",
            left: 0,
            width: `${percentage}%`,
            height: "6px",
            background: "var(--color-magenta)",
            borderRadius: "3px",
          }}
        />
        {/* Thumb */}
        <motion.div
          style={{
            position: "absolute",
            left: `${percentage}%`,
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            background: "var(--color-bg)",
            border: "2px solid var(--color-magenta)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            x: "-50%",
          }}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        />
      </div>
    </div>
  );
}
