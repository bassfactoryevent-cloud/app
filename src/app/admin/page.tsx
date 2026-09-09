import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Calendar, Music, Briefcase, ShoppingCart, FileText, Megaphone } from "lucide-react";
import DashboardGrid from "./DashboardGrid";
import DashboardRecentTables from "./DashboardRecentTables";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function AdminDashboard() {
  // 1. Obtener conteos generales en paralelo
  const [
    { count: eventsCount },
    { count: djsCount },
    { count: sponsorsCount },
    { count: merchCount },
    { count: postsCount },
    { count: campaignsCount },
    { count: usersCount },
    { data: allTiers },
    { data: allEvents },
    { data: rawTickets },
    { data: allOrders }
  ] = await Promise.all([
    adminDb.from("events").select("*", { count: "exact", head: true }),
    adminDb.from("djs").select("*", { count: "exact", head: true }),
    adminDb.from("sponsors").select("*", { count: "exact", head: true }),
    adminDb.from("merch_products").select("*", { count: "exact", head: true }),
    adminDb.from("posts").select("*", { count: "exact", head: true }),
    adminDb.from("ad_campaigns").select("*", { count: "exact", head: true }),
    adminDb.from("profiles").select("*", { count: "exact", head: true }),
    adminDb.from("ticket_tiers").select("id, name, price, event_id"),
    adminDb.from("events").select("id, title"),
    adminDb.from("tickets").select("id, tier_id, order_id, status, assigned_name, assigned_email, created_at").order("created_at", { ascending: false }).limit(6),
    adminDb.from("merch_orders").select(`
      id, customer_name, customer_email, shipping_city, shipping_address, total_amount, status, created_at,
      merch_order_items ( id, product_name, quantity, total_price )
    `).order("created_at", { ascending: false })
  ]);

  const tierMap = new Map((allTiers || []).map((t: any) => [t.id, t]));
  const eventMap = new Map((allEvents || []).map((e: any) => [e.id, e]));
  const ticketOrderIds = new Set((rawTickets || []).map((t: any) => t.order_id).filter(Boolean));

  // 2. Mapeo de Boletas Recientes para la tabla interactiva
  const recentTickets = (rawTickets || []).map((t: any) => {
    const tier = tierMap.get(t.tier_id);
    const event = tier ? eventMap.get(tier.event_id) : null;
    return {
      id: t.id,
      eventTitle: event?.title || "Evento Bassfactory",
      eventId: tier?.event_id || "",
      tierName: tier?.name || "General",
      price: Number(tier?.price || 0),
      buyerName: t.assigned_name || "Titular",
      buyerEmail: t.assigned_email || "",
      status: t.status || "valid",
      createdAt: t.created_at
    };
  });

  // 3. Mapeo de Pedidos de Merch Recientes (filtrando boletería electrónica)
  const recentMerchOrders = (allOrders || [])
    .filter((order: any) => {
      const isTicket = ticketOrderIds.has(order.id) || (order.shipping_address && order.shipping_address.toLowerCase().includes("digital"));
      return !isTicket && order.merch_order_items && order.merch_order_items.length > 0;
    })
    .slice(0, 5)
    .map((order: any) => ({
      id: order.id,
      customerName: order.customer_name || "Cliente",
      customerEmail: order.customer_email || "",
      city: order.shipping_city || "Colombia",
      itemsSummary: order.merch_order_items.map((it: any) => `${it.quantity}x ${it.product_name}`).join(", ") || "Productos",
      totalAmount: Number(order.total_amount || 0),
      status: order.status || "pending",
      createdAt: order.created_at
    }));

  // 4. Ventas Totales Consolidadas
  const totalSales = (allOrders || [])
    .filter((o: any) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

  const stats = [
    { name: "Eventos", count: eventsCount || 0, icon: <Calendar size={24} />, href: "/admin/events", color: "#3b82f6" },
    { name: "DJs & Booking", count: djsCount || 0, icon: <Music size={24} />, href: "/admin/djs", color: "#8b5cf6" },
    { name: "Patrocinadores", count: sponsorsCount || 0, icon: <Briefcase size={24} />, href: "/admin/sponsors", color: "#eab308" },
    { name: "Merch (Productos)", count: merchCount || 0, icon: <ShoppingCart size={24} />, href: "/admin/merch", color: "#ec4899" },
    { name: "Artículos (Blog)", count: postsCount || 0, icon: <FileText size={24} />, href: "/admin/blog", color: "#10b981" },
    { name: "Campañas (Ads)", count: campaignsCount || 0, icon: <Megaphone size={24} />, href: "/admin/ads", color: "#f97316" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "0.5rem", color: "white", fontFamily: "Outfit, sans-serif" }}>
          Bienvenido al Panel B2B de Bassfactory
        </h1>
        <p style={{ opacity: 0.75, fontSize: "1rem", color: "var(--color-text-secondary)" }}>
          Resumen general del ecosistema, rendimiento comercial y acceso rápido a ventas recientes.
        </p>
      </div>

      <DashboardGrid stats={stats} totalSales={totalSales} totalUsers={usersCount || 0} />

      {/* Tablas Interactivas de Actividad Reciente */}
      <DashboardRecentTables 
        recentTickets={recentTickets}
        recentMerchOrders={recentMerchOrders}
      />
    </div>
  );
}
