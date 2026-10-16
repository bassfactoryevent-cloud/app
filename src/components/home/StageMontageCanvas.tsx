"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CanvasIcon from "@/components/ui/CanvasIcon";

type StagePreset = "lasers" | "sound" | "matrix";

const PRESETS: {
  id: StagePreset;
  tag: string;
  title: string;
  desc: string;
  spec: string;
}[] = [
  {
    id: "lasers",
    tag: "STAGE RIG 01",
    title: "Montaje Láser & Truss Industrial",
    desc: "Barrido sincronizado de haces ópticos de alta potencia y atmósfera inmersiva estilo warehouse.",
    spec: "16x Proyectores RGB/Crimson • DMX Timecode",
  },
  {
    id: "sound",
    tag: "STAGE RIG 02",
    title: "Sistema Acústico 360° Sub-Bass",
    desc: "Presión sonora calibrada para frecuencias bajas profundas con claridad de estudio en cada rincón.",
    spec: "128 BPM Calibration • Line Array + Sub-Bass Wall",
  },
  {
    id: "matrix",
    tag: "STAGE RIG 03",
    title: "Cabina Boiler & LED Matrix",
    desc: "Escenario envolvente con conexión directa entre el artista y la pista de baile + acceso QR rápido.",
    spec: "360° Crowd Stage • Visuales Generativos en Vivo",
  },
];

