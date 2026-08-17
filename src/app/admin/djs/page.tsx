import { createClient } from "@/utils/supabase/server";
import { Music } from "lucide-react";
import DjDataTable from "./DjDataTable";

export default async function AdminDjs() {
  const supabase = await createClient();
  const { data: djs, error } = await supabase
    .from("djs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Music size={28} /> Directorio de DJs</h1>
        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Administra los artistas para armar el Line Up de tus eventos.</p>
      </div>

      <DjDataTable initialDjs={djs || []} />
    </div>
  );
}
