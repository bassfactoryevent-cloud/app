import { createClient } from "@/utils/supabase/server";
import { Calendar, Music, Briefcase, ShoppingCart, FileText, Megaphone } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch counts in parallel
  const [
    { count: eventsCount },
    { count: djsCount },
    { count: sponsorsCount },
    { count: merchCount },
    { count: postsCount },
    { count: campaignsCount }
  ] = await Promise.all([
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("djs").select("*", { count: "exact", head: true }),
    supabase.from("sponsors").select("*", { count: "exact", head: true }),
    supabase.from("merch_products").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("ad_campaigns").select("*", { count: "exact", head: true })
  ]);

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
          Resumen general del ecosistema. Selecciona un módulo para gestionar el contenido.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {stats.map((stat) => (
          <Link href={stat.href} key={stat.name} style={{ textDecoration: "none" }}>
            <div style={{
              backgroundColor: "var(--color-surface, #111)",
              border: "1px solid var(--color-border, #333)",
              borderRadius: "1rem",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.5rem",
              transition: "transform 0.2s, borderColor 0.2s",
              cursor: "pointer"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.borderColor = stat.color;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.borderColor = "var(--color-border, #333)";
            }}>
              <div style={{
                backgroundColor: `${stat.color}20`, // 20% opacity
                color: stat.color,
                padding: "1rem",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {stat.icon}
              </div>
              <div>
                <h3 style={{ fontSize: "0.875rem", color: "var(--color-text-secondary, #a1a1aa)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  {stat.name}
                </h3>
                <p style={{ fontSize: "2rem", fontWeight: 700, color: "white", margin: 0, lineHeight: 1 }}>
                  {stat.count}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
