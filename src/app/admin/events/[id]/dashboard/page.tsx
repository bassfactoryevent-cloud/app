import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import EventDashboardClient from "./EventDashboardClient";

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await params;

  // 1. Obtener detalles del evento
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, start_date, location_name")
    .eq("id", id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  // 2. Obtener los Ticket Tiers y el conteo de boletas emitidas por tier
  const { data: ticketTiers } = await supabase
    .from("ticket_tiers")
    .select("id, name, price, quantity_available")
    .eq("event_id", id)
    .order("price", { ascending: true });

  // 3. Obtener órdenes pagadas
  const { data: orders } = await supabase
    .from("merch_orders")
    .select("id, customer_name, customer_email, total_amount, created_at, status")
    // Note: We need to filter orders that have tickets for this event.
    // For now we just fetch all, or we can filter later. In a real app we'd join.
    .order("created_at", { ascending: false });

  // 4. Obtener boletas (tickets)
  const { data: eventTickets } = await supabase
    .from("tickets")
    .select(`
      id,
      tier_id,
      status,
      assigned_name,
      assigned_email,
      ticket_tiers!inner(event_id)
    `)
    .eq("ticket_tiers.event_id", id);

  // 5. Historial de Transferencias
  const { data: transfers } = await supabase
    .from("ticket_transfers")
    .select(`
      id,
      ticket_id,
      from_user_id,
      to_email,
      to_name,
      status,
      created_at,
      tickets!inner(
        tier_id,
        ticket_tiers!inner(event_id)
      )
    `)
    .eq("tickets.ticket_tiers.event_id", id)
    .order("created_at", { ascending: false });

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <EventDashboardClient 
        event={event} 
        initialTiers={ticketTiers || []} 
        initialOrders={orders || []} 
        initialTickets={eventTickets || []} 
        initialTransfers={transfers || []}
      />
    </div>
  );
}
