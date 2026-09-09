"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getTransferInitiatedEmail } from "@/utils/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_fallback");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bassfactory.co";

export async function initiateTransfer(ticketId: string, name: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para transferir una boleta.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanEmail || !cleanName) {
    throw new Error("Por favor completa el nombre y el correo electrónico de tu amigo.");
  }

  if (cleanEmail === user.email?.toLowerCase()) {
    throw new Error("No puedes transferirte una boleta a tu propio correo.");
  }

  // 1. Verificar que el ticket pertenezca al usuario (o su orden)
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, user_id, tier_id, order_id, status")
    .eq("id", ticketId)
    .single();
  
  if (ticketError || !ticket) {
    throw new Error("Boleta no encontrada.");
  }

  if (ticket.user_id !== user.id) {
    // Check if order belongs to user
    const { data: order } = await supabase
      .from("merch_orders")
      .select("id, user_id, customer_email")
      .eq("id", ticket.order_id)
      .single();

    if (!order || (order.user_id !== user.id && order.customer_email?.toLowerCase() !== user.email?.toLowerCase())) {
      throw new Error("No tienes permiso para modificar esta boleta.");
    }
  }

  if (ticket.status !== "valid") {
    throw new Error(`Esta boleta no se encuentra activa (Estado: ${ticket.status}).`);
  }

  // 2. Verificar si ya hay una transferencia pendiente
  const { data: existingTransfers } = await supabase
    .from("ticket_transfers")
    .select("id, status, created_at, to_email")
    .eq("ticket_id", ticketId)
    .eq("status", "pending");

  if (existingTransfers && existingTransfers.length > 0) {
    const existing = existingTransfers[0];
    const isExpired = (Date.now() - new Date(existing.created_at).getTime()) > 48 * 60 * 60 * 1000;

    if (isExpired) {
      // Auto-expire
      await supabase.from("ticket_transfers").update({ status: 'expired' }).eq("id", existing.id);
    } else {
      throw new Error(`Esta boleta ya tiene una transferencia en espera hacia ${existing.to_email}. Si deseas enviarla a otra persona, cancela primero la anterior.`);
    }
  }

  // 3. Crear la transferencia
  const { data: transfer, error: transferError } = await supabase
    .from("ticket_transfers")
    .insert([{
      ticket_id: ticketId,
      from_user_id: user.id,
      to_email: cleanEmail,
      to_name: cleanName,
      status: 'pending'
    }])
    .select("id")
    .single();

  if (transferError || !transfer) {
    console.error("Transfer creation error:", transferError);
    throw new Error("Error al iniciar la transferencia.");
  }

  // 4. Obtener título del evento para el correo
  let eventTitle = "Evento Bassfactory";
  if (ticket.tier_id) {
    const { data: tier } = await supabase
      .from("ticket_tiers")
      .select("name, events(title)")
      .eq("id", ticket.tier_id)
      .single();
    if (tier) {
      const ev = Array.isArray(tier.events) ? tier.events[0] : tier.events;
      if (ev?.title) eventTitle = ev.title;
    }
  }
  
  // 5. Enviar correo de invitación con aviso de 48 horas
  if (process.env.RESEND_API_KEY) {
    try {
      const senderDisplayName = user.user_metadata?.name || user.user_metadata?.full_name || "Un amigo";
      await resend.emails.send({
        from: "Bassfactory Tickets <tickets@bassfactory.co>",
        to: cleanEmail,
        subject: `¡Tienes una entrada para ${eventTitle}! - Bassfactory`,
        html: getTransferInitiatedEmail(
          cleanName, 
          senderDisplayName, 
          eventTitle, 
          `${APP_URL}/account/tickets/transfer/${transfer.id}`
        )
      });
    } catch (emailErr) {
      console.error("Error sending transfer email:", emailErr);
    }
  }

  revalidatePath("/account/tickets");
  return { success: true };
}

export async function cancelTransfer(transferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  const { data: transfer } = await supabase
    .from("ticket_transfers")
    .select("id, from_user_id, status")
    .eq("id", transferId)
    .single();
  
  if (!transfer || transfer.from_user_id !== user.id) {
    throw new Error("No estás autorizado para cancelar esta transferencia.");
  }

  if (transfer.status !== 'pending') {
    throw new Error("La transferencia ya fue resuelta o no está pendiente.");
  }

  const { error } = await supabase
    .from("ticket_transfers")
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq("id", transferId);
  
  if (error) throw new Error("Error cancelando la transferencia.");

  revalidatePath("/account/tickets");
  return { success: true };
}
