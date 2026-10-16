"use client";

import { useState, useEffect, useRef, useTransition, useCallback } from "react";
import {
  ShieldCheck,
  Ticket,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Inbox,
  Check,
  X,
} from "lucide-react";
import TicketCard from "./TicketCard";
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
  userEmail,
}: AccountTicketsClientProps) {
  const [data, setData] = useState<UserTicketsPayload>(initialData);
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

        // Detectar nuevas boletas aceptadas por amigos (descontadas en tiempo real)
        const prevAcceptedSet = prevSnapshotRef.current.acceptedOutIds;
        const newlyAccepted = (nextData.acceptedOutgoingTransfers || []).filter(
          (tr: any) => !prevAcceptedSet.has(tr.id)
        );
        if (newlyAccepted.length > 0 && silent) {
          const recipient =
            newlyAccepted[0].to_name || newlyAccepted[0].to_email || "El destinatario";
          toast.success(
            newlyAccepted.length > 1
              ? `🎉 ¡${recipient} aceptó ${newlyAccepted.length} boletas! Se descontaron de tu cuenta en tiempo real.`
              : `🎉 ¡${recipient} aceptó la boleta #${newlyAccepted[0].ticket_id
                  ?.slice(0, 8)
                  .toUpperCase()}! Se descontó de tu cuenta en tiempo real.`
          );
        }

        // Detectar nuevas invitaciones entrantes
        const prevIncomingSet = prevSnapshotRef.current.incomingIds;
        const newlyIncoming = (nextData.incomingTransfers || []).filter(
          (tr: any) => !prevIncomingSet.has(tr.id)
        );
        if (newlyIncoming.length > 0 && silent) {
          toast.info(
            newlyIncoming.length > 1
              ? `🎟️ ¡Has recibido ${newlyIncoming.length} nuevas boletas para aceptar!`
              : `🎟️ ¡Has recibido una nueva boleta de ${newlyIncoming[0].sender_name}!`
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

  // Suscripción Realtime (Supabase WebSocket + Polling Determinístico cada 4s)
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`account-tickets-live-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => {
          syncLiveTickets(true);
        }
      )
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
    }, 4000);

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
          ? `¡${count} boletas aceptadas y sumadas a tu cuenta con éxito!`
          : "¡Boleta aceptada y sumada a tu cuenta con éxito!"
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

  // Calcular métricas globales en tiempo real
  const getPendingTransfer = (t: any) => {
    if (!t.ticket_transfers) return null;
    const transfers = Array.isArray(t.ticket_transfers)
      ? t.ticket_transfers
      : [t.ticket_transfers];
    return transfers.find((tr: any) => tr.status === "pending") || null;
  };

  const totalInTransfer = tickets.filter((t) => Boolean(getPendingTransfer(t))).length;
  const totalInPossession = Math.max(0, tickets.length - totalInTransfer);
  const totalTransferredOut = acceptedOutgoingTransfers.length;

  // Agrupar boletas propias por Evento
  const groupedMap = new Map<string, { event: any; tickets: any[] }>();
  for (const t of tickets) {
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

  const eventGroups = Array.from(groupedMap.values());

  return (
    <div
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        paddingBottom: "4rem",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      {/* HEADER CON CONTADORES EN TIEMPO REAL */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1
              style={{
                fontSize: "clamp(2rem, 3.5vw, 2.75rem)",
                fontWeight: 900,
                marginBottom: "0.3rem",
                fontFamily: "Outfit, sans-serif",
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              Mis Boletas
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#22c55e",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.25)",
                padding: "0.25rem 0.65rem",
                borderRadius: "999px",
              }}
              title="Tu inventario se actualiza automáticamente en tiempo real"
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  boxShadow: "0 0 8px #22c55e",
                }}
              />
              Tiempo Real
            </span>
          </div>
          <p
            style={{
              color: "var(--color-text-secondary)",
              margin: 0,
              fontSize: "1rem",
            }}
          >
            Tus entradas oficiales para los próximos festivales y eventos de
            Bassfactory.
          </p>
        </div>

        {/* Píldoras de estado global */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.65rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.35)",
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 800,
              color: "#22c55e",
            }}
          >
            <Sparkles size={16} />
            {totalInPossession}{" "}
            {totalInPossession === 1
              ? "Disponible en tu Posesión"
              : "Disponibles en tu Posesión"}
          </div>

          {totalInTransfer > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(245, 158, 11, 0.14)",
                border: "1px solid rgba(245, 158, 11, 0.35)",
                padding: "0.45rem 0.95rem",
                borderRadius: "999px",
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "#f59e0b",
              }}
            >
              <Clock size={15} />
              {totalInTransfer} En Transferencia
            </div>
          )}

          {totalTransferredOut > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "rgba(168, 85, 247, 0.14)",
                border: "1px solid rgba(168, 85, 247, 0.35)",
                padding: "0.45rem 0.95rem",
                borderRadius: "999px",
                fontSize: "0.82rem",
                fontWeight: 800,
                color: "#c084fc",
              }}
            >
              <ArrowUpRight size={15} />
              {totalTransferredOut}{" "}
              {totalTransferredOut === 1 ? "Transferida" : "Transferidas"}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN CRÍTICA: BOLETAS RECIBIDAS PENDIENTES POR ACEPTAR (1 O VARIAS AL MISMO TIEMPO) */}
      {incomingTransfers.length > 0 && (
        <div
          style={{
            backgroundColor: "rgba(0, 240, 255, 0.07)",
            border: "1px solid rgba(0, 240, 255, 0.35)",
            borderRadius: "1.25rem",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 12px 35px rgba(0, 240, 255, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(0, 240, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-accent, #00f0ff)",
                }}
              >
                <Inbox size={24} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.15rem",
                    fontWeight: 900,
                    color: "white",
                  }}
                >
                  🎟️ Tienes {incomingTransfers.length}{" "}
                  {incomingTransfers.length === 1
                    ? "boleta recibida pendiente por aceptar"
                    : "boletas recibidas pendientes por aceptar"}
                </h3>
                <p
                  style={{
                    margin: "2px 0 0 0",
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  Al aceptarlas se sumarán inmediatamente a tus boletas en posesión y
                  se descontarán de la cuenta del emisor.
                </p>
              </div>
            </div>

            {incomingTransfers.length > 1 && (
              <button
                type="button"
                disabled={isPendingAction}
                onClick={() =>
                  handleAcceptTransfers(incomingTransfers.map((tr: any) => tr.id))
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.7rem 1.25rem",
                  backgroundColor: "#22c55e",
                  color: "#052e16",
                  border: "none",
                  borderRadius: "0.6rem",
                  fontWeight: 900,
                  fontSize: "0.875rem",
                  cursor: isPendingAction ? "not-allowed" : "pointer",
                  opacity: isPendingAction ? 0.6 : 1,
                  boxShadow: "0 4px 16px rgba(34, 197, 94, 0.35)",
                }}
              >
                <Check size={17} strokeWidth={3} /> Aceptar Todas las Boletas (
                {incomingTransfers.length})
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {incomingTransfers.map((tr: any) => {
              const shortTicketId = tr.ticket_id?.slice(0, 8).toUpperCase() || "";
              return (
                <div
                  key={tr.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "0.85rem",
                    backgroundColor: "rgba(0, 0, 0, 0.45)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          color: "white",
                          fontSize: "0.95rem",
                        }}
                      >
                        {tr.event?.title || "Evento Bassfactory"}
                      </span>
                      <span
                        style={{
                          backgroundColor: "rgba(0, 240, 255, 0.15)",
                          color: "var(--color-accent, #00f0ff)",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "0.18rem 0.55rem",
                          borderRadius: "5px",
                          textTransform: "uppercase",
                        }}
                      >
                        {tr.tier_name}
                      </span>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.65)",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                        }}
                      >
                        #{shortTicketId}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "rgba(255,255,255,0.7)",
                        marginTop: "4px",
                      }}
                    >
                      Enviada por: <strong style={{ color: "white" }}>{tr.sender_name}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <button
                      type="button"
                      disabled={isPendingAction}
                      onClick={() => handleRejectTransfers([tr.id])}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "0.5rem 0.9rem",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        color: "#ef4444",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: isPendingAction ? "not-allowed" : "pointer",
                      }}
                    >
                      <X size={14} /> Rechazar
                    </button>
                    <button
                      type="button"
                      disabled={isPendingAction}
                      onClick={() => handleAcceptTransfers([tr.id])}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "0.55rem 1.05rem",
                        backgroundColor: "var(--color-magenta, #E50914)",
                        border: "none",
                        color: "white",
                        borderRadius: "0.5rem",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        cursor: isPendingAction ? "not-allowed" : "pointer",
                      }}
                    >
                      <Check size={15} /> Aceptar Boleta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner Informativo sobre Generación de Boletas */}
      <div
        style={{
          backgroundColor: "rgba(229, 9, 20, 0.08)",
          border: "1px solid rgba(229, 9, 20, 0.25)",
          borderRadius: "1rem",
          padding: "1.25rem 1.5rem",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "1rem",
        }}
      >
        <ShieldCheck
          size={26}
          style={{ color: "var(--color-magenta)", flexShrink: 0, marginTop: "2px" }}
        />
        <div>
          <h4
            style={{
              color: "white",
              fontWeight: 800,
              margin: "0 0 0.25rem 0",
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
            }}
          >
            Protocolo de Seguridad y Activación Antifraude
          </h4>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.85)",
              margin: 0,
              fontSize: "0.875rem",
              lineHeight: 1.55,
            }}
          >
            Tus boletas están aseguradas. Para garantizar la seguridad del evento y
            evitar la reventa y clonación no autorizada,{" "}
            <strong>
              los botones de descarga en PDF y el código QR de acceso oficial
              permanecen bloqueados y se habilitarán exactamente 1 día antes del
              evento
            </strong>{" "}
            en tu perfil y correo registrado.
          </p>
        </div>
      </div>

      {/* LISTA DE BOLETAS EN POSESIÓN / ACTIVAS */}
      {!tickets || tickets.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "4rem 2rem",
            textAlign: "center",
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: "1rem",
          }}
        >
          <Ticket
            size={48}
            style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 1rem" }}
          />
          <h3
            style={{
              color: "white",
              fontWeight: 700,
              fontSize: "1.25rem",
              marginBottom: "0.5rem",
            }}
          >
            {totalTransferredOut > 0
              ? "No tienes boletas activas en tu posesión actualmente"
              : "No tienes boletas adquiridas aún"}
          </h3>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.95rem",
              maxWidth: "480px",
              margin: "0 auto 1.5rem",
            }}
          >
            {totalTransferredOut > 0
              ? `Tus ${totalTransferredOut} boleta(s) transferida(s) ya fueron aceptadas por sus destinatarios y se descontaron de tu inventario.`
              : "Cuando compres entradas o te transfieran una boleta para nuestros próximos eventos, aparecerán aquí en tiempo real."}
          </p>
          <a
            href="/events"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.5rem",
              backgroundColor: "var(--color-magenta)",
              color: "white",
              borderRadius: "0.5rem",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Explorar Próximos Eventos
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {eventGroups.map((group) => {
            const rawDate = group.event?.start_date;
            const eventDate = rawDate
              ? new Date(rawDate).toLocaleDateString("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Fecha por confirmar";

            const eventId = group.event?.id || "general-event";
            const transferredOutForEventCount = acceptedOutgoingTransfers.filter(
              (tr: any) => tr.event_id === eventId
            ).length;

            return (
              <TicketCard
                key={eventId}
                event={group.event}
                tickets={group.tickets}
                eventDate={eventDate}
                transferredOutCount={transferredOutForEventCount}
                onRefreshRequested={() => syncLiveTickets(false)}
              />
            );
          })}
        </div>
      )}

      {/* HISTORIAL DE BOLETAS TRANSFERIDAS Y DESCONTADAS (SOLO LECTURA) */}
      {acceptedOutgoingTransfers.length > 0 && (
        <div
          style={{
            marginTop: "2.75rem",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "1.25rem",
            padding: "1.5rem 1.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ArrowUpRight size={18} color="#c084fc" />
                Boletas Transferidas y Descontadas ({acceptedOutgoingTransfers.length})
              </h3>
              <p
                style={{
                  margin: "3px 0 0 0",
                  fontSize: "0.82rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Estas boletas ya fueron aceptadas por tus amigos, por lo que salieron
                de tu inventario y ahora pertenecen a sus cuentas.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            {acceptedOutgoingTransfers.map((tr: any) => (
              <div
                key={tr.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  padding: "0.85rem 1.15rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.65)",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                    }}
                  >
                    #{tr.ticket_id?.slice(0, 8).toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 700, color: "white", fontSize: "0.9rem" }}>
                    {tr.event_title}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-accent, #00f0ff)",
                      fontWeight: 700,
                    }}
                  >
                    ({tr.tier_name})
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.75)" }}>
                    → Entregada a:{" "}
                    <strong style={{ color: "white" }}>
                      {tr.to_name || tr.to_email}
                    </strong>{" "}
                    <span style={{ opacity: 0.7 }}>({tr.to_email})</span>
                  </span>
                </div>

                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#22c55e",
                    backgroundColor: "rgba(34, 197, 94, 0.14)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "999px",
                    textTransform: "uppercase",
                  }}
                >
                  <CheckCircle2 size={12} /> ACEPTADA Y DESCONTADA
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
