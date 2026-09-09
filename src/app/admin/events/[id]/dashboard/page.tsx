import { createClient as createAdminClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import EventDashboardClient from "./EventDashboardClient";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Obtener detalles del evento
  const { data: event, error: eventError } = await adminDb
    .from("events")
    .select("id, title, start_date, location_name")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Obtener los Ticket Tiers pertenecientes EXCLUSIVAMENTE a este evento
  const { data: ticketTiers } = await adminDb
    .from("ticket_tiers")
    .select("id, name, price, quantity_available")
    .eq("event_id", id)
    .order("price", { ascending: true });

  const tiers = ticketTiers || [];
  const tierIds = tiers.map((t: any) => t.id);

  let eventTickets: any[] = [];
  let eventOrders: any[] = [];
  let transfers: any[] = [];

  if (tierIds.length > 0) {
    // 3. Obtener boletas emitidas ÚNICAMENTE para las localidades de este evento
    const { data: rawTickets } = await adminDb
      .from("tickets")
      .select("id, tier_id, order_id, status, assigned_name, assigned_email, is_scanned, created_at")
      .in("tier_id", tierIds);

    eventTickets = rawTickets || [];

    // 4. Obtener órdenes asociadas ÚNICAMENTE a estas boletas
    const orderIds = Array.from(new Set(eventTickets.map((t: any) => t.order_id).filter(Boolean)));
    if (orderIds.length > 0) {
      const { data: rawOrders } = await adminDb
        .from("merch_orders")
        .select("id, customer_name, customer_email, total_amount, created_at, status")
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      eventOrders = rawOrders || [];
    }

    // 5. Historial de Transferencias de boletas exclusivas de este evento
    const ticketIds = eventTickets.map((t: any) => t.id);
    if (ticketIds.length > 0) {
      const { data: rawTransfers } = await adminDb
        .from("ticket_transfers")
        .select("id, ticket_id, from_user_id, to_email, to_name, status, created_at")
        .in("ticket_id", ticketIds)
        .order("created_at", { ascending: false });

      transfers = rawTransfers || [];
    }
  }

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <EventDashboardClient 
        event={event} 
        initialTiers={tiers} 
        initialOrders={eventOrders} 
        initialTickets={eventTickets} 
        initialTransfers={transfers}
      />
    </div>
  );
}

