"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CanvasIcon from "@/components/ui/CanvasIcon";
import styles from "./StageMontageCanvas.module.css";

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
    tag: "01 • ASESORÍA",
    title: "Consultoría & Estructuración de Eventos",
    desc: "Te acompañamos desde cero a estructurar tu evento: viabilidad financiera, curaduría de lineup, locación y estrategia de fases.",
    spec: "Consultoría 360° • Estrategia & ROI",
  },
  {
    id: "sound",
    tag: "02 • MONTAJE",
    title: "Producción Técnica, Sonido & Stage",
    desc: "Diseño de escenarios, sonido Line Array / Sub-Bass calibrado, iluminación DMX, láseres y visuales de nivel internacional.",
    spec: "Montaje Integral • Audio & Visuales",
  },
  {
    id: "matrix",
    tag: "03 • GESTIÓN",
    title: "Acompañamiento, Ticketing QR & Booking",
    desc: "Venta de boletería QR antifraude en Bassfactory, control de acceso en puerta, difusión cultural y booking de artistas.",
    spec: "Boletería Oficial • Operación en Vivo",
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
      width = rect.width || 320;
      height = rect.height || 155;
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

      // Stage truss grid on top
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(width, 16);
      for (let x = 0; x < width; x += 24) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 12, 16);
        ctx.lineTo(x + 24, 0);
      }
      ctx.stroke();

      if (preset === "lasers") {
        const projectors = [0.22, 0.5, 0.78];
        projectors.forEach((pxRatio, pIdx) => {
          const ox = width * pxRatio;
          const oy = 16;

          for (let b = -2; b <= 2; b++) {
            const angle =
              Math.sin(t * 1.4 + pIdx * 1.2 + b * 0.25) * 0.6 + b * 0.18;
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
            ctx.lineWidth = b === 0 ? 1.8 : 1;
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(ox, oy, 2.8, 0, Math.PI * 2);
          ctx.fillStyle = "#ffffff";
          ctx.fill();
        });
      } else if (preset === "sound") {
        const bars = 28;
        const barW = (width - 28) / bars;
        for (let i = 0; i < bars; i++) {
          const centerDist = Math.abs(i - bars / 2) / (bars / 2);
          const amp =
            Math.abs(
              Math.sin(t * 2.8 + i * 0.35) * Math.cos(t * 1.5 - i * 0.2)
            ) *
            (1 - centerDist * 0.5);
          const bh = Math.max(5, amp * (height - 42));
          const x = 14 + i * barW;
          const y = height - 8 - bh;

          ctx.fillStyle =
            i % 3 === 0 ? "#D90416" : "rgba(255, 255, 255, 0.78)";
          ctx.beginPath();
          ctx.roundRect(x, y, Math.max(2, barW - 2.5), bh, 2);
          ctx.fill();
        }
      } else if (preset === "matrix") {
        const cols = 14;
        const rows = 4;
        const cellW = (width - 28) / cols;
        const cellH = (height - 44) / rows;

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
              14 + c * cellW,
              22 + r * cellH,
              cellW - 3,
              cellH - 3,
              2
            );
            ctx.fill();
          }
        }
      }

      const floorGrad = ctx.createLinearGradient(0, height - 16, 0, height);
      floorGrad.addColorStop(0, "rgba(217, 4, 22, 0)");
      floorGrad.addColorStop(1, "rgba(217, 4, 22, 0.24)");
      ctx.fillStyle = floorGrad;
      ctx.fillRect(0, height - 16, width, 16);

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
    <div className={styles.container}>
      {/* Top: Interactive Canvas Stage Rig */}
      <div className={styles.rigWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} />

        <div className={styles.topBar}>
          <span className={styles.labBadge}>
            <span className={styles.dot} />
            BASSFACTORY LAB
          </span>

          <span className={styles.specBadge}>
            {activeInfo.spec}
          </span>
        </div>

        {/* Mode Switcher Pills at Bottom of Canvas */}
        <div className={styles.presetGrid}>
          {PRESETS.map((p) => {
            const isActive = p.id === preset;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`${styles.presetButton} ${isActive ? styles.presetButtonActive : ""}`}
              >
                {p.tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom: Consulting & Advisory Offer + CTA to /produccion */}
      <div className={styles.content}>
        <div className={styles.tagRow}>
          <CanvasIcon variant="laser" size={20} />
          <span className={styles.tagText}>
            ASESORÍA, CONSULTORÍA & PRODUCCIÓN
          </span>
        </div>

        <h3 className={styles.title}>
          ¿Quieres crear tu propio evento? {activeInfo.title}
        </h3>

        <p className={styles.desc}>
          {activeInfo.desc}
        </p>

        <Link href="/produccion" className={styles.ctaButton}>
          Solicitar Asesoría y Acompañamiento →
        </Link>
      </div>
    </div>
  );
}

