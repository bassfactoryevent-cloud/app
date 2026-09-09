"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getTransferInitiatedEmail } from "@/utils/emailTemplates";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_fallback");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bassfactory.co";

export async function initiateTransfer(ticketId: string, name: string, email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para transferir una boleta." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanName) {
      return { success: false, error: "Por favor completa el nombre y el correo electrónico de tu amigo." };
    }

    if (cleanEmail === user.email?.toLowerCase()) {
      return { success: false, error: "No puedes transferirte una boleta a tu propio correo." };
    }

    // 1. Obtener la boleta con adminDb para bypass de RLS y verificar propiedad
    const { data: ticket, error: ticketError } = await adminDb
      .from("tickets")
      .select("id, user_id, assigned_email, tier_id, order_id, status")
      .eq("id", ticketId)
      .single();
    
    if (ticketError || !ticket) {
      return { success: false, error: "Boleta no encontrada en el sistema." };
    }

    let isAuthorized = (ticket.user_id === user.id) || (ticket.assigned_email?.toLowerCase() === user.email?.toLowerCase());

    if (!isAuthorized && ticket.order_id) {
      // Verificar si la orden de compra le pertenece al usuario por user_id o customer_email
      const { data: order } = await adminDb
        .from("merch_orders")
        .select("id, user_id, customer_email")
        .eq("id", ticket.order_id)
        .single();

      if (order && (order.user_id === user.id || order.customer_email?.toLowerCase() === user.email?.toLowerCase())) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "No tienes permiso para transferir esta boleta." };
    }

    if (ticket.status !== "valid") {
      return { success: false, error: `Esta boleta no se encuentra activa (Estado: ${ticket.status}).` };
    }

    // 2. Verificar si ya hay una transferencia pendiente
    const { data: existingTransfers } = await adminDb
      .from("ticket_transfers")
      .select("id, status, created_at, to_email")
      .eq("ticket_id", ticketId)
      .eq("status", "pending");

    if (existingTransfers && existingTransfers.length > 0) {
      const existing = existingTransfers[0];
      const isExpired = (Date.now() - new Date(existing.created_at).getTime()) > 48 * 60 * 60 * 1000;

      if (isExpired) {
        // Auto-expirar la anterior
        await adminDb.from("ticket_transfers").update({ status: 'expired' }).eq("id", existing.id);
      } else {
        return { 
          success: false, 
          error: `Esta boleta ya tiene una transferencia activa enviada a ${existing.to_email}. Si deseas enviarla a otra persona, cancela primero la anterior.` 
        };
      }
    }

    // 3. Crear la transferencia con adminDb
    const { data: transfer, error: transferError } = await adminDb
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
      return { success: false, error: "Error al crear la solicitud de transferencia." };
    }

    // 4. Obtener título del evento de forma desacoplada
    let eventTitle = "Evento Bassfactory";
    if (ticket.tier_id) {
      const { data: tier } = await adminDb
        .from("ticket_tiers")
        .select("name, event_id")
        .eq("id", ticket.tier_id)
        .single();
      
      if (tier?.event_id) {
        const { data: ev } = await adminDb
          .from("events")
          .select("title")
          .eq("id", tier.event_id)
          .single();
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
  } catch (err: any) {
    console.error("Unexpected error in initiateTransfer:", err);
    return { success: false, error: err.message || "Error inesperado al iniciar la transferencia." };
  }
}

export async function cancelTransfer(transferId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "No autorizado." };

    const { data: transfer, error: transferErr } = await adminDb
      .from("ticket_transfers")
      .select("id, from_user_id, ticket_id, status")
      .eq("id", transferId)
      .single();
    
    if (transferErr || !transfer) {
      return { success: false, error: "Transferencia no encontrada." };
    }

    // Verificar si el usuario es el emisor o el dueño de la boleta
    let isOwner = transfer.from_user_id === user.id;

    if (!isOwner && transfer.ticket_id) {
      const { data: t } = await adminDb
        .from("tickets")
        .select("user_id, assigned_email")
        .eq("id", transfer.ticket_id)
        .single();
      if (t && (t.user_id === user.id || t.assigned_email?.toLowerCase() === user.email?.toLowerCase())) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return { success: false, error: "No estás autorizado para cancelar esta transferencia." };
    }

    if (transfer.status !== 'pending') {
      return { success: false, error: "La transferencia ya fue resuelta o no está pendiente." };
    }

    const { error: updateError } = await adminDb
      .from("ticket_transfers")
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq("id", transferId);
    
    if (updateError) {
      return { success: false, error: "Error cancelando la transferencia en la base de datos." };
    }

    revalidatePath("/account/tickets");
    return { success: true };
  } catch (err: any) {
    console.error("Unexpected error in cancelTransfer:", err);
    return { success: false, error: err.message || "Error al cancelar la transferencia." };
  }
}

