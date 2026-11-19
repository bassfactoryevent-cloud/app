"use client";

import { useState, useEffect, useRef, useTransition, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Ticket,
  ArrowUpRight,
  Inbox,
  Check,
  X,
  Info,
} from "lucide-react";
import TicketCard, { type FrequentContact } from "./TicketCard";
import {
  getLiveAccountTicketsAction,
  acceptIncomingTransfersAction,
  rejectIncomingTransfersAction,
} from "./actions";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import type { UserTicketsPayload } from "@/utils/userTickets";

interface AccountTicketsClientProps {
  initialData: UserTicketsPayload;
  userId: string;
  userEmail: string;
}

export default function AccountTicketsClient({
  initialData,
  userId,
}: AccountTicketsClientProps) {
  const [data, setData] = useState<UserTicketsPayload>(initialData);
  const [activeTab, setActiveTab] = useState<"upcoming" | "transferred" | "past">(
    "upcoming"
  );
  const [showAntifraudInfo, setShowAntifraudInfo] = useState(false);
  const [isPendingAction, startTransition] = useTransition();
  const isSyncingRef = useRef(false);
  const prevSnapshotRef = useRef({
    acceptedOutIds: new Set(
      (initialData.acceptedOutgoingTransfers || []).map((tr: any) => tr.id)
    ),
    incomingIds: new Set(
      (initialData.incomingTransfers || []).map((tr: any) => tr.id)
    ),
  });

  const syncLiveTickets = useCallback(async (silent = true) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const res = await getLiveAccountTicketsAction();
      if (res.success && res.data) {
        const nextData = res.data;

        const prevAcceptedSet = prevSnapshotRef.current.acceptedOutIds;
        const newlyAccepted = (nextData.acceptedOutgoingTransfers || []).filter(
          (tr: any) => !prevAcceptedSet.has(tr.id)
        );
        if (newlyAccepted.length > 0 && silent) {
          const recipient =
            newlyAccepted[0].to_name || newlyAccepted[0].to_email || "El destinatario";
          toast.success(
            newlyAccepted.length > 1
              ? `¡${recipient} aceptó ${newlyAccepted.length} boletas!`
              : `¡${recipient} aceptó la boleta #${newlyAccepted[0].ticket_id
                  ?.slice(0, 8)
                  .toUpperCase()}!`
          );
        }

        const prevIncomingSet = prevSnapshotRef.current.incomingIds;
        const newlyIncoming = (nextData.incomingTransfers || []).filter(
          (tr: any) => !prevIncomingSet.has(tr.id)
        );
        if (newlyIncoming.length > 0 && silent) {
          toast.info(
            newlyIncoming.length > 1
              ? `¡Has recibido ${newlyIncoming.length} nuevas boletas para aceptar!`
              : `¡Has recibido una boleta de ${newlyIncoming[0].sender_name}!`
          );
        }

        prevSnapshotRef.current = {
          acceptedOutIds: new Set(
            (nextData.acceptedOutgoingTransfers || []).map((tr: any) => tr.id)
          ),
          incomingIds: new Set(
            (nextData.incomingTransfers || []).map((tr: any) => tr.id)
          ),
        };

        setData(nextData);
      }
    } catch (err) {
      console.error("Live sync error:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`account-tickets-live-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        syncLiveTickets(true);
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_transfers" },
        () => {
          syncLiveTickets(true);
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncLiveTickets(true);
      }
    }, 5000);

    const handleVisibilityOrFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncLiveTickets(true);
      }
    };

    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      supabase.removeChannel(channel);
    };
  }, [userId, syncLiveTickets]);

  const handleAcceptTransfers = (transferIds: string[]) => {
    startTransition(async () => {
      const res = await acceptIncomingTransfersAction(transferIds);
      if (!res.success) {
        toast.error(res.error || "Error al aceptar la transferencia.");
        await syncLiveTickets(false);
        return;
      }
      const count = res.acceptedCount || transferIds.length;
      toast.success(
        count > 1
          ? `¡${count} boletas aceptadas y sumadas a tu cuenta!`
          : "¡Boleta aceptada y sumada a tu cuenta!"
      );
      await syncLiveTickets(false);
    });
  };

  const handleRejectTransfers = (transferIds: string[]) => {
    startTransition(async () => {
      const res = await rejectIncomingTransfersAction(transferIds);
      if (!res.success) {
        toast.error(res.error || "Error al rechazar la transferencia.");
        await syncLiveTickets(false);
        return;
      }
      toast.info("Boleta devuelta a su emisor original.");
      await syncLiveTickets(false);
    });
  };

  const { tickets, incomingTransfers, acceptedOutgoingTransfers } = data;

  // Extract frequent transfer contacts (deduplicated by email)
  const frequentContacts: FrequentContact[] = useMemo(() => {
    const map = new Map<string, FrequentContact>();
    for (const tr of acceptedOutgoingTransfers || []) {
      const email = (tr.to_email || "").trim().toLowerCase();
      if (email && !map.has(email)) {
        map.set(email, {
          name: tr.to_name || email.split("@")[0],
          email,
        });
      }
    }
    return Array.from(map.values()).slice(0, 5);
  }, [acceptedOutgoingTransfers]);

  // Split tickets into upcoming vs past (12h grace window after start_date)
  const cutoffMs = Date.now() - 12 * 60 * 60 * 1000;
  const upcomingTicketsList: any[] = [];
  const pastTicketsList: any[] = [];

  for (const t of tickets) {
    const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
    const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
    const isPast = event?.start_date
      ? new Date(event.start_date).getTime() < cutoffMs
      : false;
    if (isPast) {
      pastTicketsList.push(t);
    } else {
      upcomingTicketsList.push(t);
    }
  }

  const groupByEvent = (list: any[]) => {
    const groupedMap = new Map<string, { event: any; tickets: any[] }>();
    for (const t of list) {
      const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
      const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      const eventId = event?.id || "general-event";

      if (!groupedMap.has(eventId)) {
        groupedMap.set(eventId, {
          event: event || { title: "Evento Bassfactory" },
          tickets: [],
        });
      }
      groupedMap.get(eventId)!.tickets.push(t);
    }
    return Array.from(groupedMap.values());
  };

  const upcomingGroups = groupByEvent(upcomingTicketsList);
  const pastGroups = groupByEvent(pastTicketsList);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* COMPACT FILTER BAR + REALTIME ANTIFRAUD CHIP (Tickets appear above the fold!) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "4px",
            borderRadius: "9px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            gap: "4px",
          }}
        >
          {[
            { id: "upcoming", label: "Próximos", count: upcomingTicketsList.length },
            {
              id: "transferred",
              label: "Transferidas",
              count: acceptedOutgoingTransfers.length,
            },
            { id: "past", label: "Pasados", count: pastTicketsList.length },
          ].map((tab) => {
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "0.4rem 0.85rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: isAct ? "var(--color-magenta)" : "transparent",
                  color: isAct ? "white" : "var(--color-text-secondary)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    backgroundColor: isAct
                      ? "rgba(0,0,0,0.28)"
                      : "rgba(255,255,255,0.07)",
                    color: "white",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Realtime & Antifraud Chip */}
        <button
          type="button"
          onClick={() => setShowAntifraudInfo((v) => !v)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "0.4rem 0.8rem",
            borderRadius: "999px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--color-text-secondary)",
            fontSize: "0.74rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              boxShadow: "0 0 6px #22c55e",
            }}
          />
          <span>Tiempo Real · Antifraude 24h</span>
          <Info size={13} />
        </button>
      </div>

      {/* Expandable Antifraud Explanation (Only visible if clicked) */}
      {showAntifraudInfo && (
        <div
          style={{
            backgroundColor: "rgba(229, 9, 20, 0.08)",
            border: "1px solid rgba(229, 9, 20, 0.25)",
            borderRadius: "10px",
            padding: "0.85rem 1rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.85)",
          }}
        >
          <ShieldCheck size={18} color="var(--color-magenta)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>Protocolo Antifraude:</strong> Para evitar reventa y clonación, el código QR
            y la descarga en PDF se habilitan <strong>24 horas antes del evento</strong>. Al
            transferir una boleta, el código anterior queda anulado y se genera uno nuevo para tu
            invitado.
          </div>
        </div>
      )}

      {/* INCOMING TRANSFERS */}
      {incomingTransfers.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(0, 240, 255, 0.07)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            borderRadius: "12px",
            padding: "1rem 1.15rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <Inbox size={18} color="var(--color-accent)" />
              <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "white" }}>
                Tienes {incomingTransfers.length}{" "}
                {incomingTransfers.length === 1
                  ? "boleta recibida por aceptar"
                  : "boletas recibidas por aceptar"}
              </span>
            </div>
            {incomingTransfers.length > 1 && (
              <button
                type="button"
                disabled={isPendingAction}
                onClick={() =>
                  handleAcceptTransfers(incomingTransfers.map((tr: any) => tr.id))
                }
                style={{
                  padding: "0.4rem 0.85rem",
                  backgroundColor: "#22c55e",
                  color: "#052e16",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Aceptar todas ({incomingTransfers.length})
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {incomingTransfers.map((tr: any) => (
              <div
                key={tr.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "8px",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                    {tr.event?.title || "Evento Bassfactory"}{" "}
                    <span style={{ color: "var(--color-accent)", fontSize: "0.74rem" }}>
                      · {tr.tier_name}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)" }}>
                    Enviada por <strong style={{ color: "white" }}>{tr.sender_name}</strong>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.45rem" }}>
                  <button
                    type="button"
                    disabled={isPendingAction}
                    onClick={() => handleRejectTransfers([tr.id])}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.4rem 0.75rem",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(239,68,68,0.4)",
                      color: "#ef4444",
                      borderRadius: "6px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <X size={13} /> Rechazar
                  </button>
                  <button
                    type="button"
                    disabled={isPendingAction}
                    onClick={() => handleAcceptTransfers([tr.id])}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.4rem 0.85rem",
                      backgroundColor: "var(--color-magenta)",
                      border: "none",
                      color: "white",
                      borderRadius: "6px",
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

      {/* TAB CONTENT */}
      {activeTab === "upcoming" && (
        <>
          {upcomingGroups.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px dashed rgba(255,255,255,0.12)",
                borderRadius: "12px",
                padding: "2.25rem 1.5rem",
                textAlign: "center",
              }}
            >
              <Ticket
                size={34}
                style={{ color: "rgba(255,255,255,0.25)", margin: "0 auto 0.75rem" }}
              />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white", marginBottom: "0.35rem" }}>
                No tienes boletas para próximos eventos
              </h3>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--color-text-secondary)",
                  maxWidth: "420px",
                  margin: "0 auto 1rem",
                }}
              >
                Cuando compres entradas o te transfieran una boleta, aparecerá aquí al
                instante.
              </p>
              <Link
                href="/events"
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1.1rem",
                  backgroundColor: "var(--color-magenta)",
                  color: "white",
                  borderRadius: "7px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Explorar Eventos
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {upcomingGroups.map((group) => {
                const rawDate = group.event?.start_date;
                const eventDate = rawDate
                  ? new Date(rawDate).toLocaleDateString("es-CO", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Fecha por confirmar";
                const eventId = group.event?.id || "general-event";
                const transferredOutCount = acceptedOutgoingTransfers.filter(
                  (tr: any) => tr.event_id === eventId
                ).length;

                return (
                  <TicketCard
                    key={eventId}
                    event={group.event}
                    tickets={group.tickets}
                    eventDate={eventDate}
                    transferredOutCount={transferredOutCount}
                    frequentContacts={frequentContacts}
                    onRefreshRequested={() => syncLiveTickets(false)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "transferred" && (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px",
            padding: "1rem 1.15rem",
          }}
        >
          {acceptedOutgoingTransfers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.5rem", fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              Aún no has transferido boletas a otros asistentes.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {acceptedOutgoingTransfers.map((tr: any) => (
                <div
                  key={tr.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    padding: "0.75rem 0.9rem",
                    borderRadius: "8px",
                    backgroundColor: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "white" }}>
                      {tr.event_title}{" "}
                      <span style={{ fontFamily: "monospace", fontSize: "0.74rem", color: "rgba(255,255,255,0.6)" }}>
                        #{tr.ticket_id?.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--color-text-secondary)" }}>
                      Aceptada por <strong style={{ color: "white" }}>{tr.to_name || tr.to_email}</strong>
                    </div>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "#c084fc",
                      backgroundColor: "rgba(168, 85, 247, 0.14)",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "999px",
                    }}
                  >
                    <ArrowUpRight size={13} /> Transferida
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "past" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {pastGroups.length === 0 ? (
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "2rem",
                textAlign: "center",
                fontSize: "0.82rem",
                color: "var(--color-text-secondary)",
              }}
            >
              No tienes eventos pasados registrados en tu cuenta todavía.
            </div>
          ) : (
            pastGroups.map((group) => {
              const rawDate = group.event?.start_date;
              const eventDate = rawDate
                ? new Date(rawDate).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "Evento finalizado";
              const eventId = group.event?.id || "past-event";
              return (
                <TicketCard
                  key={eventId}
                  event={group.event}
                  tickets={group.tickets}
                  eventDate={eventDate}
                  frequentContacts={frequentContacts}
                  onRefreshRequested={() => syncLiveTickets(false)}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
