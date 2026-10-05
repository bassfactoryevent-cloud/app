import { notFound } from "next/navigation";
import EventDashboardClient from "./EventDashboardClient";
import { getAdminClient } from "@/utils/supabase/admin";
import { getAssignmentsForEvent } from "@/utils/staffAssignments";

export const dynamic = "force-dynamic";

const adminDb = getAdminClient();

export default async function EventDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Obtener detalles del evento
  const { data: event, error: eventError } = await adminDb
    .from("events")
    .select("id, title, start_date, location_name, total_capacity")
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

  // Calcular aforo configurado si total_capacity no fue especificado manualmente
  const configuredCapacity = tiers.reduce((sum: number, t: any) => sum + (Number(t.quantity_available) || 0), 0);
  if (!event.total_capacity || event.total_capacity === 0) {
    event.total_capacity = configuredCapacity;
  }

  let eventTickets: any[] = [];
  let eventOrders: any[] = [];
  let transfers: any[] = [];

  if (tierIds.length > 0) {
    // 3. Obtener boletas emitidas ÚNICAMENTE para las localidades de este evento (incluyendo quién la escaneó)
    const { data: rawTickets } = await adminDb
      .from("tickets")
      .select("id, tier_id, order_id, status, assigned_name, assigned_email, scanned_at, scanned_by, created_at")
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

  // 6. Obtener personal asignado a la puerta de este evento y lista de usuarios autorizables (EXCLUYE CLIENTES)
  const [assignments, { data: profiles }, { data: authUsers }] = await Promise.all([
    getAssignmentsForEvent(id),
    adminDb.from("profiles").select("id, full_name, role").order("created_at", { ascending: false }),
    adminDb.auth.admin.listUsers()
  ]);

  const emailMap = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));
  const metaRoleMap = new Map((authUsers?.users || []).map((u) => [u.id, u.user_metadata?.role]));

  // Mapa completo para auditar quién escaneó cada boleta en el panel
  const staffUsersMap: Record<string, { full_name: string; email: string; role: string }> = {};
  (profiles || []).forEach((p: any) => {
    const metaRole = metaRoleMap.get(p.id);
    const effectiveRole = metaRole === "scanner" ? "scanner" : (p.role || "customer");
    staffUsersMap[p.id] = {
      full_name: p.full_name || (p.role === "superadmin" ? "Super Admin" : "Personal de Puerta"),
      email: emailMap.get(p.id) || "",
      role: effectiveRole,
    };
  });

  // Solo incluir usuarios con rol de puerta o admin (NUNCA clientes normales)
  const availableUsers = (profiles || [])
    .map((p: any) => ({
      id: p.id,
      full_name: staffUsersMap[p.id]?.full_name || p.full_name,
      email: staffUsersMap[p.id]?.email || "",
      role: staffUsersMap[p.id]?.role || "customer",
    }))
    .filter((u: any) => u.role !== "customer");

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <EventDashboardClient 
        event={event} 
        initialTiers={tiers} 
        initialOrders={eventOrders} 
        initialTickets={eventTickets} 
        initialTransfers={transfers}
        initialAssignments={assignments}
        availableUsers={availableUsers}
        staffUsersMap={staffUsersMap}
      />
    </div>
  );
}

