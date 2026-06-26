import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EventFormClient from "../new/EventFormClient";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  
  // Fetch event details
  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      ticket_tiers(*),
      event_djs(dj_id),
      event_sponsors(sponsor_id)
    `)
    .eq("id", (await params).id)
    .single();

  if (!event) {
    notFound();
  }

  // Fetch all available DJs and Sponsors
  const { data: djs } = await supabase.from("djs").select("id, name").order("name");
  const { data: sponsors } = await supabase.from("sponsors").select("id, name").order("name");

  // Map related data to initial format
  const initialData = {
    ...event,
    djs: event.event_djs?.map((ed: any) => ed.dj_id) || [],
    sponsors: event.event_sponsors?.map((es: any) => es.sponsor_id) || []
  };

  return (
    <div>
      <EventFormClient djs={djs || []} sponsors={sponsors || []} initialData={initialData} />
    </div>
  );
}
