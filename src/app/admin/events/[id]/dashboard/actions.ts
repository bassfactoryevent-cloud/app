"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import crypto from "crypto";
import { getCourtesyInvitationEmail } from "@/utils/emailTemplates";

const adminDb = getAdminClient();
const resend = new Resend(process.env.RESEND_API_KEY || "");

export interface IssueCourtesyParams {
  eventId: string;
  tierId: string;
  recipientName: string;
  recipientEmail: string;
  quantity: number;
  reason: string;
  reasonNote?: string;
  lockUntilEvent: boolean;
  sendEmail: boolean;
}

export async function issueCourtesyTickets(params: IssueCourtesyParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para emitir cortesías." };
    }

    // Validar rol de administrador
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
      return { success: false, error: "No tienes permisos de administrador para emitir cortesías." };
    }

    const {
      eventId,
      tierId,
      recipientName,
      recipientEmail,
      quantity,
      reason,
      reasonNote,
      lockUntilEvent,
      sendEmail
    } = params;

    const cleanName = recipientName.trim();
    const cleanEmail = recipientEmail.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      return { success: false, error: "El nombre y el correo electrónico del titular son obligatorios." };
    }

    const qty = Math.max(1, Math.min(Number(quantity) || 1, 50));

    // 1. Obtener Evento y Localidad
    const [
      { data: event, error: eventErr },
      { data: tier, error: tierErr },
      { count: currentEventTicketsCount }
    ] = await Promise.all([
      adminDb.from("events").select("id, title, start_date, location_name, total_capacity").eq("id", eventId).single(),
      adminDb.from("ticket_tiers").select("id, name, price, quantity_available").eq("id", tierId).single(),
      adminDb.from("tickets").select("*", { count: "exact", head: true }).in("tier_id", (
        await adminDb.from("ticket_tiers").select("id").eq("event_id", eventId)
      ).data?.map(t => t.id) || [])
    ]);

    if (eventErr || !event) {
      return { success: false, error: "Evento no encontrado." };
    }

    if (tierErr || !tier) {
      return { success: false, error: "Localidad de boleta no encontrada." };
    }

    // 2. Control de Aforo
    const currentCount = currentEventTicketsCount || 0;
    if (event.total_capacity && event.total_capacity > 0) {
      if (currentCount + qty > event.total_capacity) {
        const available = Math.max(0, event.total_capacity - currentCount);
        return { 
          success: false, 
          error: `Capacidad excedida: El evento tiene un aforo máximo de ${event.total_capacity} personas y solo quedan ${available} cupos disponibles.` 
        };
      }
    }

    // 3. Buscar si el usuario ya existe en auth
    let recipientUserId: string | null = null;
    try {
      const { data: authUsers } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const match = authUsers?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
      if (match) recipientUserId = match.id;
    } catch {
      // Ignorar si no se puede listar
    }

    // 4. Crear Orden de Cortesía ($0 COP) en merch_orders
    const courtesyOrderId = crypto.randomUUID();
    const shortEventId = event.id.slice(0, 4).toUpperCase();
    const shortRandom = crypto.randomBytes(3).toString("hex").toUpperCase();
    const paymentId = `BF-CORT-${shortEventId}-${shortRandom}`;
    const cleanReasonTag = reasonNote ? `${reason} (${reasonNote.trim()})` : reason;

    const { error: orderError } = await adminDb.from("merch_orders").insert({
      id: courtesyOrderId,
      user_id: recipientUserId,
      customer_name: cleanName,
      customer_email: cleanEmail,
      total_amount: 0,
      status: "paid",
      payment_provider: "courtesy",
      payment_id: paymentId,
      shipping_city: cleanReasonTag,
      shipping_address: `Emitido por admin: ${user.email}`
    });

    if (orderError) {
      console.error("Error creating courtesy order:", orderError);
      return { success: false, error: "Error al registrar la orden de cortesía en el sistema." };
    }

    // 5. Generar los Tickets Criptográficos
    const ticketsToInsert: any[] = [];
    for (let i = 0; i < qty; i++) {
      const rawString = `${courtesyOrderId}-${tierId}-${i}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const qrHash = crypto.createHash("sha256").update(rawString).digest("hex");

      ticketsToInsert.push({
        order_id: courtesyOrderId,
        tier_id: tierId,
        qr_hash: qrHash,
        status: "valid",
        assigned_name: cleanName,
        assigned_email: cleanEmail,
        user_id: recipientUserId,
        qr_dispatched: !lockUntilEvent // Si lockUntilEvent es true, qr_dispatched = false (bloqueado)
      });
    }

    const { error: ticketsError } = await adminDb.from("tickets").insert(ticketsToInsert);
    if (ticketsError) {
      console.error("Error inserting courtesy tickets:", ticketsError);
      return { success: false, error: "Error al registrar las entradas de cortesía." };
    }

    // 6. Descontar del Aforo de la Localidad (si está configurado)
    if (tier.quantity_available !== null && tier.quantity_available > 0) {
      await adminDb
        .from("ticket_tiers")
        .update({ quantity_available: Math.max(0, tier.quantity_available - qty) })
        .eq("id", tierId);
    }

    // 7. Enviar Correo de Invitación Oficial
    if (sendEmail && process.env.RESEND_API_KEY) {
      try {
        const eventDateStr = event.start_date
          ? new Date(event.start_date).toLocaleDateString("es-CO", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })
          : "Fecha por confirmar";

        const emailHtml = getCourtesyInvitationEmail(
          cleanName,
          event.title,
          tier.name,
          eventDateStr,
          event.location_name || "Lugar del Evento",
          cleanReasonTag,
          lockUntilEvent
        );

        await resend.emails.send({
          from: "Bassfactory Oficial <tickets@bassfactory.co>",
          to: cleanEmail,
          subject: `🎟️ Invitación Oficial: Tu Cortesía para ${event.title}`,
          html: emailHtml
        });
      } catch (mailErr) {
        console.warn("Notice: could not dispatch courtesy email:", mailErr);
      }
    }

    revalidatePath(`/admin/events/${eventId}/dashboard`);
    revalidatePath(`/admin/events`);
    revalidatePath(`/admin/finances`);

    return { 
      success: true, 
      count: qty, 
      courtesyOrderId,
      paymentId
    };
  } catch (err: any) {
    console.error("Error issuing courtesy tickets:", err);
    return { success: false, error: err.message || "Error al procesar la emisión de cortesías." };
  }
}

export async function toggleCourtesyLock(ticketId: string, eventId: string, currentDispatched: boolean) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autorizado" };

    const { error } = await adminDb
      .from("tickets")
      .update({ qr_dispatched: !currentDispatched })
      .eq("id", ticketId);

    if (error) throw error;

    revalidatePath(`/admin/events/${eventId}/dashboard`);
    return { success: true, isDispatched: !currentDispatched };
  } catch (err: any) {
    return { success: false, error: err.message || "Error al actualizar estado del QR." };
  }
}
