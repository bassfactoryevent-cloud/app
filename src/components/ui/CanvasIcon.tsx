"use client";

import React, { useEffect, useRef } from "react";

export type CanvasIconVariant = "radar" | "equalizer" | "prism" | "laser";

interface CanvasIconProps {
  variant: CanvasIconVariant;
  size?: number;
}

/**
 * 60fps GPU-accelerated micro-canvas icon in Bassfactory's crimson/white/obsidian palette.
 */
export default function CanvasIcon({ variant, size = 30 }: CanvasIconProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animId = 0;
    let t = 0;

    const render = () => {
      t += 0.045;
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      if (variant === "radar") {
        // Outer dark glass circle
        ctx.beginPath();
        ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Expanding sonic pulse ring
        const pulseRadius = ((t * 6) % (cx - 3)) + 2;
        const pulseAlpha = Math.max(0, 1 - pulseRadius / (cx - 2));
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(217, 4, 22, ${pulseAlpha * 0.9})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Rotating laser sweep
        const angle = t * 1.6;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(angle) * (cx - 3),
          cy + Math.sin(angle) * (cy - 3)
        );
        ctx.strokeStyle = "#D90416";
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Center glowing core
        ctx.beginPath();
        ctx.arc(cx, cy, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      } else if (variant === "equalizer") {
        const bars = 5;
        const gap = 2.5;
        const totalW = size - 8;
        const barW = (totalW - gap * (bars - 1)) / bars;
        const maxH = size - 8;

        for (let i = 0; i < bars; i++) {
          const wave =
            Math.abs(Math.sin(t * 2.2 + i * 0.95) * Math.cos(t * 1.1 - i * 0.4));
          const h = Math.max(4, wave * maxH);
          const x = 4 + i * (barW + gap);
          const y = size - 4 - h;

          ctx.fillStyle = i % 2 === 0 ? "#D90416" : "#ffffff";
          ctx.beginPath();
          ctx.roundRect(x, y, barW, h, 1.5);
          ctx.fill();
        }
      } else if (variant === "prism") {
        // Rotating 3D diamond / vinyl prism
        const r = cx - 4;
        const rot = t * 1.1;
        ctx.save();
        ctx.translate(cx, cy);

        // Outer spinning ring
        ctx.beginPath();
        ctx.arc(0, 0, r, rot, rot + Math.PI * 1.35);
        ctx.strokeStyle = "#D90416";
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Rotating 3D wireframe diamond
        const sx = Math.cos(rot) * (r - 3);
        const sy = Math.sin(rot) * (r - 3) * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, -(r - 3));
        ctx.lineTo(sx, 0);
        ctx.lineTo(0, r - 3);
        ctx.lineTo(-sx, 0);
        ctx.closePath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Horizontal equator
        ctx.beginPath();
        ctx.moveTo(-sx, 0);
        ctx.lineTo(0, sy);
        ctx.lineTo(sx, 0);
        ctx.strokeStyle = "rgba(217, 4, 22, 0.85)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.restore();
      } else if (variant === "laser") {
        // Club laser beams fan from top center
        const originX = cx;
        const originY = 3;
        const rays = 4;

        for (let i = 0; i < rays; i++) {
          const swing = Math.sin(t * 1.8 + i * 1.1) * (cx - 3);
          const targetX = cx + swing;
          const targetY = size - 3;

          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(targetX, targetY);
          ctx.strokeStyle =
            i % 2 === 0
              ? "rgba(217, 4, 22, 0.9)"
              : "rgba(255, 255, 255, 0.7)";
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }

        // Top projector node
        ctx.beginPath();
        ctx.arc(originX, originY + 1, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#D90416";
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [variant, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-block",
        flexShrink: 0,
        borderRadius: "8px",
        background: "rgba(217, 4, 22, 0.1)",
        border: "1px solid rgba(217, 4, 22, 0.3)",
      }}
    />
  );
}
