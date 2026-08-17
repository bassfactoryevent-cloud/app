"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import React from "react";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  pendingText?: string;
  icon?: React.ReactNode;
}

export default function SubmitButton({ children, pendingText = "Procesando...", icon, className, style, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      className={className || "btn btn-primary"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        opacity: pending ? 0.7 : 1,
        cursor: pending ? "not-allowed" : "pointer",
        ...style
      }}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
          {pendingText}
        </>
      ) : (
        <>
          {icon && icon}
          {children}
        </>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </button>
  );
}
