import Link from "next/link";
import { 
  CheckCircle2, 
  Clock, 
  Package, 
  Ticket, 
  AlertCircle, 
  FileText, 
  ShoppingBag, 
  MapPin, 
  Truck, 
  ShieldCheck,
  Calendar,
  ChevronRight
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { fulfillOrder, getOrAssignInvoiceNumber } from "@/utils/orderFulfillment";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function CheckoutSuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.order_id || resolvedParams['bold-order-id'];
  
  const boldStatus = (
    resolvedParams['bold-order-status'] || 
    resolvedParams['bold-tx-status'] || 
    resolvedParams['status'] || 
    ''
  ).toLowerCase();

  const isExplicitRejected = 
    boldStatus === 'rejected' || 
    boldStatus === 'failed' || 
    boldStatus === 'declined' || 
    boldStatus === 'cancelled' ||
    boldStatus.includes('reject') ||
    boldStatus.includes('fail');

  const isExplicitApproved = 
    boldStatus === 'approved' || 
    boldStatus === 'successful' || 
    boldStatus === 'paid' || 
    boldStatus.includes('approv') ||
    boldStatus.includes('success');

  // Trigger fulfillment if arriving with an approved status
  if (orderId && isExplicitApproved) {
    try {
      await fulfillOrder(orderId);
    } catch (err) {
      console.error("Fulfillment check error in success page:", err);
    }
  }

  let order: any = null;
  let merchItems: any[] = [];
  let ticketsWithTiers: any[] = [];
  let invoiceNumber: string | null = null;

  if (orderId) {
    try {
      // 1. Fetch order
      const { data: orderData } = await supabase
        .from("merch_orders")
        .select("*")
        .eq("id", orderId)
        .single();
      order = orderData;

      // 2. Fetch merch items
      const { data: itemsData } = await supabase
        .from("merch_order_items")
        .select("*")
        .eq("order_id", orderId);
      merchItems = itemsData || [];

      // 3. Fetch tickets
      const { data: rawTickets } = await supabase
        .from("tickets")
        .select("id, tier_id, status")
        .eq("order_id", orderId);

      if (rawTickets && rawTickets.length > 0) {
        const tierIds = Array.from(new Set(rawTickets.map((t: any) => t.tier_id).filter(Boolean)));
        if (tierIds.length > 0) {
          const { data: tiersData } = await supabase
            .from("ticket_tiers")
            .select(`
              id,
              name,
              price,
              events (
                title,
                start_date,
                location_name
              )
            `)
            .in("id", tierIds);

          ticketsWithTiers = rawTickets.map((t: any) => ({
            ...t,
            ticket_tiers: tiersData?.find((tr: any) => tr.id === t.tier_id) || null
          }));
        }
      }

      // If order is paid, ensure invoice number is assigned
      if (order?.status === "paid") {
        invoiceNumber = order.payment_id;
        if (!invoiceNumber || !invoiceNumber.startsWith("BF-FAC-")) {
          try {
            invoiceNumber = await getOrAssignInvoiceNumber(orderId);
          } catch (e) {
            console.error("Error ensuring invoice number in success page:", e);
            invoiceNumber = `BF-FAC-${orderId.slice(0, 6).toUpperCase()}`;
          }
        }
      }
    } catch (e) {
      console.error("Error fetching order in success page:", e);
    }
  }

  const isPaid = order?.status === "paid" || (!isExplicitRejected && isExplicitApproved);
  const isPending = !isPaid && !isExplicitRejected && (order?.status === "pending" || boldStatus.includes("pend") || boldStatus.includes("proc"));
  const isRejected = isExplicitRejected || order?.status === "cancelled";

  const hasMerch = merchItems.length > 0;
  const hasTickets = ticketsWithTiers.length > 0;
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : "";

  // 1. REJECTED / FAILED STATE
  if (isRejected) {
    return (
      <div style={{ maxWidth: '650px', margin: '4rem auto', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'rgba(217,4,22,0.03)', borderRadius: '1rem', border: '1px solid rgba(217,4,22,0.2)' }}>
        <AlertCircle size={64} style={{ color: '#ef4444', margin: '0 auto 1.5rem' }} />
        
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>
          Pago No Completado
        </h1>
        
        <p style={{ fontSize: '1.05rem', color: '#a1a1aa', marginBottom: '2rem', lineHeight: 1.6 }}>
          La transacción no pudo ser procesada o fue rechazada por la entidad bancaria. No se ha realizado ningún cobro a tu cuenta.
        </p>

        {shortId && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package size={20} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Referencia de intento:</span>
            <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'white' }}>#{shortId}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/cart" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.75rem', 
              backgroundColor: 'var(--color-magenta)', color: 'white', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 700 
            }}
          >
            Reintentar en el Carrito
          </Link>
          <Link 
            href="/merch" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.5rem', 
              backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 600 
            }}
          >
            <ShoppingBag size={18} /> Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  // 2. PENDING STATE
  if (isPending) {
    return (
      <div style={{ maxWidth: '650px', margin: '4rem auto', padding: '3.5rem 2rem', textAlign: 'center', backgroundColor: 'rgba(234,179,8,0.03)', borderRadius: '1rem', border: '1px solid rgba(234,179,8,0.2)' }}>
        <Clock size={64} style={{ color: '#eab308', margin: '0 auto 1.5rem' }} />
        
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>
          Pago en Verificación
        </h1>
        
        <p style={{ fontSize: '1.05rem', color: '#a1a1aa', marginBottom: '2rem', lineHeight: 1.6 }}>
          Tu entidad financiera está procesando la transacción a través de Bold (PSE / Bancos). Tan pronto se confirme el pago, recibirás tu factura oficial y la confirmación en tu correo.
        </p>

        {shortId && (
          <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            <Package size={20} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Orden Referencia:</span>
            <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'white' }}>#{shortId}</strong>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/account/orders" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.75rem', 
              backgroundColor: 'var(--color-magenta)', color: 'white', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 700 
            }}
          >
            <Package size={18} /> Ver Estado en Mis Pedidos
          </Link>
          <Link 
            href="/" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.5rem', 
              backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 600 
            }}
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    );
  }

  // 3. SUCCESS / PAID STATE
  return (
    <div style={{ maxWidth: '750px', margin: '3rem auto', padding: '0 1.5rem 4rem' }}>
      
      {/* Header Banner */}
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem 2rem', 
        backgroundColor: 'rgba(255,255,255,0.02)', 
        borderRadius: '1rem', 
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '2rem'
      }}>
        <CheckCircle2 size={68} style={{ color: '#22c55e', margin: '0 auto 1.25rem' }} />
        
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '0.75rem', color: 'white' }}>
          {hasMerch && !hasTickets 
            ? "¡Pedido Confirmado!" 
            : hasTickets && !hasMerch 
              ? "¡Entradas Confirmadas!" 
              : "¡Compra Confirmada!"}
        </h1>
        
        <p style={{ fontSize: '1.05rem', color: '#a1a1aa', maxWidth: '580px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          {hasMerch && !hasTickets ? (
            "Hemos recibido tu pago con éxito. Tu pedido de mercancía física está siendo preparado en nuestro centro de distribución y te notificaremos cuando sea despachado."
          ) : hasTickets && !hasMerch ? (
            "Tu orden ha sido procesada con éxito. Tus boletas están aseguradas en tu cuenta para el evento."
          ) : (
            "Tu orden combinada ha sido procesada con éxito. Tus boletas están aseguradas y tus artículos de tienda física están en preparación."
          )}
        </p>

        {/* Invoice & Order Badges */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '1rem', 
          flexWrap: 'wrap',
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '1.25rem 1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255,255,255,0.05)',
          maxWidth: '520px',
          margin: '0 auto'
        }}>
          {invoiceNumber && (
            <div style={{ textAlign: 'left', paddingRight: '1rem', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#00F0FF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Factura Oficial N°
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'monospace', color: 'white' }}>
                {invoiceNumber}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Referencia de Orden
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, fontFamily: 'monospace', color: 'white' }}>
              #{shortId}
            </div>
          </div>
        </div>
      </div>

      {/* TICKET SPECIFIC NOTICE (Only shown if tickets were purchased) */}
      {hasTickets && (
        <div style={{
          backgroundColor: 'rgba(217, 4, 22, 0.08)',
          border: '1px solid rgba(217, 4, 22, 0.25)',
          borderRadius: '1rem',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          <ShieldCheck size={24} style={{ color: 'var(--color-magenta)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ color: 'white', fontWeight: 700, margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
              Protocolo de Seguridad Antifraude en Boletas
            </h4>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
              Tus entradas están 100% aseguradas. Por seguridad y prevención de clonación o reventa no autorizada, <strong>tu boleta oficial con código QR se habilitará y enviará exactamente 1 día antes del evento</strong>.
            </p>
          </div>
        </div>
      )}

      {/* MERCH SPECIFIC NOTICE / SHIPPING ADDRESS (Only shown if merch was purchased) */}
      {hasMerch && (
        <div style={{
          backgroundColor: 'rgba(0, 240, 255, 0.04)',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Truck size={22} style={{ color: '#00F0FF' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Información de Entrega y Envío
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Destinatario:</div>
              <div style={{ color: 'white', fontWeight: 700 }}>{order?.customer_name}</div>
              <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{order?.customer_email}</div>
              {order?.customer_phone && <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Tel: {order?.customer_phone}</div>}
            </div>

            <div>
              <div style={{ color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Dirección de Envío:</div>
              <div style={{ color: 'white', fontWeight: 600 }}>{order?.shipping_address}</div>
              <div style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>
                {order?.shipping_city}, {order?.shipping_country || 'Colombia'}
                {order?.shipping_zip ? ` (CP: ${order?.shipping_zip})` : ''}
              </div>
            </div>

            <div>
              <div style={{ color: '#a1a1aa', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Estado de Logística:</div>
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                backgroundColor: 'rgba(0, 240, 255, 0.12)', 
                color: '#00F0FF', 
                padding: '0.3rem 0.75rem', 
                borderRadius: '1rem', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                <Package size={14} /> En Preparación
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ITEMS BREAKDOWN CARD */}
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: '1rem',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'white', marginBottom: '1.25rem' }}>
          Resumen de Artículos Adquiridos
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Ticket items */}
          {ticketsWithTiers.map((t: any) => {
            const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
            const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
            return (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Ticket size={20} style={{ color: 'var(--color-magenta)' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{event?.title || 'Boleta de Evento'}</div>
                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Localidad: {tier?.name || 'General'}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.25rem 0.6rem', borderRadius: '1rem' }}>
                    ✓ 1 Entrada
                  </span>
                </div>
              </div>
            );
          })}

          {/* Merch items */}
          {merchItems.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Package size={20} style={{ color: '#00F0FF' }} />
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{item.product_name}</div>
                  {item.variant_name && <div style={{ fontSize: '0.8rem', color: '#00F0FF' }}>Talla / Variante: {item.variant_name}</div>}
                  <div style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Cantidad: {item.quantity}</div>
                </div>
              </div>
              <div style={{ fontWeight: 800, color: 'white', fontSize: '0.95rem' }}>
                ${Number(item.total_price || (item.unit_price * item.quantity)).toLocaleString('es-CO')} COP
              </div>
            </div>
          ))}
        </div>

        {/* Total summary */}
        {order?.total_amount && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Total Facturado:</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#00F0FF' }}>
              ${Number(order.total_amount).toLocaleString('es-CO')} COP
            </span>
          </div>
        )}
      </div>

      {/* DYNAMIC ACTION BUTTONS */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* If Merch purchased: Primary button is "Ver Mis Pedidos" */}
        {hasMerch && (
          <Link 
            href="/account/orders" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.75rem', 
              backgroundColor: 'var(--color-magenta)', color: 'white', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 700,
              boxShadow: '0 4px 15px rgba(217,4,22,0.4)'
            }}
          >
            <Package size={18} /> Ver Mis Pedidos
          </Link>
        )}

        {/* If Tickets purchased: Button "Ver Mis Boletas" */}
        {hasTickets && (
          <Link 
            href="/account/tickets" 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.75rem', 
              backgroundColor: hasMerch ? 'rgba(255,255,255,0.1)' : 'var(--color-magenta)', 
              color: 'white', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 700,
              boxShadow: hasMerch ? 'none' : '0 4px 15px rgba(217,4,22,0.4)'
            }}
          >
            <Ticket size={18} /> Ver Mis Boletas
          </Link>
        )}

        {/* Invoice Button */}
        {order?.id && (
          <Link 
            href={`/orders/${order.id}/invoice`} 
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 1.5rem', 
              backgroundColor: 'rgba(0, 240, 255, 0.1)', 
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#00F0FF', 
              textDecoration: 'none', borderRadius: '0.5rem', 
              fontWeight: 700 
            }}
          >
            <FileText size={18} /> Ver Factura Oficial
          </Link>
        )}

        {/* Continue Shopping / Store button */}
        <Link 
          href={hasMerch ? "/merch" : "/events"} 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 1.5rem', 
            backgroundColor: 'rgba(255,255,255,0.08)', color: 'white', 
            textDecoration: 'none', borderRadius: '0.5rem', 
            fontWeight: 600 
          }}
        >
          {hasMerch ? <ShoppingBag size={18} /> : null}
          {hasMerch ? "Seguir en la Tienda" : "Explorar Eventos"}
        </Link>
      </div>

    </div>
  );
}
