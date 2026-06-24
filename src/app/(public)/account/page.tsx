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
  return (
    <div style={{ paddingBottom: '4rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Tus Estadísticas
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
        <Link href="/account/tickets" style={{ display: 'block', textDecoration: 'none' }}>
          <Card hoverable glowColor="var(--color-magenta)" style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(229, 9, 20, 0.1)' }}>
                <Ticket size={24} color="var(--color-magenta)" />
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text-primary)' }}>{ticketsCount || 0}</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Tickets Comprados</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Ver tus códigos QR de acceso</p>
            </div>
          </Card>
        </Link>
        
        <Link href="/account/orders" style={{ display: 'block', textDecoration: 'none' }}>
          <Card hoverable glowColor="var(--color-accent)" style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)' }}>
                <ShoppingBag size={24} color="var(--color-accent)" />
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text-primary)' }}>{ordersCount || 0}</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Órdenes de Merch</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Rastrear envíos y compras</p>
            </div>
          </Card>
        </Link>

        <Link href="/account/notifications" style={{ display: 'block', textDecoration: 'none' }}>
          <Card hoverable glowColor="#FFB74D" style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ padding: '1rem', borderRadius: '50%', background: 'rgba(255, 183, 77, 0.1)' }}>
                <Bell size={24} color="#FFB74D" />
              </div>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text-primary)' }}>{notificationsCount || 0}</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Notificaciones</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Alertas y actualizaciones</p>
            </div>
            {(notificationsCount ?? 0) > 0 && (
              <div style={{ position: 'absolute', top: '2.5rem', right: '2.5rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-magenta)', boxShadow: '0 0 10px var(--color-magenta)' }} />
            )}
          </Card>
        </Link>
      </div>

      <div style={{ padding: '3rem', background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>¿Listo para el próximo rave?</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '1.125rem' }}>Explora nuestra cartelera de eventos o consigue la última merch oficial.</p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/events" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
            Explorar Eventos
          </Link>
          <Link href="/merch" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
            Tienda de Merch
          </Link>
        </div>
      </div>
    </div>
  );
}