export default function StageMontageCanvas() {
  const [preset, setPreset] = useState<StagePreset>("lasers");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width || 600;
      height = rect.height || 170;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    const render = () => {
      t += 0.04;
      ctx.clearRect(0, 0, width, height);

      // Subtle stage truss grid on top
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(width, 18);
      for (let x = 0; x < width; x += 28) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 14, 18);
        ctx.lineTo(x + 28, 0);
      }
      ctx.stroke();

      if (preset === "lasers") {
        // 4 Overhead Laser Projectors on the stage truss
        const projectors = [0.2, 0.4, 0.6, 0.8];
        projectors.forEach((pxRatio, pIdx) => {
          const ox = width * pxRatio;
          const oy = 18;

          // Draw 5 beams per projector
          for (let b = -2; b <= 2; b++) {
            const angle =
              Math.sin(t * 1.4 + pIdx * 1.2 + b * 0.25) * 0.65 + b * 0.18;
            const tx = ox + Math.tan(angle) * (height - oy);
            const ty = height;

            const grad = ctx.createLinearGradient(ox, oy, tx, ty);
            const isCrimson = (pIdx + Math.abs(b)) % 2 === 0;
            grad.addColorStop(
              0,
              isCrimson
                ? "rgba(217, 4, 22, 0.9)"
                : "rgba(255, 255, 255, 0.65)"
            );
            grad.addColorStop(1, "rgba(217, 4, 22, 0.0)");

            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(tx, ty);
            ctx.strokeStyle = grad;
            ctx.lineWidth = b === 0 ? 2 : 1.1;
            ctx.stroke();
          }

          // Projector node glow
          ctx.beginPath();
          ctx.arc(ox, oy, 3, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        });
      } else if (preset === "sound") {
        // Dual Subwoofer Cones + 32-Band Equalizer Stage
        const bars = 36;
        const barW = (width - 40) / bars;
        for (let i = 0; i < bars; i++) {
          const centerDist = Math.abs(i - bars / 2) / (bars / 2);
          const amp =
            Math.abs(
              Math.sin(t * 2.8 + i * 0.35) * Math.cos(t * 1.5 - i * 0.2)
            ) *
            (1 - centerDist * 0.55);
          const bh = Math.max(6, amp * (height - 46));
          const x = 20 + i * barW;
          const y = height - 10 - bh;

          ctx.fillStyle =
            i % 3 === 0
              ? "#D90416"
              : "rgba(255, 255, 255, 0.78)";
          ctx.beginPath();
          ctx.roundRect(x, y, Math.max(2, barW - 3), bh, 2);
          ctx.fill();
        }
      } else if (preset === "matrix") {
        // LED Wall Strobe Matrix + 3D Perspective Stage Floor
        const cols = 18;
        const rows = 5;
        const cellW = (width - 40) / cols;
        const cellH = (height - 50) / rows;

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const wave = Math.sin(t * 3 - (c * 0.35 + r * 0.5));
            const alpha = wave > 0.2 ? (wave - 0.2) * 0.85 : 0.06;
            const isRed = (r + c) % 2 === 0;
            ctx.fillStyle = isRed
              ? `rgba(217, 4, 22, ${alpha})`
              : `rgba(255, 255, 255, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.roundRect(
              20 + c * cellW,
              26 + r * cellH,
              cellW - 4,
              cellH - 4,
              2
            );
            ctx.fill();
          }
        }
      }

      // Crowd silhouette / stage horizon glow at bottom
      const floorGrad = ctx.createLinearGradient(0, height - 18, 0, height);
      floorGrad.addColorStop(0, "rgba(217, 4, 22, 0)");
      floorGrad.addColorStop(1, "rgba(217, 4, 22, 0.22)");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height - 18, width, 18);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [preset]);

  const activeInfo = PRESETS.find((p) => p.id === preset) || PRESETS[0];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "1rem",
        overflow: "hidden",
        background: "#08080b",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        alignItems: "stretch",
      }}
    >
      {/* Left: Interactive Canvas Stage Rig */}
      <div
        style={{
          position: "relative",
          minHeight: "165px",
          background:
            "radial-gradient(circle at 50% 0%, rgba(217, 4, 22, 0.18), #050507 75%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0.75rem 0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              background: "rgba(5, 5, 5, 0.8)",
              border: "1px solid rgba(217, 4, 22, 0.45)",
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "#fff",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#D90416",
                boxShadow: "0 0 8px #D90416",
              }}
            />
            LIVE STAGE SIMULATOR
          </span>

          <span
            style={{
              fontSize: "0.64rem",
              fontWeight: 700,
              color: "rgba(255,255,255,0.6)",
              background: "rgba(0,0,0,0.65)",
              padding: "0.18rem 0.5rem",
              borderRadius: "999px",
            }}
          >
            {activeInfo.spec}
          </span>
        </div>

        {/* Mode Switcher Pills at Bottom of Canvas */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "0.65rem 0.9rem",
            display: "flex",
            gap: "0.4rem",
            flexWrap: "wrap",
          }}
        >
          {PRESETS.map((p) => {
            const isActive = p.id === preset;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                style={{
                  padding: "0.3rem 0.65rem",
                  borderRadius: "0.45rem",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  cursor: "pointer",
                  background: isActive
                    ? "#D90416"
                    : "rgba(12, 12, 16, 0.82)",
                  color: "#fff",
                  border: isActive
                    ? "1px solid #D90416"
                    : "1px solid rgba(255,255,255,0.14)",
                  transition: "all 0.18s ease",
                }}
              >
                {p.tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Stage Description & Quick Action */}
      <div
        style={{
          padding: "1.1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "0.45rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CanvasIcon variant="laser" size={24} />
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "#D90416",
              textTransform: "uppercase",
            }}
          >
            PRODUCCIÓN & MONTAJE DE EVENTOS
          </span>
        </div>

        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {activeInfo.title}
        </h3>

        <p
          style={{
            fontSize: "0.78rem",
            color: "rgba(255, 255, 255, 0.65)",
            margin: 0,
            lineHeight: 1.45,
          }}
        >
          {activeInfo.desc}
        </p>

        <div style={{ marginTop: "0.35rem", display: "flex", gap: "0.6rem", alignItems: "center" }}>
          <Link
            href="/events"
            style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              color: "#ffffff",
              background: "rgba(217, 4, 22, 0.18)",
              border: "1px solid rgba(217, 4, 22, 0.45)",
              padding: "0.38rem 0.85rem",
              borderRadius: "0.45rem",
              textDecoration: "none",
            }}
          >
            Ver Próximos Montajes →
          </Link>
        </div>
      </div>
    </div>
  );
}
