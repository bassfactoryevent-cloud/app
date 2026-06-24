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
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
        Hola, {profile?.full_name || 'Basshead'}
      </h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Bienvenido a tu panel de control. Aquí puedes gestionar tus tickets, compras y perfil.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link href="/account/tickets" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1rem', textDecoration: 'none', color: 'white', border: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}>
          <Ticket size={40} color="var(--color-magenta)" style={{ marginBottom: '1rem' }} />
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{ticketsCount || 0}</span>
          <span style={{ opacity: 0.7 }}>Tickets Comprados</span>
        </Link>
        <Link href="/account/orders" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1rem', textDecoration: 'none', color: 'white', border: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}>
          <ShoppingBag size={40} color="var(--color-magenta)" style={{ marginBottom: '1rem' }} />
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{ordersCount || 0}</span>
          <span style={{ opacity: 0.7 }}>Órdenes de Merch</span>
        </Link>
        <Link href="/account/notifications" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1rem', textDecoration: 'none', color: 'white', border: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s', position: 'relative' }}>
          <Bell size={40} color="var(--color-magenta)" style={{ marginBottom: '1rem' }} />
          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{notificationsCount || 0}</span>
          <span style={{ opacity: 0.7 }}>Notificaciones Nuevas</span>
        </Link>
      </div>

      <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Acciones Rápidas</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/events" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: 'black', borderRadius: '0.5rem', fontWeight: 700, textDecoration: 'none' }}>
            Explorar Eventos
          </Link>
          <Link href="/merch" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', borderRadius: '0.5rem', fontWeight: 700, textDecoration: 'none' }}>
            Ir a la Tienda de Merch
          </Link>
        </div>
      </div>
    </div>
  );
}
