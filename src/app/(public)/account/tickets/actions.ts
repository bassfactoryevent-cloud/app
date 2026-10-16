"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import {
  getTransferInitiatedEmail,
  getTransferAcceptedEmail,
  getAppUrl,
} from "@/utils/emailTemplates";
import { getAdminClient } from "@/utils/supabase/admin";
import {
  isTicketOwnedByUser,
  getUserTicketsData,
  UserTicketsPayload,
} from "@/utils/userTickets";

const adminDb = getAdminClient();
const resend = new Resend(process.env.RESEND_API_KEY || "");
const APP_URL = getAppUrl();

export async function getLiveAccountTicketsAction(): Promise<{
  success: boolean;
  data?: UserTicketsPayload;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false };

    const data = await getUserTicketsData({ id: user.id, email: user.email });
    return { success: true, data };
  } catch (err) {
    console.error("Error in getLiveAccountTicketsAction:", err);
    return { success: false };
  }
}

export async function initiateTransfer(
  ticketId: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  return initiateBatchTransfer([ticketId], name, email);
}

export async function initiateBatchTransfer(
  ticketIds: string[],
  name: string,
  email: string
): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para transferir boletas.",
      };
    }

    const uniqueTicketIds = Array.from(new Set((ticketIds || []).filter(Boolean)));
    if (uniqueTicketIds.length === 0) {
      return {
        success: false,
        error: "Selecciona al menos una boleta para transferir.",
      };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const currentUserEmail = (user.email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanName) {
      return {
        success: false,
        error: "Por favor completa el nombre y el correo electrónico del destinatario.",
      };
    }

    if (cleanEmail === currentUserEmail) {
      return {
        success: false,
        error: "No puedes transferirte boletas a tu propio correo electrónico.",
      };
    }

    // 1. Obtener órdenes del usuario únicamente para validar compras como invitado sin user_id/assigned_email
    const { data: userOrders } = await adminDb
      .from("merch_orders")
      .select("id")
      .or(
        currentUserEmail
          ? `user_id.eq.${user.id},customer_email.ilike.${currentUserEmail}`
          : `user_id.eq.${user.id}`
      );
    const userOrderIdsSet = new Set<string>((userOrders || []).map((o: any) => o.id));

    // 2. Obtener todas las boletas seleccionadas
    const { data: tickets, error: ticketsError } = await adminDb
      .from("tickets")
      .select("id, user_id, assigned_email, tier_id, order_id, status")
      .in("id", uniqueTicketIds);

    if (ticketsError || !tickets || tickets.length !== uniqueTicketIds.length) {
      return {
        success: false,
        error: "Una o más boletas seleccionadas no fueron encontradas en el sistema.",
      };
    }

    // 3. Validar propiedad estricta y estado de cada boleta
    for (const ticket of tickets) {
      const shortId = ticket.id.slice(0, 8).toUpperCase();
      const isOwned = isTicketOwnedByUser(ticket, user.id, currentUserEmail, userOrderIdsSet);

      if (!isOwned) {
        return {
          success: false,
          error: `La boleta #${shortId} ya no está en tu posesión (ya fue transferida y aceptada por otro usuario).`,
        };
      }

      if ((ticket.assigned_email || "").trim().toLowerCase() === cleanEmail) {
        return {
          success: false,
          error: `La boleta #${shortId} ya pertenece a ${cleanEmail}.`,
        };
      }

      if (ticket.status === "scanned" || ticket.status === "used") {
        return {
          success: false,
          error: `La boleta #${shortId} ya fue validada en puerta y no puede ser transferida.`,
        };
      }

      if (ticket.status !== "valid") {
        return {
          success: false,
          error: `La boleta #${shortId} no se encuentra activa para transferir (Estado: ${ticket.status}).`,
        };
      }
    }

    // 4. Verificar si alguna ya tiene una transferencia pendiente activa
    const { data: existingTransfers } = await adminDb
      .from("ticket_transfers")
      .select("id, ticket_id, status, created_at, to_email")
      .in("ticket_id", uniqueTicketIds)
      .eq("status", "pending");

    if (existingTransfers && existingTransfers.length > 0) {
      const expiredIds: string[] = [];
      for (const existing of existingTransfers) {
        const isExpired =
          Date.now() - new Date(existing.created_at).getTime() > 48 * 60 * 60 * 1000;
        if (isExpired) {
          expiredIds.push(existing.id);
        } else {
          const shortId = existing.ticket_id.slice(0, 8).toUpperCase();
          return {
            success: false,
            error: `La boleta #${shortId} ya tiene una transferencia activa enviada a ${existing.to_email}. Cancela primero la anterior si deseas enviarla a otra persona.`,
          };
        }
      }
      if (expiredIds.length > 0) {
        await adminDb
          .from("ticket_transfers")
          .update({ status: "expired", updated_at: new Date().toISOString() })
          .in("id", expiredIds);
      }
    }

    // Asegurar que las boletas tengan user_id del titular actual antes de transferir
    await adminDb
      .from("tickets")
      .update({ user_id: user.id })
      .in("id", uniqueTicketIds);

    // 5. Crear los registros de transferencia en lote
    const rowsToInsert = uniqueTicketIds.map((tId) => ({
      ticket_id: tId,
      from_user_id: user.id,
      to_email: cleanEmail,
      to_name: cleanName,
      status: "pending",
    }));

    const { data: insertedTransfers, error: transferError } = await adminDb
      .from("ticket_transfers")
      .insert(rowsToInsert)
      .select("id, ticket_id");

    if (transferError || !insertedTransfers || insertedTransfers.length === 0) {
      console.error("Transfer creation error:", transferError);
      return {
        success: false,
        error: "Error al crear la solicitud de transferencia.",
      };
    }

    // 6. Obtener título del evento para el correo y revalidación
    let eventTitle = "Evento Bassfactory";
    let eventId: string | null = null;
    const firstTierId = tickets.find((t: any) => t.tier_id)?.tier_id;
    if (firstTierId) {
      const { data: tier } = await adminDb
        .from("ticket_tiers")
        .select("name, event_id")
        .eq("id", firstTierId)
        .single();

      if (tier?.event_id) {
        eventId = tier.event_id;
        const { data: ev } = await adminDb
          .from("events")
          .select("title")
          .eq("id", tier.event_id)
          .single();
        if (ev?.title) eventTitle = ev.title;
      }
    }

    // 7. Enviar correo de invitación (con soporte para 1 o múltiples boletas)
    if (process.env.RESEND_API_KEY) {
      try {
        const senderDisplayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          "Un amigo";
        const firstTransferId = insertedTransfers[0].id;
        const count = insertedTransfers.length;

        await resend.emails.send({
          from: "Bassfactory Tickets <tickets@bassfactory.co>",
          to: cleanEmail,
          subject:
            count > 1
              ? `¡Tienes ${count} entradas para ${eventTitle}! - Bassfactory`
              : `¡Tienes una entrada para ${eventTitle}! - Bassfactory`,
          html: getTransferInitiatedEmail(
            cleanName,
            senderDisplayName,
            eventTitle,
            `${APP_URL}/account/tickets/transfer/${firstTransferId}`,
            count
          ),
        });
      } catch (emailErr) {
        console.error("Error sending transfer email:", emailErr);
      }
    }

    revalidatePath("/account/tickets");
    revalidatePath("/account");
    if (eventId) {
      revalidatePath(`/admin/events/${eventId}/dashboard`);
    }

    return { success: true, count: insertedTransfers.length };
  } catch (err: any) {
    console.error("Unexpected error in initiateBatchTransfer:", err);
    return {
      success: false,
      error: err.message || "Error inesperado al iniciar la transferencia.",
    };
  }
}

