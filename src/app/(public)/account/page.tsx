import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/utils/notifications";
import { getUserTicketsData } from "@/utils/userTickets";
import AccountOverviewClient from "./AccountOverviewClient";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const [userTicketsData, ordersCountRes, recentOrdersRes, upcomingEventsRes] =
    await Promise.all([
      getUserTicketsData({ id: user.id, email: user.email }),
      supabase
        .from("merch_orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("merch_orders")
        .select("id, total_amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("events")
        .select("id, title, slug, start_date, location_name, cover_image, description, event_djs(dj_id)")
        .eq("status", "published")
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(8),
    ]);

  const notifications = await getUserNotifications({
    id: user.id,
    email: user.email,
    role: profile?.role,
  });

  const meta = user.user_metadata || {};

  return (
    <AccountOverviewClient
      ticketsData={userTicketsData}
      ordersCount={ordersCountRes.count || 0}
      notificationsCount={notifications.length}
      recentOrders={recentOrdersRes.data || []}
      upcomingEvents={upcomingEventsRes.data || []}
      favoriteGenres={Array.isArray(meta.favorite_genres) ? meta.favorite_genres : []}
      followedDjs={Array.isArray(meta.followed_djs) ? meta.followed_djs : []}
    />
  );
}
