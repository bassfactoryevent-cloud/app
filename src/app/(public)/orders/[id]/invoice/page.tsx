import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintInvoiceButton from "./PrintInvoiceButton";
import { getOrAssignInvoiceNumber } from "@/utils/orderFulfillment";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function OrderInvoicePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;

  // 1. Fetch order
  const { data: order, error } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  // Ensure consecutive invoice number is assigned if paid
  let invoiceNumber = order.payment_id;
  if (!invoiceNumber || !invoiceNumber.startsWith("BF-FAC-")) {
    try {
      invoiceNumber = await getOrAssignInvoiceNumber(orderId);
    } catch (e) {
      console.error("Error ensuring invoice number:", e);
      invoiceNumber = `BF-FAC-${orderId.slice(0, 6).toUpperCase()}`;
    }
  }

  // 2. Fetch merch items
  const { data: merchItems } = await supabase
    .from("merch_order_items")
    .select("*")
    .eq("order_id", orderId);

  // 3. Fetch tickets
  const { data: rawTickets } = await supabase
    .from("tickets")
    .select("id, tier_id, status")
    .eq("order_id", orderId);

  let ticketsWithTiers: any[] = [];
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

  // Group tickets by tier for neat invoice lines
  const ticketGroups: Record<string, {
    title: string;
    tierName: string;
    date: string;
    location: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }> = {};

  if (ticketsWithTiers && ticketsWithTiers.length > 0) {
    for (const t of ticketsWithTiers) {
      const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
      const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      const key = t.tier_id || "general";

      if (!ticketGroups[key]) {
        const unitPrice = Number(tier?.price || 0);
        ticketGroups[key] = {
          title: event?.title || "Evento Bassfactory",
          tierName: tier?.name || "General",
          date: event?.start_date ? new Date(event.start_date).toLocaleDateString("es-CO", { dateStyle: "long" }) : "",
          location: event?.location_name || "Bogotá, Colombia",
          quantity: 0,
          unitPrice,
          totalPrice: 0
        };
      }
      ticketGroups[key].quantity += 1;
      ticketGroups[key].totalPrice += ticketGroups[key].unitPrice;
    }
  }

  const orderDate = new Date(order.created_at).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const subtotal = Number(order.subtotal_amount || 0);
  const shippingCost = Number(order.shipping_cost || 0);
  const totalAmount = Number(order.total_amount || (subtotal + shippingCost));

  return (
    <div style={{ maxWidth: '850px', margin: '2rem auto', padding: '0 1.25rem' }}>
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }
          html, body {
            background-color: #08080a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, footer, nav, aside, [role="navigation"], .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .invoice-sheet {
            background-color: #0d0d12 !important;
            color: #ffffff !important;
            border: 1px solid #27272a !important;
            box-shadow: none !important;
            padding: 1.5rem 1.75rem !important;
            margin: 0 !important;
            page-break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-card {
            background-color: #121216 !important;
            border: 1px solid #27272a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-table th {
            background-color: #18181b !important;
            color: #a1a1aa !important;
            border-bottom: 1px solid #27272a !important;
            -webkit-print-color-adjust: exact !important;
          }
          .invoice-table td {
            background-color: #0e0e12 !important;
            color: #ffffff !important;
            border-bottom: 1px solid #1c1c22 !important;
            -webkit-print-color-adjust: exact !important;
          }
          .invoice-badge-status {
            background-color: #052e16 !important;
            color: #22c55e !important;
            border: 1px solid #166534 !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Top action buttons */}
      <PrintInvoiceButton orderId={order.id} backHref="/account/orders" />

      {/* Invoice Document Paper Container */}
      <div 
        className="invoice-sheet"
        style={{
          backgroundColor: '#0d0d12',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '0.75rem',
          padding: '2rem 2.25rem',
          color: '#ffffff',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)'
        }}
      >
        {/* Header: Brand & Invoice Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Image 
                src="/Bass-Factory-Blanco-Sin-Letras.png" 
                alt="Bassfactory" 
                width={135} 
                height={38} 
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#a1a1aa', lineHeight: 1.4 }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#ffffff' }}>BASSFACTORY ENTERTAINMENT S.A.S.</p>
              <p style={{ margin: 0 }}>NIT: 901.654.321-0</p>
              <p style={{ margin: 0 }}>Bogotá D.C., Colombia</p>
              <p style={{ margin: 0 }}>ventas@bassfactory.co • www.bassfactory.co</p>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              display: 'inline-block',
              backgroundColor: 'rgba(217, 4, 22, 0.15)',
              color: '#D90416',
              border: '1px solid rgba(217, 4, 22, 0.35)',
              padding: '0.25rem 0.75rem',
              borderRadius: '2rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.5rem'
            }}>
              Factura de Venta Electrónica
            </div>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, fontFamily: 'monospace', margin: '0 0 0.35rem 0', color: '#00F0FF' }}>
              {invoiceNumber}
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>
              Fecha: <strong style={{ color: '#ffffff' }}>{orderDate}</strong>
            </p>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#a1a1aa' }}>
              Ref Orden: <span style={{ fontFamily: 'monospace', color: '#ffffff' }}>#{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
            <div style={{ marginTop: '0.4rem' }}>
              <span className="invoice-badge-status" style={{
                display: 'inline-block',
                padding: '0.2rem 0.65rem',
                borderRadius: '0.35rem',
                backgroundColor: order.status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                border: order.status === 'paid' ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(234, 179, 8, 0.35)',
                color: order.status === 'paid' ? '#22c55e' : '#eab308',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {order.status === 'paid' ? '✓ PAGADA / APROBADA' : 'PENDIENTE DE PAGO'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="invoice-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem', padding: '1.25rem', backgroundColor: '#121216', borderRadius: '0.5rem', border: '1px solid #27272a' }}>
          <div>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', fontWeight: 800 }}>
              Adquiriente / Cliente:
            </h4>
            <p style={{ margin: '0 0 0.2rem 0', fontWeight: 700, fontSize: '0.95rem', color: '#ffffff' }}>
              {order.customer_name}
            </p>
            <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#a1a1aa' }}>
              {order.customer_email}
            </p>
            {order.customer_phone && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>
                Tel: {order.customer_phone}
              </p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', fontWeight: 800 }}>
              {order.shipping_address ? 'Destino de Despacho:' : 'Modalidad de Entrega:'}
            </h4>
            {order.shipping_address ? (
              <>
                <p style={{ margin: '0 0 0.2rem 0', fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                  {order.shipping_address}
                </p>
                <p style={{ margin: '0 0 0.2rem 0', fontSize: '0.82rem', color: '#a1a1aa' }}>
                  {order.shipping_city}, {order.shipping_country || 'Colombia'}
                  {order.shipping_zip ? ` (CP: ${order.shipping_zip})` : ''}
                </p>
                {order.tracking_number && (
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#00F0FF', fontWeight: 700 }}>
                    Guía de Envío: {order.tracking_number}
                  </p>
                )}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#a1a1aa' }}>
                Entrega Digital (Boleta Electrónica QR / Correo)
              </p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a', fontWeight: 800 }}>
              Forma y Medio de Pago:
            </h4>
            <p style={{ margin: '0 0 0.2rem 0', fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
              Bold Pasarela de Pagos (En línea)
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#a1a1aa' }}>
              PSE / Tarjetas de Crédito y Débito
            </p>
          </div>
        </div>

        {/* Table of Items */}
        <div style={{ overflowX: 'auto', marginBottom: '1.75rem' }}>
          <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #27272a', backgroundColor: '#18181b' }}>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#a1a1aa' }}>Tipo</th>
                <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#a1a1aa' }}>Descripción del Artículo</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#a1a1aa' }}>Cant</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#a1a1aa' }}>Precio Unit.</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.05em', color: '#a1a1aa' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Tickets */}
              {Object.values(ticketGroups).map((item, idx) => (
                <tr key={`t-${idx}`} style={{ borderBottom: '1px solid #1c1c22', backgroundColor: '#0e0e12' }}>
                  <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(217,4,22,0.2)', color: '#ff4d4d', padding: '0.2rem 0.45rem', borderRadius: '0.25rem' }}>
                      🎟️ Boleta
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '0.15rem' }}>
                      Localidad: <strong>{item.tierName}</strong> {item.date ? `• ${item.date}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#ffffff' }}>{item.quantity}</td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#a1a1aa' }}>
                    ${item.unitPrice.toLocaleString('es-CO')}
                  </td>
                  <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                    ${item.totalPrice.toLocaleString('es-CO')}
                  </td>
                </tr>
              ))}

              {/* Merch Items */}
              {merchItems && merchItems.map((item: any) => {
                const itemTotal = Number(item.total_price || (item.unit_price * item.quantity));
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1c1c22', backgroundColor: '#0e0e12' }}>
                    <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, backgroundColor: 'rgba(0,240,255,0.15)', color: '#00F0FF', padding: '0.2rem 0.45rem', borderRadius: '0.25rem' }}>
                        👕 Merch
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.product_name}</div>
                      {item.variant_name && (
                        <div style={{ fontSize: '0.75rem', color: '#00F0FF', marginTop: '0.15rem' }}>
                          Variante / Talla: <strong>{item.variant_name}</strong>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#ffffff' }}>{item.quantity}</td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: '#a1a1aa' }}>
                      ${Number(item.unit_price).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                      ${itemTotal.toLocaleString('es-CO')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem' }}>
          <div className="invoice-card" style={{ width: '100%', maxWidth: '320px', backgroundColor: '#121216', border: '1px solid #27272a', borderRadius: '0.5rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.82rem', color: '#a1a1aa' }}>
              <span>Subtotal Productos / Boletas:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>${subtotal > 0 ? subtotal.toLocaleString('es-CO') : (totalAmount - shippingCost).toLocaleString('es-CO')} COP</span>
            </div>
            {shippingCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.82rem', color: '#a1a1aa' }}>
                <span>Costo de Envío Nacional:</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>${shippingCost.toLocaleString('es-CO')} COP</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.82rem', color: '#a1a1aa' }}>
              <span>Impuestos / IVA Incluido:</span>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>$0 COP</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.75rem 0 0 0', 
              marginTop: '0.4rem', 
              borderTop: '1px solid #27272a', 
              fontSize: '1.15rem', 
              fontWeight: 900,
              color: '#ffffff' 
            }}>
              <span>Total Pagado:</span>
              <span style={{ color: '#00F0FF', fontFamily: 'monospace' }}>${totalAmount.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>

        {/* Legal & Footer Disclaimers */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', fontSize: '0.72rem', color: '#71717a', lineHeight: 1.5 }}>
          <p style={{ margin: '0 0 0.35rem 0' }}>
            <strong>Términos & Soporte:</strong> Este comprobante de venta electrónico certifica la adquisición exitosa de bienes o servicios a través de la plataforma digital Bassfactory.
          </p>
          <p style={{ margin: '0 0 0.35rem 0' }}>
            • <strong>Entradas a Eventos:</strong> Por motivos de seguridad física y control de taquilla, las boletas oficiales con código QR se habilitan en la cuenta del usuario exactamente 1 día antes del evento.
          </p>
          <p style={{ margin: 0 }}>
            • <strong>Merchandising Oficial:</strong> Los tiempos de entrega física estándar son de 3 a 5 días hábiles a nivel nacional. Para consultas o reclamaciones, contacta a soporte@bassfactory.co.
          </p>
        </div>
      </div>
    </div>
  );
}
