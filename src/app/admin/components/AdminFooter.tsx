"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Activity, Wifi, HelpCircle } from "lucide-react";

interface AdminFooterProps {
  profile: any;
}

export function AdminFooter({ profile }: AdminFooterProps) {
  const isSuperAdmin = profile?.role === "superadmin";

  return (
    <footer
      style={{
        padding: "0.85rem 1.25rem",
        borderRadius: "0.85rem",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        backgroundColor: "rgba(14, 14, 18, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        fontSize: "0.74rem",
        color: "rgba(255, 255, 255, 0.45)",
        marginTop: "auto",
        flexShrink: 0
      }}
      className="admin-system-footer"
    >
      {/* Left: System Version & Environment */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontWeight: 700, color: "rgba(255, 255, 255, 0.75)", letterSpacing: "0.04em" }}>
          BASSFACTORY CORE OS <span style={{ color: "var(--color-magenta, #ec4899)" }}>v2.4</span>
        </span>
        <span style={{ color: "rgba(255, 255, 255, 0.2)" }}>•</span>
        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "0.15rem 0.45rem",
          borderRadius: "4px",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          color: "#4ade80",
          fontSize: "0.68rem",
          fontWeight: 700
        }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
          PRODUCCIÓN
        </span>
      </div>

      {/* Center: Realtime Service Micro-Badges */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }} className="footer-services-badges">
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
          PostgreSQL DB
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
          Pasarela Bold
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
          Resend Correos
        </span>
      </div>

      {/* Right: Security & Session Info */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
          <ShieldCheck size={13} style={{ color: isSuperAdmin ? "#eab308" : "var(--color-magenta, #ec4899)" }} />
          <span>
            Sesión: <b style={{ color: "rgba(255, 255, 255, 0.8)" }}>{profile?.email || "Admin"}</b>
          </span>
        </div>
        <span style={{ color: "rgba(255, 255, 255, 0.2)" }} className="footer-hide-mobile">•</span>
        <span className="footer-hide-mobile">
          © 2026 Bassfactory Entertainment
        </span>
      </div>
    </footer>
  );
}
