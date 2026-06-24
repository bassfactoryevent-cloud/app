import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Package, Truck, CheckCircle } from "lucide-react";

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user merch orders with items
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

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'pending': return { icon: <Package />, color: '#eab308', text: 'Pendiente' };
      case 'paid': return { icon: <Package />, color: '#3b82f6', text: 'Pagado' };
      case 'shipped': return { icon: <Truck />, color: '#a855f7', text: 'Enviado' };
      case 'delivered': return { icon: <CheckCircle />, color: '#22c55e', text: 'Entregado' };
      default: return { icon: <Package />, color: '#9ca3af', text: status };
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Mis Compras (Merch)</h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Historial de tus pedidos en la tienda de Bassfactory.</p>

      {!orders || orders.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p style={{ opacity: 0.7, marginBottom: '1rem' }}>No has realizado ninguna compra de merch aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map((order: any) => {
            const statusConfig = getStatusConfig(order.status);
            
            return (
              <div key={order.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                      Pedido del {new Date(order.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', opacity: 0.5 }}>
                      ID: {order.id.split('-')[0]}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: statusConfig.color, fontWeight: 700, backgroundColor: `${statusConfig.color}20`, padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                    {statusConfig.icon} {statusConfig.text}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '0.25rem' }}>Total pagado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                      ${order.total_amount.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Artículos:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {order.merch_order_items.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                          {item.variant_name && <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Variante: {item.variant_name}</div>}
                          <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Cantidad: {item.quantity}</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          ${item.total_price.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {order.tracking_number && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', borderLeft: '4px solid var(--color-magenta)' }}>
                      <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Número de Seguimiento:</div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>{order.tracking_number}</div>
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
