"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { sendTicketEmail } from "@/utils/sendTicketEmail";

export type FreeRegistrationResult =
  | {
      success: true;
      orderId: string;
      paymentId: string;
      ticketIds: string[];
      ticketCodes: string[];
      eventTitle: string;
      name: string;
      email: string;
      emailSent: boolean;
    }
  | {
      success: false;
      error: string;
      requiresAuth?: boolean;
    };

export async function registerFreeEvent(input: {
  eventId: string;
  fullName: string;
  email: string;
}): Promise<FreeRegistrationResult> {
  try {
    // 0. Exigir que el usuario esté registrado y autenticado en Bassfactory
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        requiresAuth: true,
        error: "Debes crear una cuenta o iniciar sesión en Bassfactory antes de generar tu entrada gratuita.",
      };
    }

    const cleanName = (input.fullName || user.user_metadata?.full_name || user.user_metadata?.name || "").trim();
    const cleanEmail = (user.email || input.email || "").trim().toLowerCase();
    const qty = 1; // Estrictamente 1 cortesía personal e intransferible por persona

    if (!input.eventId) {
      return { success: false, error: "Evento no especificado." };
    }

    if (cleanName.length < 2) {
      return { success: false, error: "Por favor ingresa tu nombre completo." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    const adminDb = getAdminClient();

    // 1. Verificar que el evento existe, está publicado y es gratuito
    const { data: event, error: eventError } = await adminDb
      .from("events")
      .select("id, title, slug, status, is_free, start_date, location_name")
      .eq("id", input.eventId)
      .single();

    if (eventError || !event) {
      return { success: false, error: "Evento no encontrado." };
    }

    if (event.status !== "published") {
      return { success: false, error: "El registro para este evento no está disponible actualmente." };
    }

    if (!event.is_free) {
      return { success: false, error: "Este evento no es de entrada gratuita." };
    }

    // 2. Obtener o crear una localidad gratuita para asociar la boleta
    const { data: existingTiers } = await adminDb
      .from("ticket_tiers")
      .select("id, name, price, quantity_available")
      .eq("event_id", event.id)
      .order("price", { ascending: true });

    // 2.1 Restricción estricta: máximo 1 cortesía por usuario o correo para este evento
    const eventTierIds = (existingTiers || []).map((t: any) => t.id);
    if (eventTierIds.length > 0) {
      const { data: alreadyRegistered } = await adminDb
        .from("tickets")
        .select("id")
        .in("tier_id", eventTierIds)
        .or(`user_id.eq.${user.id},assigned_email.ilike.${cleanEmail}`)
        .in("status", ["valid", "scanned"])
        .limit(1);

      if (alreadyRegistered && alreadyRegistered.length > 0) {
        return {
          success: false,
          error:
            "Ya tienes una entrada registrada para este evento. Solo se permite 1 cortesía personal por cuenta; si vas con amigos, cada uno debe registrarse con su propia cuenta.",
        };
      }
    }

    let tier =
      existingTiers?.find((t: any) => Number(t.price) === 0 && (t.quantity_available === null || t.quantity_available >= qty)) ||
      existingTiers?.find((t: any) => t.quantity_available === null || t.quantity_available >= qty) ||
      existingTiers?.[0];

    if (!tier) {
      const { data: createdTier, error: tierError } = await adminDb
        .from("ticket_tiers")
        .insert({
          event_id: event.id,
          name: "Entrada General (Gratis)",
          price: 0,
          quantity_available: 1000,
        })
        .select("id, name, price, quantity_available")
        .single();

      if (tierError || !createdTier) {
        console.error("Error creating default free tier:", tierError);
        return { success: false, error: "No se pudo inicializar la localidad del evento." };
      }
      tier = createdTier;
    }

    if (typeof tier.quantity_available === "number" && tier.quantity_available < qty) {
      return {
        success: false,
        error: tier.quantity_available <= 0
          ? "Aforo agotado para este evento."
          : `Solo quedan ${tier.quantity_available} entradas disponibles.`,
      };
    }

    // 3. Usuario autenticado garantizado
    const userId = user.id;
    const ticketUserId = user.id;

    // 4. Crear orden gratuita ($0 COP) en merch_orders
    const orderId = crypto.randomUUID();
    const shortEventId = event.id.slice(0, 4).toUpperCase();
    const shortRandom = crypto.randomBytes(3).toString("hex").toUpperCase();
    const paymentId = `BF-FREE-${shortEventId}-${shortRandom}`;

    const { error: orderError } = await adminDb.from("merch_orders").insert({
      id: orderId,
      user_id: userId,
      customer_name: cleanName,
      customer_email: cleanEmail,
      subtotal_amount: 0,
      shipping_cost: 0,
      total_amount: 0,
      status: "paid",
      payment_provider: "free_event",
      payment_id: paymentId,
      shipping_address: "Digital / Registro Gratuito",
      shipping_city: "Registro Gratuito",
      shipping_country: "Colombia",
    });

    if (orderError) {
      console.error("Free event order creation error:", orderError);
      return { success: false, error: "No se pudo registrar tu solicitud. Inténtalo de nuevo." };
    }

    // 5. Generar las boletas válidas con su hash QR criptográfico
    const ticketsToInsert = Array.from({ length: qty }, (_, i) => {
      const rawString = `${orderId}-${tier.id}-${i}-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
      const qrHash = crypto.createHash("sha256").update(rawString).digest("hex");

      return {
        order_id: orderId,
        tier_id: tier.id,
        qr_hash: qrHash,
        status: "valid",
        assigned_name: cleanName,
        assigned_email: cleanEmail,
        user_id: ticketUserId,
        qr_dispatched: false,
      };
    });

    const { data: insertedTickets, error: ticketsError } = await adminDb
      .from("tickets")
      .insert(ticketsToInsert)
      .select("id");

    if (ticketsError || !insertedTickets || insertedTickets.length === 0) {
      console.error("Free event tickets insert error:", ticketsError);
      await adminDb.from("merch_orders").delete().eq("id", orderId);
      return { success: false, error: "No se pudieron generar tus entradas. Inténtalo de nuevo." };
    }

    // 6. Descontar aforo disponible
    if (typeof tier.quantity_available === "number") {
      await adminDb
        .from("ticket_tiers")
        .update({ quantity_available: Math.max(0, tier.quantity_available - qty) })
        .eq("id", tier.id);
    }

    // 7. Enviar correo con PDF y código QR vía Resend
    let emailsSent = 0;
    for (const t of insertedTickets) {
      const sent = await sendTicketEmail(t.id, cleanName, cleanEmail);
      if (sent) emailsSent += 1;
    }

    revalidatePath(`/events/${event.slug}`);
    revalidatePath("/account/tickets");

    return {
      success: true,
      orderId,
      paymentId,
      ticketIds: insertedTickets.map((t: any) => t.id),
      ticketCodes: insertedTickets.map((t: any) => `#${t.id.slice(0, 8).toUpperCase()}`),
      eventTitle: event.title,
      name: cleanName,
      email: cleanEmail,
      emailSent: emailsSent === insertedTickets.length,
    };
  } catch (err) {
    console.error("registerFreeEvent unexpected error:", err);
    return { success: false, error: "Ocurrió un error inesperado. Por favor intenta de nuevo." };
  }
}