export async function cancelTransfer(
  transferId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const { data: transfer, error: transferErr } = await adminDb
      .from("ticket_transfers")
      .select("id, from_user_id, ticket_id, status")
      .eq("id", transferId)
      .single();

    if (transferErr || !transfer) {
      return { success: false, error: "Transferencia no encontrada." };
    }

    if (transfer.status === "accepted") {
      revalidatePath("/account/tickets");
      return {
        success: false,
        error: "Esta boleta ya fue aceptada por el destinatario y ya no puede cancelarse.",
      };
    }

    if (transfer.status !== "pending") {
      revalidatePath("/account/tickets");
      return {
        success: false,
        error: "La transferencia ya fue resuelta o no está pendiente.",
      };
    }

    // Verificar propiedad actual
    const { data: ticket } = await adminDb
      .from("tickets")
      .select("id, user_id, assigned_email, order_id, tier_id")
      .eq("id", transfer.ticket_id)
      .single();

    const currentUserEmail = (user.email || "").trim().toLowerCase();
    const isSender = transfer.from_user_id === user.id;
    const isTicketHolder =
      ticket &&
      ((ticket.user_id === user.id &&
        (!ticket.assigned_email ||
          ticket.assigned_email.trim().toLowerCase() === currentUserEmail)) ||
        ticket.assigned_email?.trim().toLowerCase() === currentUserEmail);

    if (!isSender && !isTicketHolder) {
      return {
        success: false,
        error: "No estás autorizado para cancelar esta transferencia.",
      };
    }

    const { error: updateError } = await adminDb
      .from("ticket_transfers")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", transferId)
      .eq("status", "pending");

    if (updateError) {
      return {
        success: false,
        error: "Error cancelando la transferencia en la base de datos.",
      };
    }

    revalidatePath("/account/tickets");
    revalidatePath("/account");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in cancelTransfer:", err);
    return {
      success: false,
      error: err.message || "Error al cancelar la transferencia.",
    };
  }
}

