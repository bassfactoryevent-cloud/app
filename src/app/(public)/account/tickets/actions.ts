"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignTicket(ticketId: string, name: string, email: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Debes iniciar sesión para asignar una boleta.");
  }

  // Verificar que el ticket pertenezca al usuario
  const { data: ticket } = await supabase.from("tickets").select("id, user_id").eq("id", ticketId).single();
  
  if (!ticket || ticket.user_id !== user.id) {
    throw new Error("No tienes permiso para modificar esta boleta.");
  }

  // Actualizar la boleta
  const { error } = await supabase
    .from("tickets")
    .update({
      assigned_name: name,
      assigned_email: email,
      transferred_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) {
    console.error("Assign error", error);
    throw new Error("Error al asignar la boleta.");
  }

  // Disparar envío inmediato de correo en background
  import("@/utils/sendTicketEmail").then(({ sendTicketEmail }) => {
    sendTicketEmail(ticketId, name, email).catch(console.error);
  });

  revalidatePath("/account/tickets");
  return { success: true };
}
