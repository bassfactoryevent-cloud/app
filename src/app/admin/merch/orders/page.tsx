import { createClient } from "@/utils/supabase/server";
import { ListOrdered, Package, Truck } from "lucide-react";
import Link from "next/link";

export default async function MerchOrdersPage() {
  const supabase = await createClient();

  // Muestra las órdenes más recientes
  const { data: orders } = await supabase
    .from("merch_orders")
    .select(`
      *,
      merch_order_items(product_name, variant_name, quantity, total_price)
    `)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
            <ListOrdered size={32} />
            Órdenes de Compra
          </h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Gestiona los pedidos de merch realizados por los clientes.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {orders?.map((order: any) => (
          <div key={order.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>{new Date(order.created_at).toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, 
                  backgroundColor: order.status === 'paid' ? '#22c55e' : order.status === 'shipped' ? '#3b82f6' : '#f59e0b',
                  color: 'white'
                }}>
                  {order.status.toUpperCase()}
                </span>
                <p style={{ fontWeight: 800, fontSize: '1.25rem', marginTop: '0.5rem', color: 'var(--color-magenta)' }}>
                  ${parseFloat(order.total_amount).toLocaleString('es-CO')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Cliente</h4>
                <p style={{ fontWeight: 600 }}>{order.customer_name}</p>
                <p style={{ fontSize: '0.875rem' }}>{order.customer_email}</p>
                <p style={{ fontSize: '0.875rem' }}>{order.customer_phone}</p>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Envío</h4>
                <p style={{ fontSize: '0.875rem' }}>{order.shipping_address}</p>
                <p style={{ fontSize: '0.875rem' }}>{order.shipping_city}, {order.shipping_country}</p>
                {order.tracking_number && <p style={{ fontSize: '0.875rem', color: 'var(--color-magenta)' }}><Truck size={14} style={{ display: 'inline', marginRight: '4px' }} /> Guía: {order.tracking_number}</p>}
              </div>
              <div style={{ flex: 2 }}>
                <h4 style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.5rem' }}>Artículos</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                  {order.merch_order_items.map((item: any, i: number) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>{item.quantity}x {item.product_name} {item.variant_name && `(${item.variant_name})`}</span>
                      <span style={{ fontWeight: 600 }}>${parseFloat(item.total_price).toLocaleString('es-CO')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        {(!orders || orders.length === 0) && (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay pedidos aún</h3>
            <p style={{ opacity: 0.7 }}>Las compras de tus clientes aparecerán aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
