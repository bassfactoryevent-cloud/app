"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "primary", size = "md", style, ...props }, ref) => {
    // Determine styles based on variant
    const baseStyles = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-full)",
      fontWeight: 600,
      fontFamily: "'Outfit', sans-serif",
      letterSpacing: "0.02em",
      cursor: "pointer",
      border: "none",
      outline: "none",
      transition: "background-color 0.2s, box-shadow 0.2s, color 0.2s, border-color 0.2s",
      ...style,
    };

    const sizeStyles: Record<string, any> = {
      sm: { height: "36px", padding: "0 var(--space-2)", fontSize: "0.875rem" },
      md: { height: "48px", padding: "0 var(--space-4)", fontSize: "1rem" },
      lg: { height: "56px", padding: "0 var(--space-5)", fontSize: "1.125rem" },
    };

    const variantStyles: Record<string, any> = {
      primary: {
        backgroundColor: "var(--color-magenta)",
        color: "white",
        boxShadow: "0 4px 15px var(--color-magenta-glow)",
      },
      secondary: {
        backgroundColor: "var(--color-surface)",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border)",
      },
      outline: {
        backgroundColor: "transparent",
        color: "var(--color-text-primary)",
        border: "1px solid var(--color-border)",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--color-text-primary)",
      },
    };

    return (
      <motion.button
        ref={ref}
        style={{ ...baseStyles, ...sizeStyles[size], ...variantStyles[variant] }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
