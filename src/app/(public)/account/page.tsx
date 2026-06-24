import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, ShoppingBag, Bell } from "lucide-react";

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  // Traer conteos rápidos
  const { count: ticketsCount } = await supabase.from("tickets").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: ordersCount } = await supabase.from("merch_orders").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: notificationsCount } = await supabase.from("notifications").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("is_read", false);

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 800, marginBottom: '0.5rem', background: 'linear-gradient(to right, #FFF, #A0A0A0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Buenas noches, {profile?.full_name?.split(' ')[0] || 'Basshead'}
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '3rem' }}>Este es tu espacio central. Accede a tus próximos raves y contenido exclusivo.</p>

      <style>{`
        .dashboard-card {
          display: flex;
          flex-direction: column;
          padding: 2rem;
          text-decoration: none;
          color: white;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .dashboard-card:hover {
          transform: translateY(-5px);
        }
        .card-tickets:hover { border-color: var(--color-magenta); }
        .card-orders:hover { border-color: var(--color-accent); }
        .card-notifs:hover { border-color: #FFB74D; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link href="/account/tickets" className="glass-panel dashboard-card card-tickets">
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'radial-gradient(circle, var(--color-magenta-glow) 0%, transparent 70%)', width: '100px', height: '100px', opacity: 0.5, borderRadius: '50%' }} />
          <Ticket size={32} color="var(--color-magenta)" style={{ marginBottom: '1.5rem' }} />
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{ticketsCount || 0}</span>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.5rem' }}>Tickets Comprados</span>
        </Link>
        
        <Link href="/account/orders" className="glass-panel dashboard-card card-orders">
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'radial-gradient(circle, rgba(0,240,255,0.2) 0%, transparent 70%)', width: '100px', height: '100px', opacity: 0.5, borderRadius: '50%' }} />
          <ShoppingBag size={32} color="var(--color-accent)" style={{ marginBottom: '1.5rem' }} />
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{ordersCount || 0}</span>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.5rem' }}>Órdenes de Merch</span>
        </Link>

        <Link href="/account/notifications" className="glass-panel dashboard-card card-notifs">
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', background: 'radial-gradient(circle, rgba(255,183,77,0.2) 0%, transparent 70%)', width: '100px', height: '100px', opacity: 0.5, borderRadius: '50%' }} />
          <Bell size={32} color="#FFB74D" style={{ marginBottom: '1.5rem' }} />
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{notificationsCount || 0}</span>
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.5rem' }}>Notificaciones</span>
          {(notificationsCount ?? 0) > 0 && (
            <div style={{ position: 'absolute', top: '2rem', right: '2rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-magenta)', boxShadow: '0 0 10px var(--color-magenta)' }} />
          )}
        </Link>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Descubre más</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/events" className="btn btn-primary">
            Explorar Eventos
          </Link>
          <Link href="/merch" className="btn btn-secondary">
            Ir a la Tienda de Merch
          </Link>
        </div>
      </div>
    </div>
  );
}