export async function acceptIncomingTransfersAction(
  transferIdsInput: string | string[]
): Promise<{ success: boolean; error?: string; acceptedCount?: number }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Debes iniciar sesión para aceptar tus boletas.",
      };
    }

    const ids = Array.isArray(transferIdsInput)
      ? Array.from(new Set(transferIdsInput.filter(Boolean)))
      : [transferIdsInput].filter(Boolean);

    if (ids.length === 0) {
      return { success: false, error: "No se especificaron transferencias para aceptar." };
    }

    const cleanUserEmail = (user.email || "").trim().toLowerCase();

    const { data: transfers, error: fetchErr } = await adminDb
      .from("ticket_transfers")
      .select("id, status, ticket_id, from_user_id, to_email, to_name, created_at")
      .in("id", ids);

    if (fetchErr || !transfers || transfers.length === 0) {
      return { success: false, error: "Transferencia no encontrada." };
    }

    // Validar que el usuario actual sea el destinatario legítimo
    for (const tr of transfers) {
      if ((tr.to_email || "").trim().toLowerCase() !== cleanUserEmail) {
        return {
          success: false,
          error: `Esta entrada fue enviada a ${tr.to_email}. Debes iniciar sesión con esa cuenta (${tr.to_email}) para aceptarla.`,
        };
      }
    }

    const pendingTransfers = transfers.filter((tr: any) => tr.status === "pending");
    if (pendingTransfers.length === 0) {
      revalidatePath("/account/tickets");
      return {
        success: false,
        error: "Esta transferencia ya fue aceptada, expiró o fue cancelada.",
      };
    }

    const pendingIds = pendingTransfers.map((tr: any) => tr.id);
    const ticketIds = Array.from(new Set(pendingTransfers.map((tr: any) => tr.ticket_id)));
    const nowIso = new Date().toISOString();

    // 1. Marcar transferencias como 'accepted' atómicamente
    const { data: updatedTransfers, error: updateTrErr } = await adminDb
      .from("ticket_transfers")
      .update({ status: "accepted", updated_at: nowIso })
      .in("id", pendingIds)
      .eq("status", "pending")
      .select("id, ticket_id, from_user_id, to_name, to_email");

    if (updateTrErr || !updatedTransfers || updatedTransfers.length === 0) {
      return {
        success: false,
        error: "La transferencia ya fue procesada o cancelada.",
      };
    }

    const acceptedTicketIds = updatedTransfers.map((u: any) => u.ticket_id);

    // 2. Cancelar/limpiar cualquier otra transferencia pendiente huérfana para esas mismas boletas
    await adminDb
      .from("ticket_transfers")
      .delete()
      .in("ticket_id", acceptedTicketIds)
      .eq("status", "pending");

    // 3. Obtener perfil del receptor para su nombre oficial
    const { data: receiverProfile } = await adminDb
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const receiverName =
      receiverProfile?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      updatedTransfers[0].to_name ||
      cleanUserEmail;

    // 4. Actualizar propietario de las boletas y rotar el qr_hash criptográfico por seguridad antifraude
    const crypto = await import("crypto");
    for (const tId of acceptedTicketIds) {
      const newRaw = `${tId}-${user.id}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const newQrHash = crypto.createHash("sha256").update(newRaw).digest("hex");

      const { error: ticketUpdateErr } = await adminDb
        .from("tickets")
        .update({
          user_id: user.id,
          assigned_name: receiverName,
          assigned_email: cleanUserEmail,
          qr_hash: newQrHash,
          transferred_at: nowIso,
          qr_dispatched: false,
        })
        .eq("id", tId);

      if (ticketUpdateErr) {
        console.error("Error updating ticket ownership:", ticketUpdateErr);
        return {
          success: false,
          error: "Error asignando la propiedad de las boletas.",
        };
      }
    }

    // 5. Obtener información del evento y notificar al emisor
    let eventTitle = "Evento Bassfactory";
    let eventId: string | null = null;
    const { data: sampleTicket } = await adminDb
      .from("tickets")
      .select("tier_id")
      .eq("id", acceptedTicketIds[0])
      .single();

    if (sampleTicket?.tier_id) {
      const { data: tier } = await adminDb
        .from("ticket_tiers")
        .select("event_id")
        .eq("id", sampleTicket.tier_id)
        .single();
      if (tier?.event_id) {
        eventId = tier.event_id;
        const { data: ev } = await adminDb
          .from("events")
          .select("title")
          .eq("id", tier.event_id)
          .single();
        if (ev?.title) eventTitle = ev.title;
      }
    }

    const fromUserId = updatedTransfers[0].from_user_id;
    if (fromUserId && process.env.RESEND_API_KEY) {
      try {
        const { data: senderUser } = await adminDb.auth.admin.getUserById(fromUserId);
        const senderEmail = senderUser?.user?.email;
        const senderName =
          senderUser?.user?.user_metadata?.name ||
          senderUser?.user?.user_metadata?.full_name ||
          senderEmail ||
          "Raver";

        if (senderEmail) {
          await resend.emails.send({
            from: "Bassfactory Tickets <tickets@bassfactory.co>",
            to: senderEmail,
            subject:
              updatedTransfers.length > 1
                ? `¡${updatedTransfers.length} boletas aceptadas por ${receiverName}!`
                : `¡Boleta aceptada por ${receiverName}!`,
            html: getTransferAcceptedEmail(
              senderName,
              receiverName,
              eventTitle,
              updatedTransfers.length
            ),
          });
        }
      } catch (mailErr) {
        console.error("Error sending transfer accepted email:", mailErr);
      }
    }

    revalidatePath("/account/tickets");
    revalidatePath("/account");
    for (const id of ids) {
      revalidatePath(`/account/tickets/transfer/${id}`);
    }
    if (eventId) {
      revalidatePath(`/admin/events/${eventId}/dashboard`);
    }

    return { success: true, acceptedCount: updatedTransfers.length };
  } catch (err: any) {
    console.error("Unexpected error in acceptIncomingTransfersAction:", err);
    return {
      success: false,
      error: err.message || "Error al aceptar las boletas.",
    };
  }
}

export async function rejectIncomingTransfersAction(
  transferIdsInput: string | string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const ids = Array.isArray(transferIdsInput)
      ? Array.from(new Set(transferIdsInput.filter(Boolean)))
      : [transferIdsInput].filter(Boolean);

    if (ids.length === 0) return { success: false, error: "ID requerido." };

    const cleanUserEmail = (user.email || "").trim().toLowerCase();

    const { data: transfers } = await adminDb
      .from("ticket_transfers")
      .select("id, ticket_id, from_user_id, to_email, to_name, status")
      .in("id", ids);

    if (!transfers || transfers.length === 0) {
      return { success: false, error: "Transferencia no encontrada." };
    }

    for (const tr of transfers) {
      if ((tr.to_email || "").trim().toLowerCase() !== cleanUserEmail) {
        return {
          success: false,
          error: `Solo el destinatario (${tr.to_email}) puede rechazar esta transferencia.`,
        };
      }
    }

    await adminDb
      .from("ticket_transfers")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .in("id", ids)
      .eq("status", "pending");

    revalidatePath("/account/tickets");
    revalidatePath("/account");
    for (const id of ids) {
      revalidatePath(`/account/tickets/transfer/${id}`);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in rejectIncomingTransfersAction:", err);
    return {
      success: false,
      error: err.message || "Error al rechazar la transferencia.",
    };
  }
}
