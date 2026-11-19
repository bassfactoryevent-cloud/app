"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  Ticket,
  MapPin,
  Clock,
  X,
  ArrowRight,
  Bell,
  Check,
  ShoppingBag,
  Settings,
  User,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  acceptIncomingTransfersAction,
  rejectIncomingTransfersAction,
} from "@/app/(public)/account/tickets/actions";
import QrPassModal from "@/components/tickets/QrPassModal";
import type { AppNotification } from "@/utils/notifications";
import type { UserTicketsPayload } from "@/utils/userTickets";

interface RaverPassDrawerProps {
  ticketsData: UserTicketsPayload;
  notifications: AppNotification[];
}

function formatCountdown(targetIso?: string | null): string {
  if (!targetIso) return "";
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return "HOY";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}

export default function RaverPassDrawer({
  ticketsData,
  notifications,
}: RaverPassDrawerProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  // Set mounted + refresh countdown every 30s (avoids SSR/client Date.now() hydration mismatch)
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const incoming = ticketsData.incomingTransfers || [];
  const tickets = ticketsData.tickets || [];

  // Find the nearest upcoming (or active today) valid/scanned ticket
  const nowMinus12h = Date.now() - 12 * 60 * 60 * 1000;
  const upcomingTickets = tickets
    .map((t) => {
      const tier = Array.isArray(t.ticket_tiers)
        ? t.ticket_tiers[0]
        : t.ticket_tiers;
      const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      return { ticket: t, tier, event };
    })
    .filter(({ event }) => {
      if (!event?.start_date) return true;
      return new Date(event.start_date).getTime() >= nowMinus12h;
    })
    .sort((a, b) => {
      const da = a.event?.start_date ? new Date(a.event.start_date).getTime() : Infinity;
      const db = b.event?.start_date ? new Date(b.event.start_date).getTime() : Infinity;
      return da - db;
    });

  const nextItem = upcomingTickets[0] || null;
  const nextEvent = nextItem?.event || null;
  const nextTicket = nextItem?.ticket || null;
  const nextTier = nextItem?.tier || null;

  const isNextQrReady = Boolean(
    nextTicket &&
      (nextTicket.qr_dispatched ||
        (mounted &&
          nextEvent?.start_date &&
          new Date(nextEvent.start_date).getTime() - Date.now() <=
            24 * 60 * 60 * 1000))
  );

  const countdownLabel = mounted ? formatCountdown(nextEvent?.start_date) : "";
  const shortTitle = nextEvent?.title
    ? nextEvent.title.split(" ").slice(0, 2).join(" ")
    : "Mi Pase";

  const mapsQuery = nextEvent
    ? encodeURIComponent(
        [nextEvent.location_name, nextEvent.location_address]
          .filter(Boolean)
          .join(", ")
      )
    : "";

  const handleAccept = (ids: string[]) => {
    startTransition(async () => {
      const res = await acceptIncomingTransfersAction(ids);
      if (!res.success) {
        toast.error(res.error || "No se pudo aceptar la boleta.");
        return;
      }
      toast.success("¡Boleta aceptada y sumada a tu cuenta!");
      router.refresh();
    });
  };

  const handleReject = (ids: string[]) => {
    startTransition(async () => {
      const res = await rejectIncomingTransfersAction(ids);
      if (!res.success) {
        toast.error(res.error || "No se pudo rechazar.");
        return;
      }
      toast.info("Boleta devuelta al emisor.");
      router.refresh();
    });
  };

  const totalAlertCount = incoming.length + (notifications.length > 0 ? Math.min(notifications.length, 9) : 0);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        {/* Live Contextual Pill (only when user has upcoming ticket or incoming transfer) */}
        {(nextItem || incoming.length > 0) && (
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(false);
              setIsDrawerOpen(true);
            }}
            className="raver-live-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 8px",
              borderRadius: "999px",
              backgroundColor:
                incoming.length > 0
                  ? "rgba(0, 240, 255, 0.14)"
                  : "rgba(229, 9, 20, 0.16)",
              border:
                incoming.length > 0
                  ? "1px solid rgba(0, 240, 255, 0.5)"
                  : "1px solid rgba(229, 9, 20, 0.5)",
              color: "#FFFFFF",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            title="Abrir tu pase rápido sin salir de esta página"
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor:
                  incoming.length > 0
                    ? "#00F0FF"
                    : isNextQrReady
                    ? "#22c55e"
                    : "#E50914",
                boxShadow:
                  incoming.length > 0
                    ? "0 0 8px #00F0FF"
                    : isNextQrReady
                    ? "0 0 8px #22c55e"
                    : "0 0 8px #E50914",
                flexShrink: 0,
              }}
            />
            {incoming.length > 0 ? (
              <span>
                <span className="raver-pill-desktop">{incoming.length} por aceptar</span>
                <span className="raver-pill-mobile">{incoming.length}</span>
              </span>
            ) : (
              <>
                <span className="raver-pill-desktop">
                  {shortTitle}
                  {countdownLabel ? ` · ${countdownLabel}` : ""}
                </span>
                {countdownLabel && (
                  <span className="raver-pill-mobile">{countdownLabel.split(" ")[0]}</span>
                )}
                <span
                  style={{
                    backgroundColor: "var(--color-magenta)",
                    color: "#FFFFFF",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "2px 5px",
                    borderRadius: "4px",
                    letterSpacing: "0.04em",
                  }}
                >
                  QR
                </span>
              </>
            )}
          </button>
        )}

        {/* Global Notifications Bell */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((o) => !o)}
            aria-label="Notificaciones"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--glass-border)",
              color: "var(--color-text-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.2s ease",
            }}
          >
            <Bell size={16} />
            {totalAlertCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-3px",
                  right: "-3px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  borderRadius: "999px",
                  backgroundColor: incoming.length > 0 ? "#00F0FF" : "var(--color-magenta)",
                  color: incoming.length > 0 ? "#000" : "#fff",
                  fontSize: "0.62rem",
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1.5px solid #000",
                }}
              >
                {totalAlertCount > 9 ? "9+" : totalAlertCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: 0,
                  width: "300px",
                  backgroundColor: "#111114",
                  border: "1px solid var(--color-border)",
                  borderRadius: "12px",
                  boxShadow: "0 16px 40px rgba(0,0,0,0.85)",
                  padding: "0.75rem",
                  zIndex: 110,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: "0.5rem",
                    marginBottom: "0.5rem",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "white",
                    }}
                  >
                    Actividad Reciente
                  </span>
                  <Link
                    href="/account/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--color-magenta)",
                    }}
                  >
                    Ver todas →
                  </Link>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    maxHeight: "280px",
                    overflowY: "auto",
                  }}
                >
                  {incoming.map((tr: any) => (
                    <div
                      key={tr.id}
                      style={{
                        padding: "0.6rem",
                        borderRadius: "8px",
                        backgroundColor: "rgba(0, 240, 255, 0.08)",
                        border: "1px solid rgba(0, 240, 255, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {tr.sender_name} te envió 1 boleta
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-text-secondary)",
                          marginTop: "2px",
                        }}
                      >
                        {tr.event?.title} · {tr.tier_name}
                      </div>
                      <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleAccept([tr.id])}
                          style={{
                            flex: 1,
                            padding: "0.35rem",
                            borderRadius: "6px",
                            backgroundColor: "#00F0FF",
                            color: "#000",
                            border: "none",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            cursor: "pointer",
                          }}
                        >
                          Aceptar
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleReject([tr.id])}
                          style={{
                            padding: "0.35rem 0.6rem",
                            borderRadius: "6px",
                            backgroundColor: "transparent",
                            color: "#ef4444",
                            border: "1px solid rgba(239,68,68,0.4)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Rechazar
                        </button>
                      </div>
                    </div>
                  ))}

                  {notifications.slice(0, 4).map((n) => (
                    <Link
                      key={n.id}
                      href={n.actionHref}
                      onClick={() => setIsNotifOpen(false)}
                      style={{
                        display: "block",
                        padding: "0.55rem 0.65rem",
                        borderRadius: "8px",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        textDecoration: "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "white",
                          lineHeight: 1.3,
                        }}
                      >
                        {n.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--color-text-secondary)",
                          marginTop: "2px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {n.message}
                      </div>
                    </Link>
                  ))}

                  {incoming.length === 0 && notifications.length === 0 && (
                    <div
                      style={{
                        padding: "1.25rem",
                        textAlign: "center",
                        fontSize: "0.78rem",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      No tienes notificaciones nuevas.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Slide-Over Quick Access Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(6px)",
              zIndex: 115,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "380px",
                height: "100%",
                backgroundColor: "#0c0c0f",
                borderLeft: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "-16px 0 48px rgba(0,0,0,0.8)",
              }}
            >
              {/* Drawer Header */}
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background:
                    "linear-gradient(90deg, rgba(229, 9, 20, 0.14) 0%, transparent 100%)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.88rem",
                      fontWeight: 800,
                      color: "white",
                      fontFamily: "Outfit, sans-serif",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Acceso Rápido · Tu Cuenta
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Sin salir de la página actual
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer Body */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Incoming Transfers Alert */}
                {incoming.length > 0 && (
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "10px",
                      backgroundColor: "rgba(0, 240, 255, 0.08)",
                      border: "1px solid rgba(0, 240, 255, 0.35)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.6rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: "#00F0FF",
                        textTransform: "uppercase",
                      }}
                    >
                      <Inbox size={14} />
                      <span>
                        {incoming.length}{" "}
                        {incoming.length === 1
                          ? "boleta recibida pendiente"
                          : "boletas recibidas pendientes"}
                      </span>
                    </div>
                    {incoming.map((tr: any) => (
                      <div
                        key={tr.id}
                        style={{
                          padding: "0.6rem",
                          borderRadius: "8px",
                          backgroundColor: "rgba(0,0,0,0.45)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "white" }}>
                          {tr.event?.title}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--color-text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          De: <strong style={{ color: "white" }}>{tr.sender_name}</strong> ·{" "}
                          {tr.tier_name}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.55rem" }}>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleAccept([tr.id])}
                            style={{
                              flex: 1,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "0.45rem",
                              borderRadius: "6px",
                              backgroundColor: "#22c55e",
                              color: "#052e16",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            <Check size={14} /> Aceptar
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleReject([tr.id])}
                            style={{
                              padding: "0.45rem 0.7rem",
                              borderRadius: "6px",
                              backgroundColor: "transparent",
                              border: "1px solid rgba(239,68,68,0.4)",
                              color: "#ef4444",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Next Event Pass */}
                {nextItem ? (
                  <div
                    style={{
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "0.85rem",
                        display: "flex",
                        gap: "0.75rem",
                        alignItems: "center",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {nextEvent?.cover_image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={nextEvent.cover_image}
                          alt={nextEvent.title}
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "7px",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              color: isNextQrReady ? "#4ade80" : "var(--color-accent)",
                            }}
                          >
                            {isNextQrReady ? "● QR Habilitado" : "Próximo Evento"}
                          </span>
                          {countdownLabel && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontFamily: "monospace",
                                fontWeight: 700,
                                color: "white",
                              }}
                            >
                              {countdownLabel}
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 800,
                            color: "white",
                            marginTop: "2px",
                            lineHeight: 1.2,
                          }}
                        >
                          {nextEvent?.title || "Evento Bassfactory"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--color-text-secondary)",
                            marginTop: "3px",
                          }}
                        >
                          {nextTier?.name || "General"} · #{nextTicket.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "0.75rem 0.85rem",
                        display: "grid",
                        gridTemplateColumns: mapsQuery ? "1fr 1fr" : "1fr",
                        gap: "0.5rem",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setQrModalOpen(true);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "7px",
                          backgroundColor: "var(--color-magenta)",
                          color: "white",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <QrCode size={14} /> Abrir Pase QR
                      </button>
                      {mapsQuery && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "0.55rem 0.75rem",
                            borderRadius: "7px",
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
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "1rem",
                      borderRadius: "10px",
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      fontSize: "0.8rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    No tienes eventos próximos en tu cuenta todavía.
                  </div>
                )}

                {/* Quick Navigation into Account */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-secondary)",
                      paddingLeft: "2px",
                    }}
                  >
                    Tu Cuenta
                  </div>

                  {[
                    {
                      href: "/account",
                      label: "Resumen de Cuenta",
                      icon: <User size={15} />,
                    },
                    {
                      href: "/account/tickets",
                      label: `Mis Tickets (${tickets.length})`,
                      icon: <Ticket size={15} />,
                    },
                    {
                      href: "/account/orders",
                      label: "Mis Compras y Facturas",
                      icon: <ShoppingBag size={15} />,
                    },
                    {
                      href: "/account/settings",
                      label: "Ajustes de Perfil",
                      icon: <Settings size={15} />,
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.65rem 0.85rem",
                        borderRadius: "8px",
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "white",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {item.icon}
                        {item.label}
                      </span>
                      <ArrowRight size={14} style={{ opacity: 0.5 }} />
                    </Link>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Global Modo Taquilla QR Modal */}
      <QrPassModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        ticket={nextTicket}
        event={nextEvent}
      />

      <style jsx>{`
        .raver-pill-mobile {
          display: none;
        }
        @media (max-width: 768px) {
          .raver-pill-desktop {
            display: none;
          }
          .raver-pill-mobile {
            display: inline;
            font-family: monospace;
            font-size: 0.68rem;
          }
        }
      `}</style>
    </>
  );
}
