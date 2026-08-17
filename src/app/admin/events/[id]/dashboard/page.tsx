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
    .from("orders")
    .select("id, customer_name, customer_email, total_amount, created_at, status")
    .eq("event_id", id)
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  // 4. Obtener boletas emitidas para calcular el inventario
  // Necesitamos saber cuántos tickets se han emitido por cada tier
  const { data: issuedTickets } = await supabase
    .from("issued_tickets")
    .select("id, ticket_tier_id, is_scanned");

  // Filter issued tickets in memory since we can't easily join events through orders directly in a simple query sometimes,
  // Actually it's better to fetch issued_tickets joined with orders.
  const { data: eventTickets } = await supabase
    .from("issued_tickets")
    .select(`
      id,
      ticket_tier_id,
      is_scanned,
      orders!inner(event_id)
    `)
    .eq("orders.event_id", id);

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <EventDashboardClient 
        event={event} 
        initialTiers={ticketTiers || []} 
        initialOrders={orders || []} 
        initialTickets={eventTickets || []} 
      />
    </div>
  );
}
