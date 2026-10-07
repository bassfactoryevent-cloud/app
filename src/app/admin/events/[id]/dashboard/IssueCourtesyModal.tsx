"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Ticket,
  ShieldCheck,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Users
} from "lucide-react";
import { issueCourtesyTickets } from "./actions";
import { toast } from "sonner";

interface IssueCourtesyModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  tiers: any[];
  onCourtesyIssued?: () => void;
}

export function IssueCourtesyModal({
  isOpen,
  onClose,
  event,
  tiers,
  onCourtesyIssued
}: IssueCourtesyModalProps) {
  const [selectedTierId, setSelectedTierId] = useState(tiers[0]?.id || "");
  const [reason, setReason] = useState("Patrocinador");
  const [reasonNote, setReasonNote] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [lockUntilEvent, setLockUntilEvent] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTier = tiers.find((t) => t.id === selectedTierId) || tiers[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim() || !recipientEmail.trim()) {
      toast.error("Por favor completa el nombre y el correo electrónico del titular.");
      return;
    }

    if (!selectedTierId) {
      toast.error("Por favor selecciona una localidad de boleta.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await issueCourtesyTickets({
        eventId: event.id,
        tierId: selectedTierId,
        recipientName,
        recipientEmail,
        quantity,
        reason,
        reasonNote,
        lockUntilEvent,
        sendEmail
      });

      if (res.success) {
        toast.success(
          `¡Éxito! Se han emitido ${res.count} cortesía(s) para ${recipientName}.`
        );
        onClose();
        if (onCourtesyIssued) {
          onCourtesyIssued();
        } else {
          window.location.reload();
        }
      } else {
        toast.error(res.error || "Ocurrió un error al emitir las cortesías.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)"
          }}
        >
          <div onClick={onClose} style={{ position: "absolute", inset: 0 }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "580px",
              backgroundColor: "rgba(18, 18, 24, 0.98)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "1.25rem",
              boxShadow: "0 25px 60px -10px rgba(0, 0, 0, 0.85)",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(90deg, rgba(236, 72, 153, 0.08) 0%, transparent 100%)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(236, 72, 153, 0.15)",
                    border: "1px solid rgba(236, 72, 153, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-magenta, #ec4899)"
                  }}
                >
                  <Ticket size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#FFFFFF" }}>
                    Emitir Entradas de Cortesía
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.6)" }}>
                    {event.title} • Valor $0 COP (No afecta ingresos comerciales)
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "6px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {/* Localidad & Cantidad */}
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.35rem" }}>
                      Localidad de la Boleta *
                    </label>
                    <select
                      value={selectedTierId}
                      onChange={(e) => setSelectedTierId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        outline: "none"
                      }}
                    >
                      {tiers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Ref: ${Number(t.price || 0).toLocaleString("es-CO")} COP)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.35rem" }}>
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                {/* Motivo & Referencia */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.35rem" }}>
                      Motivo / Clasificación *
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        outline: "none"
                      }}
                    >
                      <option value="Patrocinador">🤝 Patrocinador / Marca</option>
                      <option value="Invitado VIP">🌟 Invitado VIP / Dirección</option>
                      <option value="Prensa / Medios">📻 Prensa / Medios / Radio</option>
                      <option value="Artistas / DJs">🎧 Artistas / DJs / Booking</option>
                      <option value="Staff / Logística">🛡️ Staff / Producción / Logística</option>
                      <option value="Concurso / Sorteo">🎁 Concurso / Giveaway</option>
                      <option value="Otro">🏷️ Otro Motivo</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.35rem" }}>
                      Detalle o Empresa (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Heineken Gerencia, RCN Radio..."
                      value={reasonNote}
                      onChange={(e) => setReasonNote(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                {/* Destinatario: Nombre & Correo */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.35rem" }}>
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre y Apellidos"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.35rem" }}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "0.6rem",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                {/* Antifraude QR Security Lock Box */}
                <div
                  style={{
                    padding: "0.9rem 1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: lockUntilEvent ? "rgba(245, 158, 11, 0.08)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${lockUntilEvent ? "rgba(245, 158, 11, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem"
                  }}
                >
                  <input
                    type="checkbox"
                    id="lockUntilEventCheckbox"
                    checked={lockUntilEvent}
                    onChange={(e) => setLockUntilEvent(e.target.checked)}
                    style={{ marginTop: "3px", width: "16px", height: "16px", accentColor: "var(--color-magenta)" }}
                  />
                  <label htmlFor="lockUntilEventCheckbox" style={{ cursor: "pointer", fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4 }}>
                    <strong style={{ color: "#fcd34d", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Lock size={13} /> Bloquear código QR hasta 24h antes del evento (Recomendado Antifraude)
                    </strong>
                    <span style={{ fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.55)", display: "block", marginTop: "2px" }}>
                      El invitado verá su boleta confirmada y podrá transferirla a un amigo, pero el código QR digital no se expondrá hasta la fecha del evento para evitar reventa o clonación.
                    </span>
                  </label>
                </div>

                {/* Send Email Checkbox */}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.6rem",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <input
                    type="checkbox"
                    id="sendEmailCheckbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-magenta)" }}
                  />
                  <label htmlFor="sendEmailCheckbox" style={{ cursor: "pointer", fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.85)" }}>
                    <Mail size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />
                    Enviar correo oficial de invitación al destinatario automáticamente
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)"
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  style={{
                    padding: "0.65rem 1.1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0.65rem 1.4rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "var(--color-magenta, #ec4899)",
                    border: "none",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(236, 72, 153, 0.35)",
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  <Sparkles size={16} />
                  {isSubmitting ? "Emitiendo..." : `Emitir ${quantity} Entrada${quantity > 1 ? "s" : ""} de Cortesía`}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
