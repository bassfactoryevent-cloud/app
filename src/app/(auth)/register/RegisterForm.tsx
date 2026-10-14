"use client";

import React, { useState } from "react";
import { UserPlus, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function RegisterForm({ initialMessage }: { initialMessage?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialMessage || "");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "No se pudo crear la cuenta.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Cuenta creada con éxito.");
      setTimeout(() => {
        router.push("/login?message=Cuenta+creada.+Inicia+sesión+para+continuar.");
      }, 1500);
    } catch (err) {
      console.error("Register client error:", err);
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {errorMessage && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          color: "#f87171",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          padding: "0.85rem 1rem",
          borderRadius: "0.55rem",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem"
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, color: "#ef4444" }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          backgroundColor: "rgba(34, 197, 94, 0.12)",
          color: "#4ade80",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          padding: "0.85rem 1rem",
          borderRadius: "0.55rem",
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem"
        }}>
          <CheckCircle2 size={18} style={{ flexShrink: 0, color: "#22c55e" }} />
          <span>{successMessage}</span>
        </div>
      )}

      <div>
        <label htmlFor="full_name" style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          Nombre Completo
        </label>
        <input
          type="text"
          name="full_name"
          id="full_name"
          required
          autoComplete="name"
          placeholder="Juan Pérez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: "0.55rem",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            color: "#ffffff",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
      </div>

      <div>
        <label htmlFor="email" style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          Correo Electrónico
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: "0.55rem",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            color: "#ffffff",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          Contraseña
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.8rem 1rem",
            borderRadius: "0.55rem",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            backgroundColor: "rgba(0, 0, 0, 0.45)",
            color: "#ffffff",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          width: "100%",
          padding: "0.95rem 1.25rem",
          marginTop: "0.6rem",
          backgroundColor: "var(--color-magenta, #D90416)",
          color: "#ffffff",
          border: "none",
          borderRadius: "0.55rem",
          fontWeight: 700,
          fontSize: "0.92rem",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.75 : 1
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={19} className="animate-spin" />
            <span>Creando cuenta...</span>
          </>
        ) : (
          <>
            <UserPlus size={19} />
            <span>Crear Cuenta</span>
          </>
        )}
      </button>
    </form>
  );
}
