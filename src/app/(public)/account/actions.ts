"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { getUserTicketsData } from "@/utils/userTickets";
import { getUserNotifications } from "@/utils/notifications";
import { revalidatePath } from "next/cache";

const adminDb = getAdminClient();

/**
 * Permite al usuario autenticado corregir y confirmar su propio correo electrónico
 * instantáneamente en Supabase Auth, en sus órdenes y en sus boletas,
 * SIN enviar correos automáticos (cero consumo de cuota de Resend / SMTP).
 */
export async function updateMyEmailAction(newEmailInput: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Debes iniciar sesión para actualizar tu correo." };
    }

    const cleanNewEmail = (newEmailInput || "").trim().toLowerCase();
    const currentEmail = (user.email || "").trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanNewEmail || !emailRegex.test(cleanNewEmail)) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    if (cleanNewEmail === currentEmail) {
      return { success: false, error: "Ese ya es tu correo electrónico actual." };
    }

    // 1. Actualizar correo en Supabase Auth directamente con email_confirm: true (NO dispara correos SMTP)
    const { error: authUpdateErr } = await adminDb.auth.admin.updateUserById(user.id, {
      email: cleanNewEmail,
      email_confirm: true,
    });

    if (authUpdateErr) {
      const msg = (authUpdateErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("exists") || msg.includes("duplicate")) {
        return {
          success: false,
          error: "Ese correo electrónico ya está registrado en otra cuenta de Bassfactory.",
        };
      }
      return {
        success: false,
        error: authUpdateErr.message || "No se pudo actualizar el correo electrónico.",
      };
    }

    // 2. Sincronizar el nuevo correo en todas las boletas y órdenes del usuario
    await Promise.all([
      adminDb
        .from("tickets")
        .update({ assigned_email: cleanNewEmail })
        .eq("user_id", user.id),
      currentEmail
        ? adminDb
            .from("tickets")
            .update({ assigned_email: cleanNewEmail })
            .ilike("assigned_email", currentEmail)
        : Promise.resolve(),
      adminDb
        .from("merch_orders")
        .update({ customer_email: cleanNewEmail })
        .eq("user_id", user.id),
      currentEmail
        ? adminDb
            .from("merch_orders")
            .update({ customer_email: cleanNewEmail })
            .ilike("customer_email", currentEmail)
        : Promise.resolve(),
      currentEmail
        ? adminDb
            .from("ticket_transfers")
            .update({ to_email: cleanNewEmail })
            .ilike("to_email", currentEmail)
            .eq("status", "pending")
        : Promise.resolve(),
    ]);

    revalidatePath("/account");
    revalidatePath("/account/settings");
    revalidatePath("/account/tickets");
    revalidatePath("/account/orders");
    revalidatePath("/admin/users");

    return { success: true, email: cleanNewEmail };
  } catch (err: any) {
    console.error("Error in updateMyEmailAction:", err);
    return {
      success: false,
      error: err?.message || "Error inesperado al actualizar el correo.",
    };
  }
}

export interface AccountBadgesPayload {
  incomingTicketsCount: number;
  qrReadyTicketsCount: number;
  pendingOrdersCount: number;
  shippedOrdersCount: number;
  notificationsCount: number;
  latestNotificationAt: string | null;
  needsProfileSetup: boolean;
}

export async function getAccountBadgesAction(): Promise<AccountBadgesPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, ticketsData, ordersRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    getUserTicketsData({ id: user.id, email: user.email }),
    adminDb
      .from("merch_orders")
      .select("id, status, tracking_number")
      .or(`user_id.eq.${user.id},customer_email.ilike.${user.email || ""}`),
  ]);

  const notifications = await getUserNotifications({
    id: user.id,
    email: user.email,
    role: profileRes.data?.role,
  });

  const now = Date.now();
  const qrReadyTicketsCount = (ticketsData.tickets || []).filter((t: any) => {
    if (t.status === "scanned") return false;
    if (t.qr_dispatched) return true;
    const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
    const ev = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
    if (!ev?.start_date) return false;
    const startMs = new Date(ev.start_date).getTime();
    return startMs - now <= 24 * 60 * 60 * 1000 && startMs >= now - 12 * 60 * 60 * 1000;
  }).length;

  const orders = ordersRes.data || [];
  const pendingOrdersCount = orders.filter((o: any) => o.status === "pending").length;
  const shippedOrdersCount = orders.filter((o: any) => o.status === "shipped").length;

  const meta = user.user_metadata || {};
  const hasGenres =
    Array.isArray(meta.favorite_genres) && meta.favorite_genres.length > 0;
  const needsProfileSetup = !meta.raver_tag && !hasGenres;

  return {
    incomingTicketsCount: (ticketsData.incomingTransfers || []).length,
    qrReadyTicketsCount,
    pendingOrdersCount,
    shippedOrdersCount,
    notificationsCount: notifications.length,
    latestNotificationAt: notifications[0]?.createdAt || null,
    needsProfileSetup,
  };
}
