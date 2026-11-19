"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { QrCode, Ticket, ArrowRight, Inbox } from "lucide-react";
import QrPassModal from "@/components/tickets/QrPassModal";
import type { UserTicketsPayload } from "@/utils/userTickets";

interface HomeUserStripProps {
  userName: string;
  ticketsData: UserTicketsPayload;
}

export default function HomeUserStrip({ userName, ticketsData }: HomeUserStripProps) {
  const [qrOpen, setQrOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveScannedIds, setLiveScannedIds] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    const onLiveScan = (e: any) => {
      const tId = e?.detail?.ticketId;
      const scannedAt = e?.detail?.scanned_at || new Date().toISOString();
      if (tId) {
        setLiveScannedIds((prev) => ({ ...prev, [tId]: scannedAt }));
      }
    };
    window.addEventListener("ticket_scanned_live", onLiveScan);
    return () => window.removeEventListener("ticket_scanned_live", onLiveScan);
  }, []);

  const incoming = ticketsData.incomingTransfers || [];
  const tickets = ticketsData.tickets || [];

  const nowMinus12h = Date.now() - 12 * 60 * 60 * 1000;
  const upcomingTickets = tickets
    .map((t) => {
      const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
      const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      return { ticket: t, tier, event };
    })
    .filter(({ event }) =>
      mounted && event?.start_date
        ? new Date(event.start_date).getTime() >= nowMinus12h
        : true
    )
    .sort((a, b) => {
      const da = a.event?.start_date ? new Date(a.event.start_date).getTime() : Infinity;
      const db = b.event?.start_date ? new Date(b.event.start_date).getTime() : Infinity;
      return da - db;
    });

  const nextItem = upcomingTickets[0] || null;
  const nextEvent = nextItem?.event || null;
  const rawNextTicket = nextItem?.ticket || null;
  const nextTicket = rawNextTicket
    ? {
        ...rawNextTicket,
        status: liveScannedIds[rawNextTicket.id] ? "scanned" : rawNextTicket.status,
        scanned_at: liveScannedIds[rawNextTicket.id] || rawNextTicket.scanned_at,
      }
    : null;
  const isNextScanned = nextTicket?.status === "scanned";

  return (
    <>
      <section
        style={{
          backgroundColor: "var(--color-surface)",
          border: isNextScanned
            ? "1px solid rgba(0, 240, 255, 0.35)"
            : "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "10px",
          padding: "0.85rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        {/* Left: User + Next Event or Incoming Alert */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: "1 1 240px" }}>
          {nextEvent?.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={nextEvent.cover_image}
              alt={nextEvent.title}
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "7px",
                objectFit: "cover",
                flexShrink: 0,
                border: isNextScanned
                  ? "1px solid rgba(0, 240, 255, 0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            />
          ) : (
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "7px",
                backgroundColor: "rgba(229, 9, 20, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Ticket size={20} color="var(--color-magenta)" />
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span>
                Hola, <strong style={{ color: "white" }}>{userName.split(" ")[0]}</strong>
              </span>
              {isNextScanned && (
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 900,
                    color: "#00F0FF",
                    backgroundColor: "rgba(0, 240, 255, 0.14)",
                    border: "1px solid rgba(0, 240, 255, 0.4)",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  ● En la Rave en este momento
                </span>
              )}
              {incoming.length > 0 && (
                <span style={{ color: "#00F0FF", fontWeight: 700 }}>
                  · {incoming.length} boleta por aceptar
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "white",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {nextEvent
                ? isNextScanned
                  ? `¡Ya estás adentro de ${nextEvent.title}!`
                  : `Tu próximo evento: ${nextEvent.title}`
                : "Tu ecosistema Bassfactory está listo"}
            </div>
          </div>
        </div>

        {/* Right: Interactive Quick Actions (Web + Account unified) */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
          {incoming.length > 0 && (
            <Link
              href="/account/tickets"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.42rem 0.75rem",
                borderRadius: "7px",
                backgroundColor: "rgba(0, 240, 255, 0.14)",
                border: "1px solid rgba(0, 240, 255, 0.45)",
                color: "#00F0FF",
                fontSize: "0.74rem",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              <Inbox size={13} /> Aceptar ({incoming.length})
            </Link>
          )}

          {nextTicket && (
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.42rem 0.8rem",
                borderRadius: "7px",
                backgroundColor: isNextScanned ? "rgba(0, 240, 255, 0.16)" : "var(--color-magenta)",
                border: isNextScanned ? "1px solid rgba(0, 240, 255, 0.45)" : "none",
                color: isNextScanned ? "#00F0FF" : "white",
                fontSize: "0.74rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <QrCode size={13} /> {isNextScanned ? "Mi Pase Activo" : "Abrir QR"}
            </button>
          )}

          <Link
            href="/account/tickets"
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
            <Ticket size={13} /> Tickets ({tickets.length})
          </Link>

          <Link
            href="/account"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
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
            Mi Cuenta <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      <QrPassModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        ticket={nextTicket}
        event={nextEvent}
      />
    </>
  );
}
