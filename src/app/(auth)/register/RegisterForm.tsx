"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

export function RegisterForm({ initialMessage }: { initialMessage?: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        window.location.href =
          data.redirectUrl ||
          "/login?message=Cuenta+creada.+Inicia+sesión+para+continuar.";
      }, 1100);
    } catch (err) {
      console.error("Register client error:", err);
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {errorMessage && (
        <div
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.12)",
            color: "#f87171",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            padding: "0.85rem 1rem",
            borderRadius: "0.65rem",
            fontSize: "0.84rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            lineHeight: 1.4,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, color: "#ef4444" }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            color: "#4ade80",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            padding: "0.85rem 1rem",
            borderRadius: "0.65rem",
            fontSize: "0.84rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            lineHeight: 1.4,
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0, color: "#22c55e" }} />
          <span>{successMessage}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="full_name"
          style={{
            display: "block",
            marginBottom: "0.45rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.01em",
          }}
        >
          Nombre Completo
        </label>
        <div style={{ position: "relative" }}>
          <User
            size={17}
            style={{
              position: "absolute",
              left: "0.95rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.4)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            name="full_name"
            id="full_name"
            required
            autoComplete="name"
            placeholder="Tu nombre y apellido"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.82rem 1rem 0.82rem 2.65rem",
              borderRadius: "0.65rem",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "#ffffff",
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#D90416";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217, 4, 22, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          style={{
            display: "block",
            marginBottom: "0.45rem",
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.01em",
          }}
        >
          Correo Electrónico
        </label>
        <div style={{ position: "relative" }}>
          <Mail
            size={17}
            style={{
              position: "absolute",
              left: "0.95rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.4)",
              pointerEvents: "none",
            }}
          />
          <input
            type="email"
            name="email"
            id="email"
            required
            autoComplete="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.82rem 1rem 0.82rem 2.65rem",
              borderRadius: "0.65rem",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "#ffffff",
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#D90416";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217, 4, 22, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.45rem",
          }}
        >
          <label
            htmlFor="password"
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.01em",
            }}
          >
            Contraseña
          </label>
          <span style={{ fontSize: "0.72rem", color: "rgba(255, 255, 255, 0.45)" }}>
            Mínimo 6 caracteres
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <Lock
            size={17}
            style={{
              position: "absolute",
              left: "0.95rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255, 255, 255, 0.4)",
              pointerEvents: "none",
            }}
          />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.82rem 2.75rem 0.82rem 2.65rem",
              borderRadius: "0.65rem",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              color: "#ffffff",
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#D90416";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(217, 4, 22, 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
            style={{
              position: "absolute",
              right: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.45)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.55rem",
          width: "100%",
          padding: "0.92rem 1.25rem",
          marginTop: "0.45rem",
          backgroundColor: "#D90416",
          color: "#ffffff",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "0.65rem",
          fontWeight: 800,
          fontSize: "0.9rem",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.75 : 1,
          boxShadow: "0 8px 24px rgba(217, 4, 22, 0.32)",
          transition: "all 0.2s ease",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span>Creando cuenta...</span>
          </>
        ) : (
          <>
            <UserPlus size={18} />
            <span>Crear Cuenta Oficial</span>
          </>
        )}
      </button>
    </form>
  );
}
