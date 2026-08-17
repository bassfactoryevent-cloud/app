"use client";

import Link from "next/link";
import React from "react";

interface StatItem {
  name: string;
  count: number;
  icon: React.ReactNode;
  href: string;
  color: string;
}

export default function DashboardGrid({ stats }: { stats: StatItem[] }) {
  return (
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
  );
}
