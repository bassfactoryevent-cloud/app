"use client";

import React, { useState } from "react";
import { LogIn, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export function LoginForm({ initialMessage }: { initialMessage?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialMessage || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Credenciales incorrectas. Verifica tus datos.");
        setIsLoading(false);
        return;
      }

      // Hard redirect to ensure new cookies and session are read fresh
      window.location.href = data.redirectUrl || "/account";
    } catch (err) {
      console.error("Login client error:", err);
      setErrorMessage("Error de conexión. Inténtalo de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
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
          gap: "0.6rem",
          lineHeight: 1.4
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, color: "#ef4444" }} />
          <span>{errorMessage}</span>
        </div>
      )}

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
            outline: "none",
            transition: "border-color 0.2s"
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-magenta, #D90416)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
        />
      </div>

      <div>
        <label htmlFor="password" style={{ display: "block", marginBottom: "0.45rem", fontSize: "0.85rem", fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>
          Contraseña
        </label>
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            id="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.8rem 2.75rem 0.8rem 1rem",
              borderRadius: "0.55rem",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              color: "#ffffff",
              fontSize: "0.9rem",
              outline: "none",
              transition: "border-color 0.2s"
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-magenta, #D90416)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
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
              alignItems: "center"
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
          opacity: isLoading ? 0.75 : 1,
          transition: "opacity 0.2s, transform 0.1s"
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={19} className="animate-spin" />
            <span>Iniciando sesión...</span>
          </>
        ) : (
          <>
            <LogIn size={19} />
            <span>Iniciar Sesión</span>
          </>
        )}
      </button>
    </form>
  );
}
