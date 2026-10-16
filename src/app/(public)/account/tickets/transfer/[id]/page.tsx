import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { getAdminClient } from "@/utils/supabase/admin";
import { healStalePendingTransfers } from "@/utils/userTickets";
import TransferAcceptClient from "./TransferAcceptClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const adminDb = getAdminClient();

export default async function TransferAcceptPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const transferId = resolvedParams.id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Requerir Login para poder asociar la boleta a su cuenta
  if (!user) {
    redirect(`/login?redirect=/account/tickets/transfer/${transferId}`);
  }

  // Sanear cualquier transferencia expirada o duplicada antes de consultar
  await healStalePendingTransfers();

  // 2. Fetch Transfer via adminDb
  const { data: rawTransfer } = await adminDb
    .from("ticket_transfers")
    .select("id, status, ticket_id, from_user_id, to_email, to_name, created_at")
    .eq("id", transferId)
    .single();

  if (!rawTransfer) {
    return (
      <div
        style={{
          maxWidth: "600px",
          margin: "4rem auto",
          textAlign: "center",
          padding: "0 1rem",
        }}
      >
        <XCircle size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
          Transferencia no encontrada
        </h1>
        <p
          style={{
            opacity: 0.7,
            marginTop: "1rem",
            color: "var(--color-text-secondary)",
          }}
        >
          El enlace es inválido o la transferencia ya fue procesada.
        </p>
        <a
          href="/account/tickets"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            padding: "0.85rem 1.75rem",
            backgroundColor: "var(--color-magenta)",
            color: "white",
            textDecoration: "none",
            borderRadius: "0.5rem",
            fontWeight: 700,
          }}
        >
          Ir a Mis Boletas
        </a>
      </div>
    );
  }

  let transfer = rawTransfer;

  // 3. Comprobar límite de expiración (48 horas)
  const isExpired =
    transfer.status === "pending" &&
    Date.now() - new Date(transfer.created_at).getTime() > 48 * 60 * 60 * 1000;

  if (isExpired) {
    await adminDb
      .from("ticket_transfers")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", transfer.id);
    transfer = { ...transfer, status: "expired" };
  }

  // 4. Fetch Ticket, Tier, and Event data cleanly
  const { data: ticketData } = await adminDb
    .from("tickets")
    .select("id, qr_hash, tier_id")
    .eq("id", transfer.ticket_id)
    .single();

  let tier: any = null;
  let event: any = null;

  if (ticketData?.tier_id) {
    const { data: tierData } = await adminDb
      .from("ticket_tiers")
      .select("id, name, event_id")
      .eq("id", ticketData.tier_id)
      .single();
    if (tierData) {
      tier = tierData;
      if (tierData.event_id) {
        const { data: eventData } = await adminDb
          .from("events")
          .select("id, title, start_date, location_name, cover_image")
          .eq("id", tierData.event_id)
          .single();
        if (eventData) {
          event = eventData;
        }
      }
    }
  }

  // 5. Fetch sibling pending transfers sent to the same email by the same sender (para aceptar varias al tiempo)
  let siblingPendingTransfers: any[] = [];
  if (transfer.status === "pending" && transfer.to_email) {
    const { data: siblings } = await adminDb
      .from("ticket_transfers")
      .select("id, ticket_id, status, created_at")
      .ilike("to_email", transfer.to_email.trim())
      .eq("status", "pending")
      .neq("id", transfer.id);

    siblingPendingTransfers = siblings || [];
  }

  // 6. Fetch sender user details cleanly
  let senderName = "Un usuario de Bassfactory";
  if (transfer.from_user_id) {
    const { data: senderUser } = await adminDb.auth.admin.getUserById(
      transfer.from_user_id
    );
    if (senderUser?.user) {
      senderName =
        senderUser.user.user_metadata?.name ||
        senderUser.user.user_metadata?.full_name ||
        senderUser.user.email ||
        "Un usuario de Bassfactory";
    }
  }

  return (
    <TransferAcceptClient
      transfer={transfer}
      siblingPendingTransfers={siblingPendingTransfers}
      tier={tier}
      event={event}
      senderName={senderName}
      currentUserEmail={user.email || ""}
    />
  );
}
