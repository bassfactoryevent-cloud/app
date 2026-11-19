"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  MapPin,
  Calendar,
  Lock,
  CheckCircle2,
  Sun,
  ShieldCheck,
  Radio,
  Users,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { getLiveTicketStatusAction } from "@/app/(public)/account/tickets/actions";

interface QrPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any | null;
  event: any | null;
  eventDate?: string;
}

export default function QrPassModal({
  isOpen,
  onClose,
  ticket,
  event,
  eventDate,
}: QrPassModalProps) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string>(ticket?.status || "valid");
  const [liveScannedAt, setLiveScannedAt] = useState<string | null>(
    ticket?.scanned_at || null
  );
  const [liveRaversInside, setLiveRaversInside] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (ticket) {
      setLiveStatus(ticket.status || "valid");
      setLiveScannedAt(ticket.scanned_at || null);
    }
  }, [ticket]);

  // Realtime + 2.5s High-Frequency Sync while modal is open at the door
  useEffect(() => {
    if (!isOpen || !ticket?.id) return;

    let active = true;
    const supabase = createClient();

    const triggerCheckInCelebration = () => {
      if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
        try {
          navigator.vibrate([100, 40, 120]);
        } catch {}
      }
      toast.success("🔥 ¡ACCESO VERIFICADO! Estás en la Rave — Bienvenido a Bassfactory.");
    };

    const syncStatus = async () => {
      try {
        const res = await getLiveTicketStatusAction(ticket.id);
        if (!active || !res.success) return;
        if (typeof res.liveAttendeeCount === "number") {
          setLiveRaversInside(res.liveAttendeeCount);
        }
        if (res.status) {
          setLiveStatus((prev) => {
            if (prev !== "scanned" && res.status === "scanned") {
              triggerCheckInCelebration();
              if (typeof window !== "undefined") {
                window.dispatchEvent(
                  new CustomEvent("ticket_scanned_live", {
                    detail: { ticketId: ticket.id, scanned_at: res.scanned_at },
                  })
                );
              }
            }
            return res.status!;
          });
        }
        if (res.scanned_at) {
          setLiveScannedAt(res.scanned_at);
        }
      } catch {}
    };

    syncStatus();

    const channel = supabase
      .channel(`qr-pass-live-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        (payload) => {
          const next = payload.new as any;
          if (!next) return;
          if (next.status === "scanned") {
            setLiveStatus((prev) => {
              if (prev !== "scanned") {
                triggerCheckInCelebration();
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("ticket_scanned_live", {
                      detail: { ticketId: ticket.id, scanned_at: next.scanned_at },
                    })
                  );
                }
              }
              return "scanned";
            });
            if (next.scanned_at) setLiveScannedAt(next.scanned_at);
            syncStatus();
          }
        }
      )
      .subscribe();

    const timer = setInterval(syncStatus, 2500);

    return () => {
      active = false;
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [isOpen, ticket?.id]);

  const eventStartDate = event?.start_date ? new Date(event.start_date) : null;
  const isWithin24Hours = eventStartDate
    ? eventStartDate.getTime() - Date.now() <= 24 * 60 * 60 * 1000
    : false;
  const isEnabled = Boolean(ticket && (isWithin24Hours || ticket.qr_dispatched));
  const isScanned = liveStatus === "scanned" || ticket?.status === "scanned";

  useEffect(() => {
    if (!isOpen || !ticket?.qr_hash || !isEnabled) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(ticket.qr_hash, {
      margin: 1,
      width: 260,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch((err) => console.error("Error generating QR:", err));
  }, [isOpen, ticket, isEnabled]);

  // Wake Lock API to keep screen bright & awake in the club queue
  useEffect(() => {
    if (!isOpen) {
      setWakeLockActive(false);
      return;
    }
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (navigator as any).wakeLock.request("screen");
          setWakeLockActive(true);
        }
      } catch {
        setWakeLockActive(false);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen]);

  if (!ticket || !mounted) return null;

  const coverImage = event?.cover_image || event?.image_url;
  const shortId = ticket.id?.slice(0, 8).toUpperCase() || "";
  const tier = Array.isArray(ticket.ticket_tiers)
    ? ticket.ticket_tiers[0]
    : ticket.ticket_tiers;

  const formattedDate =
    eventDate ||
    (eventStartDate
      ? eventStartDate.toLocaleDateString("es-CO", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Fecha por confirmar");

  const mapsQuery = encodeURIComponent(
    [event?.location_name, event?.location_address].filter(Boolean).join(", ")
  );

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            height: "100dvh",
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(10px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "400px",
              backgroundColor: "#111114",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              borderRadius: "14px",
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.85)",
            }}
          >
            {/* Top Status Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(0,0,0,0.5)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: isScanned
                      ? "#00F0FF"
                      : isEnabled
                      ? "#22c55e"
                      : "#f59e0b",
                    boxShadow: isScanned
                      ? "0 0 8px #00F0FF"
                      : isEnabled
                      ? "0 0 8px #22c55e"
                      : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "white",
                  }}
                >
                  {isScanned
                    ? "Check-In Confirmado"
                    : isEnabled
                    ? "Modo Taquilla · QR Activo"
                    : "Antifraude · Programado"}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "6px",
                  color: "rgba(255,255,255,0.75)",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Event Header */}
            <div style={{ padding: "1rem" }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "#18181B",
                  padding: "0.85rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                {coverImage && (
                  <div
                    style={{
                      position: "relative",
                      width: "56px",
                      height: "56px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={coverImage}
                      alt={event?.title || "Evento"}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="56px"
                    />
                  </div>
                )}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "rgba(0, 240, 255, 0.14)",
                      color: "#00F0FF",
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                    }}
                  >
                    {tier?.name || "Localidad General"}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.95rem",
                      fontWeight: 800,
                      color: "white",
                      lineHeight: 1.2,
                    }}
                  >
                    {event?.title || "Evento Bassfactory"}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.72rem",
                      color: "var(--color-text-secondary)",
                      marginTop: "4px",
                    }}
                  >
                    <Calendar size={12} color="var(--color-magenta)" />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formattedDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* QR Stage */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.75rem 0",
                }}
              >
                {isScanned ? (
                  <div
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      background:
                        "linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(34, 197, 94, 0.14) 100%)",
                      border: "1px solid rgba(0, 240, 255, 0.45)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "1.25rem 1rem",
                      boxShadow: "0 0 32px rgba(0, 240, 255, 0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        backgroundColor: "rgba(0, 240, 255, 0.18)",
                        border: "1px solid rgba(0, 240, 255, 0.45)",
                        color: "#00F0FF",
                        fontSize: "0.66rem",
                        fontWeight: 900,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        marginBottom: "0.65rem",
                      }}
                    >
                      <Radio size={12} /> EN LA RAVE EN ESTE MOMENTO
                    </div>

                    <CheckCircle2 size={44} color="#22c55e" />

                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "white",
                        marginTop: "0.5rem",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ¡Ya estás adentro de la fiesta!
                    </div>

                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#86efac",
                        marginTop: "0.25rem",
                        fontWeight: 600,
                      }}
                    >
                      Check-in verificado en puerta
                      {liveScannedAt || ticket.scanned_at
                        ? ` · ${new Date(
                            liveScannedAt || ticket.scanned_at
                          ).toLocaleTimeString("es-CO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : ""}
                    </div>

                    {liveRaversInside > 0 && (
                      <div
                        style={{
                          marginTop: "0.85rem",
                          padding: "0.45rem 0.85rem",
                          borderRadius: "8px",
                          backgroundColor: "rgba(0, 0, 0, 0.45)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.74rem",
                          color: "white",
                          fontWeight: 700,
                        }}
                      >
                        <Users size={14} color="#00F0FF" />
                        <span>
                          <strong style={{ color: "#00F0FF" }}>
                            {liveRaversInside}
                          </strong>{" "}
                          {liveRaversInside === 1
                            ? "raver activo en sala ahora"
                            : "ravers activos en sala ahora"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : isEnabled ? (
                  <>
                    <div
                      style={{
                        backgroundColor: "#FFFFFF",
                        padding: "12px",
                        borderRadius: "12px",
                        boxShadow: "0 0 28px rgba(255,255,255,0.12)",
                      }}
                    >
                      {qrUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrUrl}
                          alt={`QR ${shortId}`}
                          style={{
                            width: "190px",
                            height: "190px",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "190px",
                            height: "190px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#111",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                          }}
                        >
                          Generando QR...
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: "0.65rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.72rem",
                        color: "#4ade80",
                        fontWeight: 700,
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>Presenta este código al staff en puerta</span>
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      width: "210px",
                      height: "210px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "1rem",
                    }}
                  >
                    <Lock size={32} color="#f59e0b" />
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 800,
                        color: "#fde68a",
                        marginTop: "0.65rem",
                      }}
                    >
                      QR Protegido
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-text-secondary)",
                        marginTop: "0.25rem",
                        lineHeight: 1.4,
                      }}
                    >
                      Se activa el{" "}
                      <strong style={{ color: "white" }}>{activationDateStr}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Meta */}
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.65rem 0.75rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                }}
              >
                <div>
                  <span style={{ color: "var(--color-text-secondary)" }}>Titular: </span>
                  <strong style={{ color: "white" }}>
                    {ticket.assigned_name || "En tu posesión"}
                  </strong>
                </div>
                <span
                  style={{
                    fontFamily: "monospace",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  #{shortId}
                </span>
              </div>

              {/* Quick Actions */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isEnabled ? "1fr 1fr" : "1fr",
                  gap: "0.5rem",
                  marginTop: "0.75rem",
                }}
              >
                {isEnabled && (
                  <a
                    href={`/api/tickets/${ticket.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Boleta-${shortId}.pdf`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "0.55rem 0.8rem",
                      borderRadius: "8px",
                      backgroundColor: "var(--color-magenta)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <Download size={14} /> Descargar PDF
                  </a>
                )}

                {mapsQuery ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "0.55rem 0.8rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <MapPin size={14} color="var(--color-accent)" /> Cómo llegar
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      toast.info(
                        wakeLockActive
                          ? "Pantalla activa para escaneo rápido en taquilla."
                          : "Sube el brillo de tu celular para escanear más rápido."
                      )
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "0.55rem 0.8rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Sun size={14} color="#f59e0b" />{" "}
                    {wakeLockActive ? "Pantalla Activa" : "Tip Brillo"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
