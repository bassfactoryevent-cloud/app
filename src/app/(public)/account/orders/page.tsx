import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Package, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getAdminClient } from "@/utils/supabase/admin";
import OrdersListClient from "./OrdersListClient";

const adminDb = getAdminClient();

export default async function AccountOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user merch orders with items and tickets (matching user_id or customer_email)
  const { data: orders } = await adminDb
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
    .or(`user_id.eq.${user.id},customer_email.ilike.${user.email}`)
    .order("created_at", { ascending: false });

  // Fetch tickets for all orders
  let orderTicketsMap: Record<string, any[]> = {};
  if (orders && orders.length > 0) {
    const orderIds = orders.map((o: any) => o.id);
    const { data: tickets } = await adminDb
      .from("tickets")
      .select("id, order_id, status, tier_id")
      .in("order_id", orderIds);

    if (tickets && tickets.length > 0) {
      const tierIds = Array.from(new Set(tickets.map((t: any) => t.tier_id).filter(Boolean)));
      const { data: tiers } = await adminDb
        .from("ticket_tiers")
        .select(`
          id,
          name,
          events (
            title,
            start_date,
            location_name
          )
        `)
        .in("id", tierIds);

      const tierMap = new Map((tiers || []).map((t: any) => [t.id, t]));
      for (const t of tickets) {
        if (!orderTicketsMap[t.order_id]) {
          orderTicketsMap[t.order_id] = [];
        }
        orderTicketsMap[t.order_id].push({
          ...t,
          ticket_tiers: tierMap.get(t.tier_id)
        });
      }
    }
  }

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
        <OrdersListClient initialOrders={orders} orderTicketsMap={orderTicketsMap} />
      )}
    </div>
  );
}
