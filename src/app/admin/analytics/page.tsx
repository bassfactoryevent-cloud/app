import { getAdminClient } from "@/utils/supabase/admin";
import AnalyticsDashboardClient from "./AnalyticsDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const adminDb = getAdminClient();

  // Fetch pageviews sorted by created_at desc
  const { data: pageviews, error } = await adminDb
    .from("page_views")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    console.error("Error fetching pageviews:", error);
  }

  // Also fetch events list to map slugs to friendly event titles
  const { data: events } = await adminDb
    .from("events")
    .select("slug, title");

  const eventMap: Record<string, string> = {};
  (events || []).forEach((ev: any) => {
    if (ev.slug) {
      eventMap[`/events/${ev.slug}`] = `Evento: ${ev.title}`;
    }
  });

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "3rem" }}>
      <AnalyticsDashboardClient 
        initialPageviews={pageviews || []} 
        eventMap={eventMap}
      />
    </div>
  );
}
