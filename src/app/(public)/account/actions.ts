"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { getUserTicketsData } from "@/utils/userTickets";
import { getUserNotifications } from "@/utils/notifications";

const adminDb = getAdminClient();

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
