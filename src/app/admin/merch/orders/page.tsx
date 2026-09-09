import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ListOrdered, ArrowLeft } from "lucide-react";
import Link from "next/link";
import MerchOrdersClient from "./MerchOrdersClient";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function MerchOrdersPage() {
  // 1. Obtener todas las órdenes de merch con sus ítems detallados
  const { data: rawOrders } = await adminDb
    .from("merch_orders")
    .select(`
      id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_country,
      shipping_zip,
      subtotal_amount,
      shipping_cost,
      total_amount,
      status,
      payment_provider,
      tracking_number,
      created_at,
      user_id,
      merch_order_items (
        id,
        product_name,
        variant_name,
        quantity,
        unit_price,
        total_price
      )
    `)
    .order("created_at", { ascending: false });

  // 2. Obtener IDs de órdenes que corresponden a boletas para excluirlas estrictamente
  const { data: ticketOrders } = await adminDb
    .from("tickets")
    .select("order_id");

  const ticketOrderIds = new Set((ticketOrders || []).map((t: any) => t.order_id).filter(Boolean));

  // 3. DISCRIMINACIÓN ESTRICTA:
  // Solo se consideran órdenes de Merch aquellas que tienen productos físicos en merch_order_items,
  // NO son tickets electrónicos y su dirección NO es "Digital / Boleta Electrónica".
  const merchOnlyOrders = (rawOrders || []).filter((order: any) => {
    // Si la orden está en la tabla de tickets, es boletería
    if (ticketOrderIds.has(order.id)) return false;

    // Si la dirección dice digital o boleta electrónica, es boletería
    if (order.shipping_address && order.shipping_address.toLowerCase().includes("digital")) return false;

    // Si no tiene ítems de merch y no tiene dirección física, descartar
    const hasMerchItems = order.merch_order_items && order.merch_order_items.length > 0;
    return hasMerchItems;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Link 
              href="/admin/merch" 
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', textDecoration: 'none' }}
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
              <ListOrdered size={28} style={{ color: 'var(--color-magenta)' }} />
              Pedidos de Tienda (Merchandise)
            </h1>
          </div>
          <p style={{ opacity: 0.7, marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Panel logístico de despacho y seguimiento de pedidos físicos de ropa y accesorios.
          </p>
        </div>

        <Link
          href="/admin/merch"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.25rem',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none'
          }}
        >
          Volver a Inventario
        </Link>
      </div>

      <MerchOrdersClient initialOrders={merchOnlyOrders} />
    </div>
  );
}
