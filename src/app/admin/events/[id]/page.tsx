import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Activity, ScanLine } from "lucide-react";
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
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "var(--radius-lg)",
        marginBottom: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>⚡</span>
          <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>
            Gestión Rápida del Evento:
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={`/admin/events/${event.id}/dashboard`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.9rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            color: "#3b82f6",
            fontSize: "0.825rem",
            fontWeight: 700,
            textDecoration: "none"
          }}>
            <Activity size={15} /> Asistentes Adentro y Ventas
          </Link>

          <Link href={`/admin/events/${event.id}/staff`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.9rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(6, 182, 212, 0.15)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            color: "#06b6d4",
            fontSize: "0.825rem",
            fontWeight: 700,
            textDecoration: "none"
          }}>
            <Users size={15} /> Personal de Puerta
          </Link>

          <Link href={`/admin/events/${event.id}/scan`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 0.9rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(229, 9, 20, 0.15)",
            border: "1px solid rgba(229, 9, 20, 0.3)",
            color: "var(--color-magenta)",
            fontSize: "0.825rem",
            fontWeight: 700,
            textDecoration: "none"
          }}>
            <ScanLine size={15} /> Abrir Escáner
          </Link>
        </div>
      </div>

      <EventFormClient djs={djs || []} sponsors={sponsors || []} initialData={initialData} />
    </div>
  );
}
