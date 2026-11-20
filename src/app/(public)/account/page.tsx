import { createClient, getCachedUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getUserNotifications } from "@/utils/notifications";
import { getUserTicketsData } from "@/utils/userTickets";
import { getUpcomingCutoffIso } from "@/utils/eventTime";
import AccountOverviewClient from "./AccountOverviewClient";

export const dynamic = "force-dynamic";

export default async function AccountDashboardPage() {
  const [supabase, user] = await Promise.all([createClient(), getCachedUser()]);

  if (!user) {
    redirect("/login");
  }

  const [
    profileRes,
    userTicketsData,
    ordersCountRes,
    recentOrdersRes,
    upcomingEventsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle(),
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
      .gte("start_date", getUpcomingCutoffIso())
      .order("start_date", { ascending: true })
      .limit(8),
  ]);

  const notifications = await getUserNotifications({
    id: user.id,
    email: user.email,
    role: profileRes.data?.role,
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
