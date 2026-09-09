import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Package, Truck, CheckCircle, Ticket, Clock, ShieldCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user merch orders with items and tickets
  const { data: orders } = await supabase
    .from("merch_orders")
    .select(`
      *,
      merch_order_items (
        id,
        product_name,
        variant_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch tickets for all orders
  let orderTicketsMap: Record<string, any[]> = {};
  if (orders && orders.length > 0) {
    const orderIds = orders.map((o: any) => o.id);
    const { data: tickets } = await supabase
      .from("tickets")
      .select(`
        id,
        order_id,
        status,
        ticket_tiers (
          name,
          events (
            title,
            start_date,
            location_name
          )
        )
      `)
      .in("order_id", orderIds);

    if (tickets) {
      for (const t of tickets) {
        if (!orderTicketsMap[t.order_id]) {
          orderTicketsMap[t.order_id] = [];
        }
        orderTicketsMap[t.order_id].push(t);
      }
    }
  }

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': 
        return { icon: <Clock size={16} />, color: '#eab308', text: 'Pendiente de Pago', bg: 'rgba(234, 179, 8, 0.15)' };
      case 'paid': 
        return { icon: <CheckCircle size={16} />, color: '#22c55e', text: 'Aprobado y Confirmado', bg: 'rgba(34, 197, 94, 0.15)' };
      case 'shipped': 
        return { icon: <Truck size={16} />, color: '#a855f7', text: 'Enviado', bg: 'rgba(168, 85, 247, 0.15)' };
      case 'delivered': 
        return { icon: <CheckCircle size={16} />, color: '#22c55e', text: 'Entregado', bg: 'rgba(34, 197, 94, 0.15)' };
      default: 
        return { icon: <Package size={16} />, color: '#9ca3af', text: status, bg: 'rgba(156, 163, 175, 0.15)' };
    }
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
        Mis Compras y Órdenes
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '1rem' }}>
        Consulta el estado de tus compras, entradas a eventos y pedidos de tienda.
      </p>

      {/* Banner Informativo sobre Generación de Boletas */}
      <div style={{
        backgroundColor: 'rgba(229, 9, 20, 0.08)',
        border: '1px solid rgba(229, 9, 20, 0.25)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <ShieldCheck size={24} style={{ color: 'var(--color-magenta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
            Protocolo de Seguridad en Taquilla
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
            Tus compras están 100% aseguradas en la plataforma. Por estrictos protocolos de control y prevención de clonación, <strong>el código QR de acceso oficial a tus boletas se habilitará y enviará a tu correo exactamente 1 día antes del evento</strong>.
          </p>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Package size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            No has realizado ninguna compra aún.
          </p>
          <Link href="/events" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
            Explorar Eventos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order: any) => {
            const statusConfig = getStatusConfig(order.status);
            const tickets = orderTicketsMap[order.id] || [];
            const merchItems = order.merch_order_items || [];
            
            return (
              <div 
                key={order.id} 
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.02)', 
                  borderRadius: '1rem', 
                  border: '1px solid rgba(255,255,255,0.07)', 
                  overflow: 'hidden' 
                }}
              >
                {/* Header de la Orden */}
                <div style={{ 
                  padding: '1.25rem 1.5rem', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  flexWrap: 'wrap', 
                  gap: '1rem' 
                }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>
                      Fecha: {new Date(order.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', fontWeight: 700, color: 'white' }}>
                      Orden: #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    color: statusConfig.color, 
                    fontWeight: 700, 
                    backgroundColor: statusConfig.bg, 
                    padding: '0.4rem 1rem', 
                    borderRadius: '2rem',
                    fontSize: '0.875rem'
                  }}>
                    {statusConfig.icon} {statusConfig.text}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.2rem' }}>Total Pagado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
                      ${Number(order.total_amount).toLocaleString('es-CO')} COP
                    </div>
                  </div>
                </div>
                
                {/* Contenido / Artículos */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Si hay Boletas en la Orden */}
                  {tickets.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-magenta)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Ticket size={16} /> Entradas / Boletas ({tickets.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {tickets.map((t: any) => {
                          const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
                          const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
                          
                          return (
                            <div key={t.id} style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>
                                  {event?.title || 'Evento Bassfactory'}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                                  Localidad / Fase: <strong style={{ color: 'white' }}>{tier?.name || 'General'}</strong>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.35rem 0.75rem', borderRadius: '1rem' }}>
                                  ✓ Confirmada
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '0.35rem 0.75rem', borderRadius: '1rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Clock size={12} /> QR se genera 1 día antes
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Si hay Merch en la Orden */}
                  {merchItems.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-accent)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={16} /> Productos de Tienda ({merchItems.length})
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {merchItems.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: 'white' }}>{item.product_name}</div>
                              {item.variant_name && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Talla / Variante: {item.variant_name}</div>}
                              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Cantidad: {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 800, color: 'white' }}>
                              ${Number(item.total_price).toLocaleString('es-CO')} COP
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enlace rápido a Ver Boletas */}
                  {tickets.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                      <Link 
                        href="/account/tickets" 
                        style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: 700, 
                          color: 'var(--color-magenta)', 
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        Ir a Mis Boletas &rarr;
                      </Link>
                    </div>
                  )}

                  {order.tracking_number && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', borderLeft: '4px solid var(--color-magenta)' }}>
                      <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Número de Seguimiento de Envío:</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem', color: 'white' }}>{order.tracking_number}</div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
