"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket,
  ShoppingBag,
  Bell,
  Clock,
  CheckCircle2,
  ArrowRight,
  QrCode,
  MapPin,
  Calendar,
  Inbox,
  Check,
  X,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import QrPassModal from "@/components/tickets/QrPassModal";
import {
  acceptIncomingTransfersAction,
  rejectIncomingTransfersAction,
} from "./tickets/actions";
import type { UserTicketsPayload } from "@/utils/userTickets";

interface AccountOverviewClientProps {
  ticketsData: UserTicketsPayload;
  ordersCount: number;
  notificationsCount: number;
  recentOrders: any[];
  upcomingEvents: any[];
  favoriteGenres?: string[];
  followedDjs?: string[];
}

function getCountdownText(iso?: string | null): string {
  if (!iso) return "";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "En curso / Hoy";
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  if (d > 0) return `Faltan ${d}d ${h}h ${m}m`;
  return `Faltan ${h}h ${m}m`;
}

export default function AccountOverviewClient({
  ticketsData,
  ordersCount,
  notificationsCount,
  recentOrders,
  upcomingEvents,
  favoriteGenres = [],
  followedDjs = [],
}: AccountOverviewClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [qrOpen, setQrOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const incoming = ticketsData.incomingTransfers || [];
  const tickets = ticketsData.tickets || [];

  // Find next upcoming ticket
  const nowMinus12h = Date.now() - 12 * 60 * 60 * 1000;
  const upcomingTickets = tickets
    .map((t) => {
      const tier = Array.isArray(t.ticket_tiers)
        ? t.ticket_tiers[0]
        : t.ticket_tiers;
      const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      return { ticket: t, tier, event };
    })
    .filter(({ event }) =>
      event?.start_date ? new Date(event.start_date).getTime() >= nowMinus12h : true
    )
    .sort((a, b) => {
      const da = a.event?.start_date
        ? new Date(a.event.start_date).getTime()
        : Infinity;
      const db = b.event?.start_date
        ? new Date(b.event.start_date).getTime()
        : Infinity;
      return da - db;
    });

  const nextItem = upcomingTickets[0] || null;
  const nextEvent = nextItem?.event || null;
  const nextTicket = nextItem?.ticket || null;
  const nextTier = nextItem?.tier || null;

  const isNextQrReady = Boolean(
    nextTicket &&
      (nextTicket.qr_dispatched ||
        (nextEvent?.start_date &&
          new Date(nextEvent.start_date).getTime() - Date.now() <=
            24 * 60 * 60 * 1000))
  );

  const nextEventTicketsCount = nextEvent
    ? upcomingTickets.filter((x) => x.event?.id === nextEvent.id).length
    : 0;

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
        toast.error(res.error || "Error al aceptar boleta.");
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
        toast.error(res.error || "Error al rechazar boleta.");
        return;
      }
      toast.info("Boleta devuelta al emisor.");
      router.refresh();
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. PRIORITY ACTION: Incoming Transfers (if any) */}
      {incoming.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(0, 240, 255, 0.07)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            borderRadius: "12px",
            padding: "1rem 1.15rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0, 240, 255, 0.15)",
                  color: "var(--color-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Inbox size={18} />
              </div>
              <div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "white" }}>
                  Tienes {incoming.length}{" "}
                  {incoming.length === 1
                    ? "boleta recibida por aceptar"
                    : "boletas recibidas por aceptar"}
                </div>
                <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)" }}>
                  Acéptalas para sumarlas a tu cuenta inmediatamente.
                </div>
              </div>
            </div>
            {incoming.length > 1 && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleAccept(incoming.map((tr: any) => tr.id))}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "7px",
                  backgroundColor: "#22c55e",
                  color: "#052e16",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Aceptar todas ({incoming.length})
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {incoming.map((tr: any) => (
              <div
                key={tr.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ fontSize: "0.82rem" }}>
                  <strong style={{ color: "white" }}>{tr.event?.title}</strong>
                  <span style={{ color: "var(--color-accent)", marginLeft: "8px", fontSize: "0.74rem", fontWeight: 700 }}>
                    {tr.tier_name}
                  </span>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    Enviada por <strong style={{ color: "white" }}>{tr.sender_name}</strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.45rem" }}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReject([tr.id])}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.4rem 0.7rem",
                      borderRadius: "6px",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(239,68,68,0.4)",
                      color: "#ef4444",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <X size={13} /> Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAccept([tr.id])}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "6px",
                      backgroundColor: "var(--color-magenta)",
                      border: "none",
                      color: "white",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Check size={13} /> Aceptar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. NEXT EVENT HERO CARD (Home Scale) */}
      {nextItem ? (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            overflow: "hidden",
            display: "flex",
            flexWrap: "wrap",
          }}
        >
          {/* Left Cover Thumbnail */}
          <div
            style={{
              width: "180px",
              minHeight: "170px",
              position: "relative",
              flexShrink: 0,
              backgroundColor: "#09090b",
            }}
            className="next-event-cover"
          >
            {nextEvent?.cover_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={nextEvent.cover_image}
                alt={nextEvent.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                <Ticket size={36} />
              </div>
            )}
          </div>

          {/* Right Event Info & Actions */}
          <div
            style={{
              flex: 1,
              minWidth: "260px",
              padding: "1rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "0.85rem",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                  marginBottom: "0.35rem",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: isNextQrReady ? "#4ade80" : "var(--color-accent)",
                    backgroundColor: isNextQrReady
                      ? "rgba(34, 197, 94, 0.12)"
                      : "rgba(0, 240, 255, 0.1)",
                    border: `1px solid ${
                      isNextQrReady
                        ? "rgba(34, 197, 94, 0.3)"
                        : "rgba(0, 240, 255, 0.25)"
                    }`,
                    padding: "2px 8px",
                    borderRadius: "999px",
                  }}
                >
                  {isNextQrReady ? "● QR Activo en Taquilla" : "Tu Próximo Evento"}
                </span>

                {mounted && nextEvent?.start_date && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "white",
                      fontFamily: "monospace",
                    }}
                  >
                    {getCountdownText(nextEvent.start_date)}
                  </span>
                )}
              </div>

              <h2
                style={{
                  fontSize: "1.18rem",
                  fontWeight: 800,
                  color: "white",
                  margin: "0 0 0.35rem 0",
                  lineHeight: 1.2,
                }}
              >
                {nextEvent?.title || "Evento Bassfactory"}
              </h2>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.85rem",
                  fontSize: "0.78rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {nextEvent?.start_date && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <Calendar size={13} color="var(--color-magenta)" />
                    {new Date(nextEvent.start_date).toLocaleDateString("es-CO", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                {nextEvent?.location_name && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={13} color="var(--color-magenta)" />
                    {nextEvent.location_name}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.65rem",
                paddingTop: "0.65rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)" }}>
                <strong style={{ color: "white" }}>{nextEventTicketsCount}</strong>{" "}
                {nextEventTicketsCount === 1 ? "entrada" : "entradas"} ·{" "}
                <span style={{ color: "var(--color-accent)", fontWeight: 700 }}>
                  {nextTier?.name || "General"}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "0.45rem 0.9rem",
                    borderRadius: "7px",
                    backgroundColor: "var(--color-magenta)",
                    color: "white",
                    border: "none",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <QrCode size={14} /> {isNextQrReady ? "Abrir Pase QR" : "Estado del Pase"}
                </button>

                {mapsQuery && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "7px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <MapPin size={13} color="var(--color-accent)" /> Cómo llegar
                  </a>
                )}

                <Link
                  href="/account/tickets"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "7px",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Mis Tickets <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "1.15rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "white" }}>
              No tienes boletas activas para próximos eventos
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
              Explora la cartelera oficial y asegura tu entrada con QR antifraude.
            </div>
          </div>
          <Link
            href="/events"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "7px",
              backgroundColor: "var(--color-magenta)",
              color: "white",
              fontSize: "0.78rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Ver Eventos →
          </Link>
        </div>
      )}

      {/* 3. COMPACT ACTIVITY STRIP (3 cols on desktop AND 3 compact cols in 1 row on mobile!) */}
      <div className="account-stats-grid">
        <Link href="/account/tickets" className="account-stat-card">
          <div className="account-stat-top">
            <div
              className="account-stat-icon"
              style={{ backgroundColor: "rgba(229, 9, 20, 0.12)" }}
            >
              <Ticket size={17} color="var(--color-magenta)" />
            </div>
            <span className="account-stat-num">{tickets.length}</span>
          </div>
          <div className="account-stat-meta">
            <div className="account-stat-title">Tickets</div>
            <div className="account-stat-sub">En tu bóveda</div>
          </div>
        </Link>

        <Link href="/account/orders" className="account-stat-card">
          <div className="account-stat-top">
            <div
              className="account-stat-icon"
              style={{ backgroundColor: "rgba(0, 240, 255, 0.12)" }}
            >
              <ShoppingBag size={17} color="var(--color-accent)" />
            </div>
            <span className="account-stat-num">{ordersCount}</span>
          </div>
          <div className="account-stat-meta">
            <div className="account-stat-title">Compras</div>
            <div className="account-stat-sub">Órdenes</div>
          </div>
        </Link>

        <Link href="/account/notifications" className="account-stat-card">
          <div className="account-stat-top">
            <div
              className="account-stat-icon"
              style={{ backgroundColor: "rgba(255, 183, 77, 0.12)" }}
            >
              <Bell size={17} color="#FFB74D" />
            </div>
            <span className="account-stat-num">{notificationsCount}</span>
          </div>
          <div className="account-stat-meta">
            <div className="account-stat-title">Avisos</div>
            <div className="account-stat-sub">Notificaciones</div>
          </div>
        </Link>
      </div>

      {/* 4. UPCOMING EVENTS SLIDER (Horizontal snap slider matching Home scale!) */}
      {upcomingEvents.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.65rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "white" }}>
                Próximos Eventos en Cartelera
              </h3>
              {favoriteGenres.length === 0 ? (
                <Link
                  href="/account/settings"
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "var(--color-accent)",
                    backgroundColor: "rgba(0, 240, 255, 0.1)",
                    border: "1px solid rgba(0, 240, 255, 0.25)",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    textDecoration: "none",
                  }}
                >
                  + Elige tus géneros en Ajustes
                </Link>
              ) : (
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Basado en: {favoriteGenres.slice(0, 2).join(" · ")}
                </span>
              )}
            </div>
            <Link
              href="/events"
              style={{
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "var(--color-magenta)",
                textDecoration: "none",
              }}
            >
              Ver todos →
            </Link>
          </div>
          <div className="account-events-slider">
            {upcomingEvents.slice(0, 6).map((ev: any) => {
              const userHasTicket = tickets.some((t) => {
                const tier = Array.isArray(t.ticket_tiers)
                  ? t.ticket_tiers[0]
                  : t.ticket_tiers;
                const e = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
                return e?.id === ev.id;
              });
              const evDjs = Array.isArray(ev.event_djs) ? ev.event_djs.map((d: any) => d.dj_id) : [];
              const djMatch = followedDjs.some((id) => evDjs.includes(id));
              const haystack = `${ev.title || ""} ${ev.description || ""}`.toLowerCase();
              const genreMatch = favoriteGenres.some((g) => haystack.includes(g.toLowerCase()));
              const isForYou = !userHasTicket && (djMatch || genreMatch);

              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.slug}`}
                  className="account-slider-card"
                >
                  <div style={{ position: "relative", marginBottom: "0.55rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        ev.cover_image ||
                        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400"
                      }
                      alt={ev.title}
                      style={{
                        width: "100%",
                        aspectRatio: "1/1",
                        objectFit: "cover",
                        borderRadius: "7px",
                        display: "block",
                      }}
                    />
                    {userHasTicket ? (
                      <span
                        style={{
                          position: "absolute",
                          top: "6px",
                          left: "6px",
                          backgroundColor: "#22c55e",
                          color: "#052e16",
                          fontSize: "0.62rem",
                          fontWeight: 900,
                          padding: "2px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        ✓ Asistes
                      </span>
                    ) : isForYou ? (
                      <span
                        style={{
                          position: "absolute",
                          top: "6px",
                          left: "6px",
                          backgroundColor: "var(--color-accent)",
                          color: "#000000",
                          fontSize: "0.62rem",
                          fontWeight: 900,
                          padding: "2px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        ★ Para ti
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "white",
                      lineHeight: 1.25,
                      marginBottom: "0.2rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {ev.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {ev.start_date
                      ? new Date(ev.start_date).toLocaleDateString("es-CO", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Por confirmar"}{" "}
                    · {ev.location_name || "Colombia"}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. RECENT ORDERS */}
      {recentOrders && recentOrders.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", margin: 0 }}>
              Compras Recientes
            </h3>
            <Link
              href="/account/orders"
              style={{
                color: "var(--color-magenta)",
                fontSize: "0.78rem",
                fontWeight: 700,
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Ver todas ({ordersCount}) <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {recentOrders.map((ord: any) => {
              const isPaid = ord.status === "paid";
              return (
                <div
                  key={ord.id}
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    padding: "0.8rem 1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                      Orden #{ord.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)" }}>
                      {new Date(ord.created_at).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    {isPaid ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          color: "#22c55e",
                          backgroundColor: "rgba(34,197,94,0.12)",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "999px",
                        }}
                      >
                        <CheckCircle2 size={12} /> Confirmado
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          color: "#eab308",
                          backgroundColor: "rgba(234,179,8,0.12)",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "999px",
                        }}
                      >
                        <Clock size={12} /> Pendiente
                      </span>
                    )}

                    <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "white" }}>
                      ${Number(ord.total_amount).toLocaleString("es-CO")} COP
                    </div>

                    {isPaid && (
                      <Link
                        href={`/orders/${ord.id}/invoice`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.8)",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          padding: "0.3rem 0.6rem",
                          borderRadius: "6px",
                          textDecoration: "none",
                        }}
                      >
                        <FileText size={12} /> Factura
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <QrPassModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        ticket={nextTicket}
        event={nextEvent}
      />

      <style jsx>{`
        .account-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        :global(.account-stat-card) {
          background-color: var(--color-surface);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: border-color 0.2s, transform 0.2s;
        }
        :global(.account-stat-card:hover) {
          border-color: rgba(229, 9, 20, 0.35);
          transform: translateY(-2px);
        }
        .account-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .account-stat-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .account-stat-num {
          font-size: 1.4rem;
          font-weight: 800;
          color: white;
          line-height: 1;
        }
        .account-stat-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: white;
        }
        .account-stat-sub {
          font-size: 0.72rem;
          color: var(--color-text-secondary);
        }

        .account-events-slider {
          display: flex;
          gap: 0.75rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 4px;
        }
        .account-events-slider::-webkit-scrollbar {
          display: none;
        }
        :global(.account-slider-card) {
          flex: 0 0 185px;
          scroll-snap-align: start;
          background-color: var(--color-surface);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 0.7rem;
          text-decoration: none;
          display: flex;
          flex-direction: column;
        }

        @media (max-width: 640px) {
          .next-event-cover {
            width: 100% !important;
            height: 135px !important;
            min-height: 135px !important;
          }
          .account-stats-grid {
            gap: 0.5rem;
          }
          :global(.account-stat-card) {
            padding: 0.65rem 0.6rem;
            gap: 0.35rem;
          }
          .account-stat-icon {
            width: 28px;
            height: 28px;
          }
          .account-stat-num {
            font-size: 1.15rem;
          }
          .account-stat-title {
            font-size: 0.76rem;
          }
          .account-stat-sub {
            display: none;
          }
          :global(.account-slider-card) {
            flex: 0 0 158px;
          }
        }
      `}</style>
    </div>
  );
}
