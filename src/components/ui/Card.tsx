"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glowColor?: string;
}

export function Card({ children, hoverable, glowColor, style, className, ...props }: CardProps) {
  return (
    <div
      className={`glass-panel ${className || ""}`}
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "var(--space-3)",
        transition: "transform 0.3s ease, border-color 0.3s ease",
        ...(hoverable ? { cursor: "pointer" } : {}),
        ...style,
      }}
      {...props}
      onMouseOver={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = "translateY(-5px)";
          e.currentTarget.style.borderColor = glowColor || "var(--color-border)";
        }
        if (props.onMouseOver) props.onMouseOver(e);
      }}
      onMouseOut={(e) => {
        if (hoverable) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.borderColor = "var(--glass-border)";
        }
        if (props.onMouseOut) props.onMouseOut(e);
      }}
    >
      {glowColor && (
        <div
          style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            width: "100px",
            height: "100px",
            opacity: 0.15,
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}
