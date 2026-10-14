"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isActionError, setIsActionError] = useState(false);

  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error);

    // Detect if this is a Next.js Server Action build mismatch error
    const msg = error?.message || "";
    if (
      msg.includes("Server Action") ||
      msg.includes("was not found on the server") ||
      msg.includes("failed-to-find-server-action")
    ) {
      setIsActionError(true);
      // Auto reload after brief moment to fetch fresh deployment assets
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem"
    }}>
      <div style={{
        maxWidth: "520px",
        width: "100%",
        backgroundColor: "#111116",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1rem",
        padding: "2.5rem 2rem",
        textAlign: "center",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: isActionError ? "rgba(34, 197, 94, 0.12)" : "rgba(217, 4, 22, 0.12)",
          border: `1px solid ${isActionError ? "rgba(34, 197, 94, 0.3)" : "rgba(217, 4, 22, 0.3)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem auto",
          color: isActionError ? "#22c55e" : "#D90416"
        }}>
          {isActionError ? <RefreshCw size={26} className="animate-spin" /> : <AlertTriangle size={26} />}
        </div>

        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#ffffff", margin: "0 0 0.5rem 0", letterSpacing: "-0.02em" }}>
          {isActionError ? "Actualizando a la última versión..." : "Ocurrió un inconveniente temporal"}
        </h2>

        <p style={{ fontSize: "0.88rem", color: "#a1a1aa", lineHeight: 1.5, margin: "0 0 1.75rem 0" }}>
          {isActionError
            ? "Se acaba de desplegar una nueva versión de la plataforma. Recargando automáticamente para sincronizar..."
            : "No te preocupes, el servidor sigue activo. Puedes recargar para restaurar tu sesión."}
        </p>

        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
          <button 
            onClick={handleReload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.4rem",
              backgroundColor: "var(--color-magenta, #D90416)",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.55rem",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.88rem",
              boxShadow: "0 2px 10px rgba(217, 4, 22, 0.3)"
            }}
          >
            <RefreshCw size={16} />
            <span>Recargar Página</span>
          </button>

          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.2rem",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              borderRadius: "0.55rem",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.88rem"
            }}
          >
            <Home size={16} />
            <span>Inicio</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
