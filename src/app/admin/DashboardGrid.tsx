"use client";

import Link from "next/link";
import React from "react";

import { Users, DollarSign } from "lucide-react";

interface StatItem {
  name: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function DashboardGrid({ stats, totalSales, totalUsers }: { stats: StatItem[], totalSales: number, totalUsers: number }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Total Sales Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)",
          border: "1px solid rgba(34, 197, 94, 0.2)",
          borderRadius: "1rem",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            color: "#22c55e",
            padding: "1rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <DollarSign size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              Ingresos Totales (Tickets + Merch)
            </h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", margin: 0, lineHeight: 1 }}>
              ${totalSales.toLocaleString('es-CO')}
            </p>
          </div>
        </div>

        {/* Total Users Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
          borderRadius: "1rem",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            color: "#3b82f6",
            padding: "1rem",
            borderRadius: "0.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Users size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.7)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
              Usuarios Registrados
            </h3>
            <p style={{ fontSize: "2.5rem", fontWeight: 800, color: "white", margin: 0, lineHeight: 1 }}>
              {totalUsers}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
      {stats.map((stat) => (
        <Link href={stat.href} key={stat.name} style={{ textDecoration: "none" }}>
          <div 
            style={{
              backgroundColor: "var(--color-surface, #111)",
              border: "1px solid var(--color-border, #333)",
              borderRadius: "1rem",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              transition: "transform 0.2s, border-color 0.2s",
              cursor: "pointer"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = stat.color;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--color-border, #333)";
            }}
          >
            <div style={{
              backgroundColor: `${stat.color}20`,
              color: stat.color,
              padding: "1rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {stat.icon}
            </div>
            <div>
              <h3 style={{ fontSize: "0.875rem", color: "var(--color-text-secondary, #a1a1aa)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                {stat.name}
              </h3>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "white", margin: 0, lineHeight: 1 }}>
                {stat.count}
              </p>
            </div>
          </div>
        </Link>
      ))}
      </div>
    </>
  );
}
