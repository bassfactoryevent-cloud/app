import { createClient } from "@/utils/supabase/server";
import EventsClient from "./EventsClient";

export default async function AdminEvents() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*, ticket_tiers(id), orders(id)")
    .order("created_at", { ascending: false });

  return (
  return (
    <EventsClient initialEvents={events || []} error={error} />
  );
}
