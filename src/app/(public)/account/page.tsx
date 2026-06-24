import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, ShoppingBag, Bell } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const { count: ticketsCount } = await supabase.from("tickets").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: ordersCount } = await supabase.from("merch_orders").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: notificationsCount } = await supabase.from("notifications").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("is_read", false);

  return (
    <Card style={{ padding: '2.5rem', minHeight: '100%' }}>
      <h1 style={{ marginBottom: '0.5rem', background: 'linear-gradient(to right, var(--color-text-primary), var(--color-text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Buenas noches, {profile?.full_name?.split(' ')[0] || 'Basshead'}
      </h1>
      <p style={{ marginBottom: '3rem' }}>Este es tu espacio central. Accede a tus próximos raves y contenido exclusivo.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link href="/account/tickets" style={{ display: 'block' }}>
          <Card hoverable glowColor="var(--color-magenta)" style={{ height: '100%', color: 'inherit' }}>
            <Ticket size={32} color="var(--color-magenta)" style={{ marginBottom: '1.5rem' }} />
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, display: 'block', color: 'var(--color-text-primary)' }}>{ticketsCount || 0}</span>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.5rem', display: 'block' }}>Tickets Comprados</span>
          </Card>
        </Link>
        
        <Link href="/account/orders" style={{ display: 'block' }}>
          <Card hoverable glowColor="var(--color-accent)" style={{ height: '100%', color: 'inherit' }}>
            <ShoppingBag size={32} color="var(--color-accent)" style={{ marginBottom: '1.5rem' }} />
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, display: 'block', color: 'var(--color-text-primary)' }}>{ordersCount || 0}</span>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.5rem', display: 'block' }}>Órdenes de Merch</span>
          </Card>
        </Link>

        <Link href="/account/notifications" style={{ display: 'block' }}>
          <Card hoverable glowColor="#FFB74D" style={{ height: '100%', color: 'inherit' }}>
            <Bell size={32} color="#FFB74D" style={{ marginBottom: '1.5rem' }} />
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, display: 'block', color: 'var(--color-text-primary)' }}>{notificationsCount || 0}</span>
            <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: '0.5rem', display: 'block' }}>Notificaciones</span>
            {(notificationsCount ?? 0) > 0 && (
              <div style={{ position: 'absolute', top: '2rem', right: '2rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-magenta)', boxShadow: '0 0 10px var(--color-magenta)' }} />
            )}
          </Card>
        </Link>
      </div>

      <div style={{ padding: '2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
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
    </Card>
  );
}
