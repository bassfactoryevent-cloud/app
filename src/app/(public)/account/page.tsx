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

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const { count: ticketsCount } = await supabase.from("tickets").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: ordersCount } = await supabase.from("merch_orders").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: notificationsCount } = await supabase.from("notifications").select("*", { count: 'exact', head: true }).eq("user_id", user.id).eq("is_read", false);

  return (
    <div style={{ paddingBottom: '4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Saludo y Resumen Rápido */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
        border: '1px solid var(--color-border)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(229, 9, 20, 0.15) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: 0 }}>
            Hola, <span style={{ color: 'var(--color-magenta)' }}>{profile?.full_name?.split(' ')[0] || user.user_metadata?.name?.split(' ')[0] || 'Raver'}</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', margin: 0 }}>
            Bienvenido a tu base de operaciones. Aquí puedes administrar tus boletas, compras y configuraciones.
          </p>
        </div>
      </div>

      {/* Grid de Estadísticas con Nuevo Diseño */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
          Resumen de Actividad
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          
          <Link href="/account/tickets" style={{ display: 'block', textDecoration: 'none' }}>
            <Card hoverable glowColor="var(--color-magenta)" style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(229, 9, 20, 0.1)' }}>
                  <Ticket size={28} color="var(--color-magenta)" />
                </div>
                <span style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: 'white', textShadow: '0 0 20px rgba(229, 9, 20, 0.5)' }}>{ticketsCount || 0}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Boletas Adquiridas</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Tus entradas oficiales para los eventos</p>
              </div>
            </Card>
          </Link>
          
          <Link href="/account/orders" style={{ display: 'block', textDecoration: 'none' }}>
            <Card hoverable glowColor="var(--color-accent)" style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(0, 240, 255, 0.1)' }}>
                  <ShoppingBag size={28} color="var(--color-accent)" />
                </div>
                <span style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: 'white', textShadow: '0 0 20px rgba(0, 240, 255, 0.5)' }}>{ordersCount || 0}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Compras de Merch</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Historial de ropa y accesorios</p>
              </div>
            </Card>
          </Link>

          <Link href="/account/notifications" style={{ display: 'block', textDecoration: 'none' }}>
            <Card hoverable glowColor="#FFB74D" style={{ height: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 183, 77, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ padding: '1rem', borderRadius: '1rem', background: 'rgba(255, 183, 77, 0.1)' }}>
                  <Bell size={28} color="#FFB74D" />
                </div>
                <span style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1, color: 'white', textShadow: '0 0 20px rgba(255, 183, 77, 0.5)' }}>{notificationsCount || 0}</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Notificaciones</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Avisos importantes sobre tu cuenta</p>
              </div>
              {(notificationsCount ?? 0) > 0 && (
                <div style={{ position: 'absolute', top: '2.5rem', right: '2.5rem', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-magenta)', boxShadow: '0 0 10px var(--color-magenta)' }} />
              )}
            </Card>
          </Link>
        </div>
      </div>

      {/* Banner de Acción (Call to action) */}
      <div style={{ 
        padding: '3rem', 
        background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.2) 0%, rgba(0,0,0,0.8) 100%)', 
        borderRadius: 'var(--radius-xl)', 
        border: '1px solid rgba(229, 9, 20, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.02em', color: 'white', textTransform: 'uppercase' }}>
            ¿Listo para la próxima experiencia?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.125rem', lineHeight: 1.6 }}>
            Explora nuestra cartelera de eventos underground, adquiere tus boletas antes de que se agoten, o consigue la última merch oficial para llevar la marca contigo.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/events" style={{ padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'var(--color-magenta)', color: 'white', border: 'none', borderRadius: '99px', textDecoration: 'none', transition: 'all 0.3s', boxShadow: '0 0 20px rgba(229, 9, 20, 0.4)' }}>
              Ver Cartelera
            </Link>
            <Link href="/merch" style={{ padding: '1rem 2.5rem', fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'transparent', border: '2px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '99px', textDecoration: 'none', transition: 'all 0.3s' }}>
              Comprar Merch
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
