import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, ShoppingBag, Bell, ShieldCheck, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { getUserNotifications } from "@/utils/notifications";

export default async function AccountDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  const { count: ticketsCount } = await supabase.from("tickets").select("*", { count: 'exact', head: true }).eq("user_id", user.id);
  const { count: ordersCount } = await supabase.from("merch_orders").select("*", { count: 'exact', head: true }).eq("user_id", user.id);

  const notifications = await getUserNotifications({
    id: user.id,
    email: user.email,
    role: profile?.role
  });
  const notificationsCount = notifications.length;

  // Compras recientes del usuario
  const { data: recentOrders } = await supabase
    .from("merch_orders")
    .select("id, total_amount, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

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

      {/* Banner Informativo de Boletas y Seguridad */}
      <div style={{
        backgroundColor: 'rgba(229, 9, 20, 0.08)',
        border: '1px solid rgba(229, 9, 20, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
      }}>
        <ShieldCheck size={28} style={{ color: 'var(--color-magenta)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
            Aviso de Taquilla y Entradas Oficiales
          </div>
          <p style={{ color: 'rgba(255, 255, 255, 0.75)', margin: 0, fontSize: '0.875rem', lineHeight: 1.4 }}>
            Tus compras de boletas están aseguradas. Por protocolo de seguridad y prevención de fraudes, <strong>el código QR de acceso a taquilla se habilitará exactamente 1 día antes del evento</strong>.
          </p>
        </div>
      </div>

      {/* Grid de Estadísticas */}
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
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '0.25rem' }}>Compras y Pedidos</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>Historial y estado de tus compras</p>
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

      {/* Sección: Estado de tus Compras Recientes */}
      {recentOrders && recentOrders.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', margin: 0 }}>
              Tus Compras Recientes
            </h3>
            <Link href="/account/orders" style={{ color: 'var(--color-magenta)', fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Ver todas ({ordersCount}) <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentOrders.map((ord: any) => {
              const isPaid = ord.status === 'paid';
              return (
                <div 
                  key={ord.id} 
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {new Date(ord.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white', marginTop: '0.2rem' }}>
                      Orden #{ord.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPaid ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.15)', padding: '0.4rem 0.9rem', borderRadius: '2rem' }}>
                        <CheckCircle2 size={14} /> Aprobado y Confirmado
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#eab308', backgroundColor: 'rgba(234,179,8,0.15)', padding: '0.4rem 0.9rem', borderRadius: '2rem' }}>
                        <Clock size={14} /> Pendiente
                      </span>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Total</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>
                      ${Number(ord.total_amount).toLocaleString('es-CO')} COP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
