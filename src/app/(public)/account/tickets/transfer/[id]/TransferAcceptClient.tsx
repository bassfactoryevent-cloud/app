"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Ticket,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  acceptIncomingTransfersAction,
  rejectIncomingTransfersAction,
} from "../../actions";
import { toast } from "sonner";

interface TransferAcceptClientProps {
  transfer: any;
  siblingPendingTransfers: any[];
  tier: any;
  event: any;
  senderName: string;
  currentUserEmail: string;
}

export default function TransferAcceptClient({
  transfer,
  siblingPendingTransfers,
  tier,
  event,
  senderName,
  currentUserEmail,
}: TransferAcceptClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(transfer.status);
  const [acceptedCount, setAcceptedCount] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  const isRecipientMatch =
    currentUserEmail.trim().toLowerCase() ===
    (transfer.to_email || "").trim().toLowerCase();

  const allPendingIds = Array.from(
    new Set([transfer.id, ...siblingPendingTransfers.map((s) => s.id)])
  );

  const handleAccept = (idsToAccept: string[]) => {
    startTransition(async () => {
      const res = await acceptIncomingTransfersAction(idsToAccept);
      if (!res.success) {
        toast.error(res.error || "No se pudo aceptar la transferencia.");
        return;
      }
      const count = res.acceptedCount || idsToAccept.length;
      setAcceptedCount(count);
      setStatus("accepted");
      toast.success(
        count > 1
          ? `¡${count} boletas aceptadas y guardadas en tu cuenta!`
          : "¡Boleta aceptada y guardada en tu cuenta!"
      );
      router.refresh();
    });
  };

  const handleReject = (idsToReject: string[]) => {
    startTransition(async () => {
      const res = await rejectIncomingTransfersAction(idsToReject);
      if (!res.success) {
        toast.error(res.error || "No se pudo rechazar la transferencia.");
        return;
      }
      setStatus("rejected");
      toast.info("Transferencia rechazada. La boleta regresó al emisor.");
      router.refresh();
    });
  };

  return (
    <div style={{ maxWidth: "620px", margin: "4rem auto", padding: "0 1rem" }}>
      {status === "pending" && (
        <div
          className="glass-panel"
          style={{
            padding: "2.5rem 2rem",
            textAlign: "center",
            borderRadius: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <Ticket size={48} color="var(--color-magenta)" />
          </div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "0.75rem",
              color: "white",
            }}
          >
            {allPendingIds.length > 1
              ? `¡Tienes ${allPendingIds.length} entradas esperándote!`
              : "¡Tienes una entrada esperándote!"}
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--color-text-secondary)",
              marginBottom: "1.75rem",
            }}
          >
            <strong>{senderName}</strong> te ha transferido{" "}
            {allPendingIds.length > 1
              ? `${allPendingIds.length} boletas oficiales`
              : "una boleta oficial"}{" "}
            para este evento:
          </p>

          <div
            style={{
              backgroundColor: "rgba(0,0,0,0.35)",
              borderRadius: "1rem",
              padding: "1.5rem",
              textAlign: "left",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "1.25rem",
              alignItems: "center",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {(event?.cover_image || event?.image_url) && (
              <Image
                src={event.cover_image || event.image_url}
                alt={event.title || "Evento"}
                width={90}
                height={90}
                style={{ borderRadius: "0.5rem", objectFit: "cover" }}
              />
            )}
            <div>
              <div
                style={{
                  color: "var(--color-accent, #00f0ff)",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {tier?.name || "General"}
                {allPendingIds.length > 1
                  ? ` • ${allPendingIds.length} Entradas`
                  : ` • #${transfer.ticket_id?.slice(0, 8).toUpperCase()}`}
              </div>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  margin: "0.25rem 0",
                  color: "white",
                }}
              >
                {event?.title || "Evento Bassfactory"}
              </h3>
              <div
                style={{
                  fontSize: "0.85rem",
                  opacity: 0.75,
                  color: "var(--color-text-secondary)",
                }}
              >
                {event?.start_date
                  ? new Date(event.start_date).toLocaleDateString("es-CO", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Fecha por confirmar"}
              </div>
            </div>
          </div>

          {!isRecipientMatch ? (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                borderRadius: "0.75rem",
                padding: "1.25rem",
                marginBottom: "1rem",
                color: "#fca5a5",
                textAlign: "left",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 800,
                  color: "#ef4444",
                  marginBottom: "0.4rem",
                }}
              >
                <AlertTriangle size={18} /> Cuenta diferente a la del destinatario
              </div>
              Esta transferencia fue enviada exclusivamente a{" "}
              <strong style={{ color: "white" }}>{transfer.to_email}</strong>, pero
              actualmente estás conectado como{" "}
              <strong style={{ color: "white" }}>{currentUserEmail}</strong>. Inicia
              sesión con la cuenta <strong>{transfer.to_email}</strong> para
              aceptar la boleta.
            </div>
          ) : (
            <>
              <div
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.75rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.8rem",
                  color: "#fde68a",
                  textAlign: "left",
                }}
              >
                ⏱️ <strong>Límite de aceptación:</strong> Tienes 48 horas para
                aceptar. Al aceptar, se sumará inmediatamente a tu panel y se
                descontará de la cuenta del emisor en tiempo real.
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {allPendingIds.length > 1 && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAccept(allPendingIds)}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      backgroundColor: "#22c55e",
                      border: "none",
                      color: "#052e16",
                      borderRadius: "0.6rem",
                      fontWeight: 900,
                      fontSize: "0.95rem",
                      cursor: isPending ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 16px rgba(34, 197, 94, 0.35)",
                    }}
                  >
                    <Check size={18} strokeWidth={3} />
                    {isPending
                      ? "Procesando..."
                      : `Aceptar Todas las Boletas (${allPendingIds.length})`}
                  </button>
                )}

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReject([transfer.id])}
                    style={{
                      flex: 1,
                      padding: "0.9rem",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "white",
                      borderRadius: "0.5rem",
                      fontWeight: 600,
                      cursor: isPending ? "not-allowed" : "pointer",
                    }}
                  >
                    Rechazar / Devolver
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleAccept([transfer.id])}
                    style={{
                      flex: 2,
                      padding: "0.9rem",
                      backgroundColor: "var(--color-magenta)",
                      border: "none",
                      color: "white",
                      borderRadius: "0.5rem",
                      fontWeight: 800,
                      cursor: isPending ? "not-allowed" : "pointer",
                    }}
                  >
                    {isPending
                      ? "Aceptando..."
                      : allPendingIds.length > 1
                      ? "Aceptar solo esta boleta"
                      : "Aceptar y Guardar Boleta"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {status === "accepted" && (
        <div
          className="glass-panel"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            borderRadius: "1.25rem",
          }}
        >
          <CheckCircle2
            size={64}
            color="#22c55e"
            style={{ margin: "0 auto 1.5rem" }}
          />
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              color: "#22c55e",
              marginBottom: "1rem",
            }}
          >
            {acceptedCount > 1
              ? `¡${acceptedCount} Boletas Aceptadas con Éxito!`
              : "¡Boleta Aceptada con Éxito!"}
          </h1>
          <p
            style={{
              color: "var(--color-text-secondary)",
              marginBottom: "2rem",
              fontSize: "1.05rem",
            }}
          >
            {acceptedCount > 1
              ? "Las boletas ahora te pertenecen, han sido sumadas a tu cuenta y descontadas del inventario del emisor."
              : "La boleta ahora te pertenece, ha sido sumada a tu cuenta y descontada del inventario del emisor."}
          </p>
          <a
            href="/account/tickets"
            style={{
              display: "inline-block",
              padding: "0.9rem 2rem",
              backgroundColor: "var(--color-magenta)",
              border: "none",
              color: "white",
              textDecoration: "none",
              borderRadius: "0.5rem",
              fontWeight: 700,
            }}
          >
            Ir a Mis Boletas
          </a>
        </div>
      )}

      {status === "rejected" && (
        <div
          className="glass-panel"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            borderRadius: "1.25rem",
          }}
        >
          <XCircle
            size={64}
            color="#ef4444"
            style={{ margin: "0 auto 1.5rem" }}
          />
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "1rem",
              color: "white",
            }}
          >
            Boleta Devuelta
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Has rechazado esta transferencia. La boleta ha regresado a la posesión
            de su comprador original.
          </p>
        </div>
      )}

      {status === "expired" && (
        <div
          className="glass-panel"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            borderRadius: "1.25rem",
          }}
        >
          <Clock
            size={64}
            color="#f59e0b"
            style={{ margin: "0 auto 1.5rem" }}
          />
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "1rem",
              color: "#f59e0b",
            }}
          >
            Invitación Expirada
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Esta transferencia superó el límite de tiempo de 48 horas para ser
            aceptada. La entrada regresó automáticamente a su comprador original.
          </p>
        </div>
      )}

      {status === "cancelled" && (
        <div
          className="glass-panel"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
            borderRadius: "1.25rem",
          }}
        >
          <XCircle
            size={64}
            color="#f59e0b"
            style={{ margin: "0 auto 1.5rem" }}
          />
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 800,
              marginBottom: "1rem",
              color: "white",
            }}
          >
            Transferencia Cancelada
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            El comprador original canceló esta transferencia antes de que fuera
            aceptada.
          </p>
        </div>
      )}
    </div>
  );
}
