"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Send,
  X,
  Lock,
  ShieldCheck,
  Download,
  CheckCircle2,
  Eye,
  Clock,
  CheckSquare,
  Square,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initiateBatchTransfer, cancelTransfer } from "./actions";
import { toast } from "sonner";
import QrPassModal from "@/components/tickets/QrPassModal";

export interface FrequentContact {
  name: string;
  email: string;
}

interface TicketCardProps {
  event: any;
  tickets: any[];
  eventDate: string;
  transferredOutCount?: number;
  frequentContacts?: FrequentContact[];
  onRefreshRequested?: () => void;
}

export default function TicketCard({
  event,
  tickets,
  eventDate,
  transferredOutCount = 0,
  frequentContacts = [],
  onRefreshRequested,
}: TicketCardProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTicketForPass, setSelectedTicketForPass] = useState<any | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedTicketIdsForTransfer, setSelectedTicketIdsForTransfer] = useState<string[]>([]);
  const [transferName, setTransferName] = useState("");
  const [transferEmail, setTransferEmail] = useState("");
  const [lastSentRecipient, setLastSentRecipient] = useState<{
    name: string;
    count: number;
  } | null>(null);

  const coverImage = event?.cover_image || event?.image_url;
  const eventStartDate = event?.start_date ? new Date(event.start_date) : null;
  const isWithin24Hours = eventStartDate
    ? eventStartDate.getTime() - Date.now() <= 24 * 60 * 60 * 1000
    : false;

  const activationDateStr = eventStartDate
    ? new Date(eventStartDate.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString(
        "es-CO",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : "24h antes del evento";

  const getPendingTransfer = (t: any) => {
    if (!t.ticket_transfers) return null;
    const transfers = Array.isArray(t.ticket_transfers)
      ? t.ticket_transfers
      : [t.ticket_transfers];
    return transfers.find((tr: any) => tr.status === "pending") || null;
  };

  const isCourtesyTicket = (t: any) =>
    Boolean(
      t.is_courtesy ||
        t.payment_provider === "courtesy" ||
        t.payment_provider === "free_event" ||
        (t.ticket_tiers && Number(t.ticket_tiers.price) === 0)
    );

  const transferableTickets = tickets.filter(
    (t) => t.status === "valid" && !getPendingTransfer(t) && !isCourtesyTicket(t)
  );

  useEffect(() => {
    const transferableSet = new Set(transferableTickets.map((t) => t.id));
    setSelectedTicketIdsForTransfer((prev) =>
      prev.filter((id) => transferableSet.has(id))
    );
  }, [tickets]);

  const totalInAccountCount = tickets.length;
  const inTransferCount = tickets.filter((t) => Boolean(getPendingTransfer(t))).length;
  const inPossessionCount = Math.max(0, totalInAccountCount - inTransferCount);
  const isEnabledOverall =
    isWithin24Hours || tickets.some((t: any) => t.qr_dispatched);

  const mapsQuery = encodeURIComponent(
    [event?.location_name, event?.location_address].filter(Boolean).join(", ")
  );

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTicketIdsForTransfer((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleSelectAllTransferable = () => {
    if (selectedTicketIdsForTransfer.length === transferableTickets.length) {
      setSelectedTicketIdsForTransfer([]);
    } else {
      setSelectedTicketIdsForTransfer(transferableTickets.map((t) => t.id));
    }
  };

  const openTransferModalForSingle = (ticket: any) => {
    setSelectedTicketIdsForTransfer([ticket.id]);
    setLastSentRecipient(null);
    setIsTransferModalOpen(true);
  };

  const openTransferModalForSelected = () => {
    if (selectedTicketIdsForTransfer.length === 0 && transferableTickets.length > 0) {
      setSelectedTicketIdsForTransfer([transferableTickets[0].id]);
    }
    setLastSentRecipient(null);
    setIsTransferModalOpen(true);
  };

  const handleInitiateTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedTicketIdsForTransfer.length === 0) {
      toast.error("Selecciona al menos una boleta para transferir.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await initiateBatchTransfer(
          selectedTicketIdsForTransfer,
          transferName,
          transferEmail
        );
        if (!res.success) {
          toast.error(res.error || "Hubo un error al iniciar la transferencia.");
          return;
        }
        const sentCount = res.count || selectedTicketIdsForTransfer.length;
        toast.success(
          sentCount > 1
            ? `¡${sentCount} boletas enviadas en transferencia a ${transferName}!`
            : `Transferencia iniciada para ${transferName}.`
        );
        setLastSentRecipient({ name: transferName, count: sentCount });
        setSelectedTicketIdsForTransfer([]);
        setTransferName("");
        setTransferEmail("");
        onRefreshRequested?.();
      } catch (err: any) {
        toast.error(err.message || "Hubo un error al iniciar la transferencia.");
      }
    });
  };

  const handleCancelTransfer = (transferId: string, shortId: string) => {
    startTransition(async () => {
      try {
        const res = await cancelTransfer(transferId);
        if (!res.success) {
          toast.error(res.error || "Error al cancelar la transferencia.");
          onRefreshRequested?.();
          return;
        }
        toast.success(
          `Transferencia cancelada. La boleta #${shortId} regresó a tu posesión.`
        );
        onRefreshRequested?.();
      } catch (err: any) {
        toast.error(err.message || "Error al cancelar la transferencia.");
      }
    });
  };

  const buildWhatsappHref = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://bassfactory.co";
    const text = encodeURIComponent(
      `¡Ey${lastSentRecipient?.name ? ` ${lastSentRecipient.name}` : ""}! Te envié ${
        (lastSentRecipient?.count || 1) > 1
          ? `${lastSentRecipient?.count} boletas`
          : "tu boleta"
      } para ${event?.title || "Bassfactory"} 🎟️🔥 Acéptala entrando a tu cuenta aquí: ${origin}/account/tickets`
    );
    return `https://wa.me/?text=${text}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* TOP EVENT HEADER (Home Scale) */}
        <div
          style={{
            padding: "1rem 1.15rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px dashed rgba(255, 255, 255, 0.12)",
            background:
              "linear-gradient(90deg, rgba(229, 9, 20, 0.08) 0%, rgba(0, 0, 0, 0.25) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0, flex: "1 1 280px" }}>
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "8px",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0,
                backgroundColor: "#09090b",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={event?.title || "Evento"}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="68px"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
              )}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "3px" }}>
                <span
                  style={{
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: "999px",
                    backgroundColor: isEnabledOverall
                      ? "rgba(34, 197, 94, 0.14)"
                      : "rgba(245, 158, 11, 0.14)",
                    border: `1px solid ${
                      isEnabledOverall
                        ? "rgba(34, 197, 94, 0.35)"
                        : "rgba(245, 158, 11, 0.35)"
                    }`,
                    color: isEnabledOverall ? "#4ade80" : "#fbbf24",
                  }}
                >
                  {isEnabledOverall
                    ? "● QR Habilitado"
                    : `🔒 Activa ${activationDateStr}`}
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#22c55e",
                  }}
                >
                  {inPossessionCount} en posesión
                </span>
                {inTransferCount > 0 && (
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b" }}>
                    · {inTransferCount} en transferencia
                  </span>
                )}
                {transferredOutCount > 0 && (
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#c084fc" }}>
                    · {transferredOutCount} transferida{transferredOutCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <h2
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "white",
                  lineHeight: 1.2,
                }}
              >
                {event?.title || "Evento Bassfactory"}
              </h2>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "4px",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} color="var(--color-magenta)" />
                  {eventDate}
                </span>
                {event?.location_name && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={12} color="var(--color-magenta)" />
                    {event.location_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {mapsQuery && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "0.42rem 0.75rem",
                  borderRadius: "7px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <MapPin size={13} color="var(--color-accent)" /> Cómo llegar
              </a>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: Ticket Rows & Batch Actions */}
        <div style={{ padding: "0.95rem 1.15rem" }}>
          {transferableTickets.length > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                Selecciona varias boletas si deseas transferirlas juntas:
              </span>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={toggleSelectAllTransferable}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "0.35rem 0.7rem",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "white",
                    borderRadius: "6px",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {selectedTicketIdsForTransfer.length === transferableTickets.length ? (
                    <>
                      <CheckSquare size={13} color="var(--color-magenta)" /> Quitar selección
                    </>
                  ) : (
                    <>
                      <Square size={13} /> Seleccionar todas ({transferableTickets.length})
                    </>
                  )}
                </button>

                {selectedTicketIdsForTransfer.length > 0 && (
                  <button
                    type="button"
                    onClick={openTransferModalForSelected}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "0.35rem 0.8rem",
                      backgroundColor: "var(--color-magenta)",
                      border: "none",
                      color: "white",
                      borderRadius: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Send size={13} /> Transferir ({selectedTicketIdsForTransfer.length})
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {tickets.map((ticket, index) => {
              const tier = Array.isArray(ticket.ticket_tiers)
                ? ticket.ticket_tiers[0]
                : ticket.ticket_tiers;
              const pendingTransfer = getPendingTransfer(ticket);
              const isEnabled =
                (isWithin24Hours || ticket.qr_dispatched) && !pendingTransfer;
              const shortId = ticket.id.slice(0, 8).toUpperCase();
              const isTransferable =
                ticket.status === "valid" &&
                !pendingTransfer &&
                !isCourtesyTicket(ticket);
              const isSelected = selectedTicketIdsForTransfer.includes(ticket.id);

              return (
                <div
                  key={ticket.id}
                  style={{
                    backgroundColor: isSelected
                      ? "rgba(229, 9, 20, 0.08)"
                      : pendingTransfer
                      ? "rgba(245, 158, 11, 0.04)"
                      : "rgba(0, 0, 0, 0.35)",
                    border: isSelected
                      ? "1px solid rgba(229, 9, 20, 0.45)"
                      : pendingTransfer
                      ? "1px solid rgba(245, 158, 11, 0.25)"
                      : "1px solid rgba(255, 255, 255, 0.07)",
                    borderRadius: "9px",
                    padding: "0.8rem 0.95rem",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.7rem",
                      minWidth: "210px",
                      flex: 1,
                    }}
                  >
                    {isTransferable && transferableTickets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => toggleTicketSelection(ticket.id)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          color: isSelected
                            ? "var(--color-magenta)"
                            : "rgba(255,255,255,0.4)",
                          display: "flex",
                        }}
                      >
                        {isSelected ? <CheckSquare size={17} /> : <Square size={17} />}
                      </button>
                    )}

                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            backgroundColor: "rgba(0, 240, 255, 0.12)",
                            border: "1px solid rgba(0, 240, 255, 0.28)",
                            color: "var(--color-accent)",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                          }}
                        >
                          {tier?.name || "General"}
                        </span>

                        {ticket.status === "scanned" && (
                          <span
                            style={{
                              backgroundColor: "rgba(34, 197, 94, 0.15)",
                              color: "#22c55e",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <CheckCircle2 size={11} /> INGRESADO
                          </span>
                        )}

                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontFamily: "monospace",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          Entrada #{index + 1} · #{shortId}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: "0.76rem",
                          marginTop: "3px",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {pendingTransfer ? (
                          <span style={{ color: "#fbbf24" }}>
                            <Clock size={12} style={{ display: "inline", marginRight: "4px" }} />
                            En transferencia para{" "}
                            <strong>
                              {pendingTransfer.to_name || pendingTransfer.to_email}
                            </strong>{" "}
                            (48h)
                          </span>
                        ) : (
                          <span>
                            Titular:{" "}
                            <strong style={{ color: "white" }}>
                              {ticket.assigned_name || "Tú (En posesión)"}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTicketForPass(ticket)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "0.42rem 0.8rem",
                        backgroundColor: isEnabled
                          ? "var(--color-magenta)"
                          : "rgba(255, 255, 255, 0.06)",
                        border: isEnabled
                          ? "none"
                          : "1px solid rgba(255, 255, 255, 0.12)",
                        color: "white",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isEnabled ? (
                        <>
                          <Eye size={13} /> Abrir QR
                        </>
                      ) : (
                        <>
                          <Lock size={12} color="#f59e0b" /> Ver Pase
                        </>
                      )}
                    </button>

                    {isEnabled && (
                      <a
                        href={`/api/tickets/${ticket.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`Boleta-${shortId}.pdf`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "0.42rem 0.75rem",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "white",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        <Download size={13} /> PDF
                      </a>
                    )}

                    {isTransferable && (
                      <button
                        type="button"
                        onClick={() => openTransferModalForSingle(ticket)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "0.42rem 0.75rem",
                          backgroundColor: "transparent",
                          border: "1px solid rgba(255,255,255,0.16)",
                          color: "rgba(255,255,255,0.9)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                        }}
                      >
                        <Send size={13} /> Transferir
                      </button>
                    )}

                    {pendingTransfer && (
                      <button
                        type="button"
                        onClick={() => handleCancelTransfer(pendingTransfer.id, shortId)}
                        disabled={isPending}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "0.42rem 0.75rem",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          color: "#ef4444",
                          borderRadius: "6px",
                          cursor: isPending ? "not-allowed" : "pointer",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                        }}
                      >
                        <X size={13} /> Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Unified Modo Taquilla QR Modal */}
      <QrPassModal
        isOpen={Boolean(selectedTicketForPass)}
        onClose={() => setSelectedTicketForPass(null)}
        ticket={selectedTicketForPass}
        event={event}
        eventDate={eventDate}
      />

      {/* Transfer Modal with Crew Chips + WhatsApp Share */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div
            onClick={() => setIsTransferModalOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              zIndex: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
              backdropFilter: "blur(6px)",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#111114",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "14px",
                padding: "1.35rem",
                width: "100%",
                maxWidth: "440px",
                maxHeight: "90vh",
                overflowY: "auto",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                style={{
                  position: "absolute",
                  top: "0.9rem",
                  right: "0.9rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>

              {lastSentRecipient ? (
                <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(34, 197, 94, 0.15)",
                      color: "#22c55e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 0.75rem",
                    }}
                  >
                    <CheckCircle2 size={26} />
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: 0 }}>
                    ¡Transferencia enviada!
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "0.4rem 0 1rem" }}>
                    Enviamos la invitación al correo de <strong>{lastSentRecipient.name}</strong>.
                    También puedes avisarle directo por WhatsApp:
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <a
                      href={buildWhatsappHref()}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "0.65rem 1rem",
                        borderRadius: "8px",
                        backgroundColor: "#22c55e",
                        color: "#052e16",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        textDecoration: "none",
                      }}
                    >
                      <MessageCircle size={16} /> Avisar por WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(false)}
                      style={{
                        padding: "0.55rem 1rem",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "white",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3
                    style={{
                      fontSize: "1.08rem",
                      fontWeight: 800,
                      marginBottom: "0.2rem",
                      color: "white",
                    }}
                  >
                    {selectedTicketIdsForTransfer.length > 1
                      ? `Transferir ${selectedTicketIdsForTransfer.length} boletas`
                      : "Transferir boleta"}
                  </h3>
                  <div
                    style={{
                      color: "var(--color-accent)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      marginBottom: "0.85rem",
                    }}
                  >
                    {event?.title || "Evento Bassfactory"}
                  </div>

                  {/* Frequent Crew 1-tap chips */}
                  {frequentContacts.length > 0 && (
                    <div style={{ marginBottom: "0.85rem" }}>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "var(--color-text-secondary)",
                          marginBottom: "0.4rem",
                        }}
                      >
                        Contactos frecuentes (1 toque)
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {frequentContacts.map((c) => (
                          <button
                            key={c.email}
                            type="button"
                            onClick={() => {
                              setTransferName(c.name);
                              setTransferEmail(c.email);
                            }}
                            style={{
                              padding: "0.3rem 0.65rem",
                              borderRadius: "999px",
                              backgroundColor:
                                transferEmail === c.email
                                  ? "rgba(229, 9, 20, 0.2)"
                                  : "rgba(255,255,255,0.05)",
                              border:
                                transferEmail === c.email
                                  ? "1px solid var(--color-magenta)"
                                  : "1px solid rgba(255,255,255,0.12)",
                              color: "white",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {transferableTickets.length > 1 && (
                    <div
                      style={{
                        marginBottom: "0.9rem",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        padding: "0.65rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.45rem",
                          fontSize: "0.74rem",
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "white" }}>
                          Boletas ({selectedTicketIdsForTransfer.length}/
                          {transferableTickets.length})
                        </span>
                        <button
                          type="button"
                          onClick={toggleSelectAllTransferable}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-accent)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {selectedTicketIdsForTransfer.length ===
                          transferableTickets.length
                            ? "Quitar todas"
                            : "Todas"}
                        </button>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.35rem",
                          maxHeight: "120px",
                          overflowY: "auto",
                        }}
                      >
                        {transferableTickets.map((t) => {
                          const checked = selectedTicketIdsForTransfer.includes(t.id);
                          const tier = Array.isArray(t.ticket_tiers)
                            ? t.ticket_tiers[0]
                            : t.ticket_tiers;
                          return (
                            <div
                              key={t.id}
                              onClick={() => toggleTicketSelection(t.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0.4rem 0.6rem",
                                borderRadius: "6px",
                                backgroundColor: checked
                                  ? "rgba(229, 9, 20, 0.14)"
                                  : "rgba(0,0,0,0.35)",
                                border: checked
                                  ? "1px solid rgba(229, 9, 20, 0.45)"
                                  : "1px solid rgba(255,255,255,0.06)",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                              }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "white" }}>
                                {checked ? (
                                  <CheckSquare size={14} color="var(--color-magenta)" />
                                ) : (
                                  <Square size={14} color="rgba(255,255,255,0.4)" />
                                )}
                                <span style={{ fontFamily: "monospace" }}>
                                  #{t.id.slice(0, 8).toUpperCase()}
                                </span>
                              </span>
                              <span style={{ fontSize: "0.7rem", color: "var(--color-accent)" }}>
                                {tier?.name || "General"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <form
                    onSubmit={handleInitiateTransfer}
                    style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginBottom: "0.3rem",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        Nombre del destinatario
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={transferName}
                        onChange={(e) => setTransferName(e.target.value)}
                        placeholder="Ej. Mauricio López"
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.16)",
                          backgroundColor: "rgba(0,0,0,0.45)",
                          color: "white",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginBottom: "0.3rem",
                          fontWeight: 600,
                          color: "rgba(255,255,255,0.85)",
                        }}
                      >
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        placeholder="amigo@gmail.com"
                        style={{
                          width: "100%",
                          padding: "0.6rem 0.75rem",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.16)",
                          backgroundColor: "rgba(0,0,0,0.45)",
                          color: "white",
                          fontSize: "0.85rem",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      Tendrá 48 horas para aceptar. En cuanto acepte, el QR se regenera a su
                      nombre y la boleta se descuenta de tu cuenta.
                    </div>

                    <button
                      type="submit"
                      disabled={isPending || selectedTicketIdsForTransfer.length === 0}
                      style={{
                        width: "100%",
                        padding: "0.7rem",
                        backgroundColor: "var(--color-magenta)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.84rem",
                        cursor:
                          isPending || selectedTicketIdsForTransfer.length === 0
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          isPending || selectedTicketIdsForTransfer.length === 0 ? 0.6 : 1,
                      }}
                    >
                      {isPending
                        ? "Enviando..."
                        : selectedTicketIdsForTransfer.length > 1
                        ? `Enviar ${selectedTicketIdsForTransfer.length} boletas`
                        : "Enviar transferencia"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
