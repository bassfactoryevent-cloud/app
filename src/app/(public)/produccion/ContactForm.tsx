"use client";

import React, { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertCircle } from "lucide-react";

const SERVICES = [
  "Asesoría y consultoría (crear mi evento desde cero)",
  "Producción técnica (sonido, luces, escenario)",
  "Acompañamiento integral (de la idea al día del evento)",
  "Boletería QR y control de acceso",
  "Booking de artistas / DJs",
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.72rem 0.9rem",
  borderRadius: "0.6rem",
  border: "1px solid rgba(255,255,255,0.12)",
  backgroundColor: "rgba(0,0,0,0.5)",
  color: "#fff",
  fontSize: "0.88rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.76rem",
  fontWeight: 700,
  color: "rgba(255,255,255,0.8)",
  marginBottom: "0.35rem",
};

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    service: SERVICES[0],
    eventType: "",
    attendance: "",
    budget: "",
    date: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error al enviar");
      setStatus("ok");
    } catch (err: any) {
      setError(err.message || "Error al enviar");
      setStatus("error");
    }
  };

  if (status === "ok") {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
        <CheckCircle2 size={44} style={{ color: "#22c55e", marginBottom: "0.75rem" }} />
        <h3 style={{ fontSize: "1.2rem", margin: "0 0 0.4rem" }}>¡Solicitud enviada!</h3>
        <p style={{ fontSize: "0.86rem", color: "rgba(255,255,255,0.7)", margin: 0 }}>
          Nuestro equipo de producción te contactará en menos de 48 horas hábiles. Revisa tu correo.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      {status === "error" && (
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.75rem 0.9rem", borderRadius: "0.6rem", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.82rem" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.8rem" }}>
        <div>
          <label style={labelStyle}>Nombre completo *</label>
          <input required value={form.name} onChange={set("name")} style={inputStyle} placeholder="Tu nombre" />
        </div>
        <div>
          <label style={labelStyle}>Correo electrónico *</label>
          <input required type="email" value={form.email} onChange={set("email")} style={inputStyle} placeholder="tu@correo.com" />
        </div>
        <div>
          <label style={labelStyle}>Teléfono / WhatsApp</label>
          <input value={form.phone} onChange={set("phone")} style={inputStyle} placeholder="+57 300 000 0000" />
        </div>
        <div>
          <label style={labelStyle}>Ciudad</label>
          <input value={form.city} onChange={set("city")} style={inputStyle} placeholder="Medellín, Bogotá..." />
        </div>
      </div>

      <div>
        <label style={labelStyle}>¿Qué necesitas?</label>
        <select value={form.service} onChange={set("service")} style={inputStyle}>
          {SERVICES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.8rem" }}>
        <div>
          <label style={labelStyle}>Tipo de evento</label>
          <input value={form.eventType} onChange={set("eventType")} style={inputStyle} placeholder="Club, festival, open air..." />
        </div>
        <div>
          <label style={labelStyle}>Aforo estimado</label>
          <select value={form.attendance} onChange={set("attendance")} style={inputStyle}>
            <option value="">Seleccionar</option>
            <option>Menos de 300</option>
            <option>300 – 1.000</option>
            <option>1.000 – 5.000</option>
            <option>Más de 5.000</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Presupuesto aprox.</label>
          <select value={form.budget} onChange={set("budget")} style={inputStyle}>
            <option value="">Seleccionar</option>
            <option>Aún no lo sé</option>
            <option>Menos de $20M COP</option>
            <option>$20M – $80M COP</option>
            <option>$80M – $250M COP</option>
            <option>Más de $250M COP</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Fecha tentativa</label>
          <input type="date" value={form.date} onChange={set("date")} style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Cuéntanos tu idea *</label>
        <textarea required rows={4} value={form.message} onChange={set("message")} style={{ ...inputStyle, resize: "vertical" }} placeholder="Concepto, artistas que te gustaría, locación, en qué etapa estás..." />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.85rem 1rem", borderRadius: "0.6rem", background: "#D90416", color: "#fff", border: "none", fontWeight: 800, fontSize: "0.86rem", letterSpacing: "0.03em", textTransform: "uppercase", cursor: status === "loading" ? "wait" : "pointer", boxShadow: "0 8px 22px rgba(217,4,22,0.32)", opacity: status === "loading" ? 0.75 : 1 }}
      >
        {status === "loading" ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        {status === "loading" ? "Enviando..." : "Solicitar asesoría gratuita"}
      </button>
    </form>
  );
}
