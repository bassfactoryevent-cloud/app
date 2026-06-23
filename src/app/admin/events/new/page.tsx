import { createClient } from "@/utils/supabase/server";
import EventFormClient from "./EventFormClient";

export default async function NewEventPage() {
  const supabase = await createClient();
  
  const { data: djs } = await supabase.from("djs").select("id, name").order("name");
  const { data: sponsors } = await supabase.from("sponsors").select("id, name").order("name");

  return (
    <div>
      <EventFormClient djs={djs || []} sponsors={sponsors || []} />
    </div>
  );
}
