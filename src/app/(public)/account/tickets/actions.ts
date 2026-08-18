"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { getTransferInitiatedEmail } from "@/utils/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bassfactory.co";

export async function initiateTransfer(ticketId: string, name: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para transferir una boleta.");
  }

  // Verificar que el ticket pertenezca al usuario
  const { data: ticket } = await supabase.from("tickets").select(`
    id, 
    user_id, 
    ticket_tiers!inner(events!inner(title, image_url))
  `).eq("id", ticketId).single();
  
  if (!ticket || ticket.user_id !== user.id) {
    throw new Error("No tienes permiso para modificar esta boleta.");
  }

  // Verificar si ya hay una transferencia pendiente
  const { data: pendingTransfer } = await supabase
    .from("ticket_transfers")
    .select("id")
    .eq("ticket_id", ticketId)
    .eq("status", "pending")
    .single();

  if (pendingTransfer) {
    throw new Error("Ya existe una transferencia en curso para esta boleta.");
  }

  // Crear la transferencia
  const { data: transfer, error } = await supabase
    .from("ticket_transfers")
    .insert([{
      ticket_id: ticketId,
      from_user_id: user.id,
      to_email: email,
      to_name: name,
      status: 'pending'
    }])
    .select("id")
    .single();

  if (error || !transfer) {
    console.error("Transfer error", error);
    throw new Error("Error al iniciar la transferencia.");
  }

  const t = ticket as any;
  const eventTitle = Array.isArray(t.ticket_tiers?.events) ? t.ticket_tiers.events[0]?.title : t.ticket_tiers?.events?.title;
  
  // Enviar correo de invitación
  if (process.env.RESEND_API_KEY) {
    await resend.emails.send({
      from: "Bassfactory Tickets <tickets@bassfactory.co>",
      to: email,
      subject: `Alguien te ha enviado una entrada para ${eventTitle}`,
      html: getTransferInitiatedEmail(
        name, 
        user.user_metadata?.name || 'Alguien', 
        eventTitle, 
        `${APP_URL}/account/tickets/transfer/${transfer.id}`
      )
    });
  }

  revalidatePath("/account/tickets");
  return { success: true };
}

export async function cancelTransfer(transferId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autorizado");

  const { data: transfer } = await supabase.from("ticket_transfers").select("id, from_user_id, status").eq("id", transferId).single();
  
  if (!transfer || transfer.from_user_id !== user.id) {
    throw new Error("No autorizado para cancelar esta transferencia");
  }

  if (transfer.status !== 'pending') {
    throw new Error("La transferencia ya no está pendiente");
  }

  const { error } = await supabase.from("ticket_transfers").update({ status: 'cancelled' }).eq("id", transferId);
  
  if (error) throw new Error("Error cancelando la transferencia");

  revalidatePath("/account/tickets");
  return { success: true };
}
