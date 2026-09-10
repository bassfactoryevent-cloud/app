import { createClient as createAdminClient } from "@supabase/supabase-js";
import { DollarSign } from "lucide-react";
import FinancesClient from "./FinancesClient";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function AdminFinancesPage() {
  // 1. Obtener eventos y sus localidades
  const [{ data: events }, { data: tiers }, { data: tickets }, { data: allOrders }] = await Promise.all([
    adminDb.from("events").select("id, title, start_date, location_name, cover_image, total_capacity").order("start_date", { ascending: false }),
    adminDb.from("ticket_tiers").select("id, event_id, name, price, quantity_available"),
    adminDb.from("tickets").select("id, tier_id, order_id, status, scanned_at, created_at"),
    adminDb.from("merch_orders").select(`
      id, customer_name, customer_email, total_amount, status, created_at, shipping_address,
      merch_order_items (
        id, product_name, variant_name, quantity, unit_price, total_price
      )
    `).order("created_at", { ascending: false })
  ]);

  const tierMap = new Map((tiers || []).map((t: any) => [t.id, t]));
  const eventMap = new Map((events || []).map((e: any) => [e.id, e]));

  // Identificar qué órdenes corresponden a boletería
  const ticketOrderIds = new Set((tickets || []).map((t: any) => t.order_id).filter(Boolean));

  // 2. Calcular métricas por Evento
  const eventStatsMap = new Map<string, { id: string; title: string; start_date: string; location_name: string; cover_image: string; ticketsSold: number; scannedCount: number; totalCapacity: number; totalRevenue: number }>();

  (events || []).forEach((ev: any) => {
    const eventTiers = (tiers || []).filter((t: any) => t.event_id === ev.id);
    const tiersCapacity = eventTiers.reduce((sum: number, t: any) => sum + (Number(t.quantity_available) || 0), 0);
    const totalCapacity = Number(ev.total_capacity) || tiersCapacity;

    eventStatsMap.set(ev.id, {
      id: ev.id,
      title: ev.title,
      start_date: ev.start_date,
      location_name: ev.location_name,
      cover_image: ev.cover_image,
      ticketsSold: 0,
      scannedCount: 0,
      totalCapacity,
      totalRevenue: 0
    });
  });

  (tickets || []).forEach((ticket: any) => {
    const tier = tierMap.get(ticket.tier_id);
    if (tier && tier.event_id && eventStatsMap.has(tier.event_id)) {
      const stat = eventStatsMap.get(tier.event_id)!;
      stat.ticketsSold += 1;
      if (ticket.status === "scanned" || Boolean(ticket.scanned_at)) {
        stat.scannedCount += 1;
      }
      if (ticket.status === "valid" || ticket.status === "scanned") {
        stat.totalRevenue += Number(tier.price || 0);
      }
    }
  });

  const eventStats = Array.from(eventStatsMap.values());
  const ticketRevenue = eventStats.reduce((sum, ev) => sum + ev.totalRevenue, 0);

  // 3. Calcular métricas por Producto de Merch
  const productStatsMap = new Map<string, { name: string; category: string; unitsSold: number; revenue: number }>();
  let merchRevenue = 0;

  (allOrders || []).forEach((order: any) => {
    const isTicketOrder = ticketOrderIds.has(order.id) || (order.shipping_address && order.shipping_address.toLowerCase().includes("digital"));
    
    if (!isTicketOrder && order.merch_order_items && order.merch_order_items.length > 0) {
      if (order.status === "paid" || order.status === "shipped" || order.status === "delivered") {
        merchRevenue += Number(order.total_amount || 0);
      }

      order.merch_order_items.forEach((item: any) => {
        const key = item.product_name || "Producto";
        if (!productStatsMap.has(key)) {
          productStatsMap.set(key, { name: key, category: "Tienda", unitsSold: 0, revenue: 0 });
        }
        const stat = productStatsMap.get(key)!;
        stat.unitsSold += Number(item.quantity || 1);
        stat.revenue += Number(item.total_price || 0);
      });
    }
  });

  const productStats = Array.from(productStatsMap.values());
  const totalRevenue = ticketRevenue + merchRevenue;
  const totalTransactions = (allOrders || []).filter((o: any) => o.status === "paid" || o.status === "shipped" || o.status === "delivered").length;

  // 4. Preparar el Libro Maestro de Transacciones Unificado
  const transactions: any[] = [];

  (allOrders || []).forEach((order: any) => {
    const isTicket = ticketOrderIds.has(order.id) || (order.shipping_address && order.shipping_address.toLowerCase().includes("digital"));
    
    let description = "Compra de Tienda";
    if (isTicket) {
      // Buscar qué evento compró
      const orderTicket = (tickets || []).find((t: any) => t.order_id === order.id);
      const tier = orderTicket ? tierMap.get(orderTicket.tier_id) : null;
      const event = tier ? eventMap.get(tier.event_id) : null;
      description = event ? `Boleta: ${event.title} (${tier?.name || "General"})` : "Entrada Oficial a Evento";
    } else if (order.merch_order_items && order.merch_order_items.length > 0) {
      description = order.merch_order_items.map((it: any) => `${it.quantity}x ${it.product_name}`).join(", ");
    }

    transactions.push({
      id: order.id,
      type: isTicket ? "ticket" : "merch",
      description,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at
    });
  });

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "2.25rem", fontWeight: 900, color: "white", fontFamily: "Outfit, sans-serif", margin: 0 }}>
          <DollarSign size={32} style={{ color: "#22c55e" }} />
          Finanzas & Rendimiento Global
        </h1>
        <p style={{ opacity: 0.7, fontSize: "1rem", color: "var(--color-text-secondary)", marginTop: "0.35rem" }}>
          Panel maestro consolidado con recaudación de boletería, ventas de merch y auditoría de transacciones.
        </p>
      </div>

      <FinancesClient
        totalRevenue={totalRevenue}
        ticketRevenue={ticketRevenue}
        merchRevenue={merchRevenue}
        totalTransactions={totalTransactions}
        eventStats={eventStats}
        productStats={productStats}
        transactions={transactions}
      />
    </div>
  );
}
