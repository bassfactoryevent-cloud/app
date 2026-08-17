import { createClient } from "@/utils/supabase/server";
import { Calendar, Music, Briefcase, ShoppingCart, FileText, Megaphone } from "lucide-react";
import DashboardGrid from "./DashboardGrid";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch counts in parallel
  const [
    { count: eventsCount },
    { count: djsCount },
    { count: sponsorsCount },
    { count: merchCount },
    { count: postsCount },
    { count: campaignsCount },
    { count: usersCount },
    { data: ticketOrders },
    { data: merchOrders }
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("djs").select("*", { count: "exact", head: true }),
    supabase.from("sponsors").select("*", { count: "exact", head: true }),
    supabase.from("merch_products").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("ad_campaigns").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("total_amount").eq("status", "paid"),
    supabase.from("merch_orders").select("total_amount").eq("status", "paid")
  ]);

  const ticketSales = ticketOrders?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;
  const merchSales = merchOrders?.reduce((acc, order) => acc + Number(order.total_amount), 0) || 0;
  const totalSales = ticketSales + merchSales;

  const stats = [
    { name: "Eventos", count: eventsCount || 0, icon: <Calendar size={24} />, href: "/admin/events", color: "#3b82f6" },
    { name: "DJs & Booking", count: djsCount || 0, icon: <Music size={24} />, href: "/admin/djs", color: "#8b5cf6" },
    { name: "Patrocinadores", count: sponsorsCount || 0, icon: <Briefcase size={24} />, href: "/admin/sponsors", color: "#eab308" },
    { name: "Merch (Productos)", count: merchCount || 0, icon: <ShoppingCart size={24} />, href: "/admin/merch", color: "#ec4899" },
    { name: "Artículos (Blog)", count: postsCount || 0, icon: <FileText size={24} />, href: "/admin/blog", color: "#10b981" },
    { name: "Campañas (Ads)", count: campaignsCount || 0, icon: <Megaphone size={24} />, href: "/admin/ads", color: "#f97316" },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: "white" }}>
          Bienvenido al Panel B2B de Bassfactory
        </h1>
        <p style={{ opacity: 0.7, fontSize: "1rem", color: "#e5e5e5" }}>
          Resumen general del ecosistema y rendimiento comercial.
        </p>
      </div>

      <DashboardGrid stats={stats} totalSales={totalSales} totalUsers={usersCount || 0} />
    </div>
  );
}
