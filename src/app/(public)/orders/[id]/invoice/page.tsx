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
    <div style={{ maxWidth: '850px', margin: '3rem auto', padding: '0 1.5rem' }}>
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-sheet {
            background-color: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .invoice-table th {
            background-color: #f3f4f6 !important;
            color: #111827 !important;
            border-bottom: 2px solid #000 !important;
          }
          .invoice-table td {
            color: #111827 !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
          .invoice-text-muted {
            color: #4b5563 !important;
          }
          .invoice-badge {
            border: 1px solid #000 !important;
            color: #000 !important;
            background: transparent !important;
          }
        }
      `}</style>

      {/* Top action buttons */}
      <PrintInvoiceButton backHref="/account/orders" />

      {/* Invoice Document Paper Container */}
      <div 
        className="invoice-sheet"
        style={{
          backgroundColor: '#0d0d10',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '1rem',
          padding: '3rem',
          color: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header: Brand & Invoice Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <Image 
                src="/Bass-Factory-Blanco-Sin-Letras.png" 
                alt="Bassfactory" 
                width={140} 
                height={40} 
                style={{ objectFit: 'contain' }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.5 }}>
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
              border: '1px solid rgba(217, 4, 22, 0.3)',
              padding: '0.35rem 0.85rem',
              borderRadius: '2rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem'
            }}>
              Factura de Venta Electrónica
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'monospace', margin: '0 0 0.5rem 0', color: '#00F0FF' }}>
              {invoiceNumber}
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
              Fecha: <strong style={{ color: '#ffffff' }}>{orderDate}</strong>
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
              Ref Orden: <span style={{ fontFamily: 'monospace', color: '#ffffff' }}>#{orderId.slice(0, 8).toUpperCase()}</span>
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="invoice-badge" style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: order.status === 'paid' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                color: order.status === 'paid' ? '#22c55e' : '#eab308',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {order.status === 'paid' ? '✓ PAGADO / APROBADO' : 'PENDIENTE DE PAGO'}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '2.5rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
              Facturado a (Cliente):
            </h4>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1.05rem', color: '#ffffff' }}>
              {order.customer_name}
            </p>
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
              {order.customer_email}
            </p>
            {order.customer_phone && (
              <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
                Tel: {order.customer_phone}
              </p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
              {order.shipping_address ? 'Destino de Despacho:' : 'Modalidad de Entrega:'}
            </h4>
            {order.shipping_address ? (
              <>
                <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
                  {order.shipping_address}
                </p>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', opacity: 0.8 }}>
                  {order.shipping_city}, {order.shipping_country || 'Colombia'}
                  {order.shipping_zip ? ` (CP: ${order.shipping_zip})` : ''}
                </p>
                {order.tracking_number && (
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#00F0FF', fontWeight: 700 }}>
                    Guía de Envío: {order.tracking_number}
                  </p>
                )}
              </>
            ) : (
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>
                Entrega Digital (Boleta Electrónica QR / Correo)
              </p>
            )}
          </div>

          <div>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6 }}>
              Método de Pago:
            </h4>
            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.95rem', color: '#ffffff' }}>
              Bold Pasarela de Pagos
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>
              PSE / Tarjetas de Crédito y Débito
            </p>
          </div>
        </div>

        {/* Table of Items */}
        <div style={{ overflowX: 'auto', marginBottom: '2.5rem' }}>
          <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.8 }}>Tipo</th>
                <th style={{ padding: '0.85rem 1rem', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.8 }}>Descripción del Artículo</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.8 }}>Cant</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.8 }}>Precio Unitario</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.8 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Tickets */}
              {Object.values(ticketGroups).map((item, idx) => (
                <tr key={`t-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(217,4,22,0.15)', color: '#ff4d4d', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                      🎟️ Boleta
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>
                      Localidad: <strong>{item.tierName}</strong> {item.date ? `• ${item.date}` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', opacity: 0.8 }}>
                    ${item.unitPrice.toLocaleString('es-CO')} COP
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                    ${item.totalPrice.toLocaleString('es-CO')} COP
                  </td>
                </tr>
              ))}

              {/* Merch Items */}
              {merchItems && merchItems.map((item: any) => {
                const itemTotal = Number(item.total_price || (item.unit_price * item.quantity));
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(0,240,255,0.1)', color: '#00F0FF', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>
                        👕 Merch
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{item.product_name}</div>
                      {item.variant_name && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>
                          Variante / Talla: <strong>{item.variant_name}</strong>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                    <td style={{ padding: '1rem', textAlign: 'right', opacity: 0.8 }}>
                      ${Number(item.unit_price).toLocaleString('es-CO')} COP
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700, color: '#ffffff' }}>
                      ${itemTotal.toLocaleString('es-CO')} COP
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2.5rem' }}>
          <div style={{ width: '100%', maxWidth: '340px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
              <span>Subtotal Productos / Boletas:</span>
              <span style={{ fontWeight: 600 }}>${subtotal > 0 ? subtotal.toLocaleString('es-CO') : (totalAmount - shippingCost).toLocaleString('es-CO')} COP</span>
            </div>
            {shippingCost > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
                <span>Costo de Envío Nacional:</span>
                <span style={{ fontWeight: 600 }}>${shippingCost.toLocaleString('es-CO')} COP</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.9rem', opacity: 0.8 }}>
              <span>Impuestos / IVA Incluido:</span>
              <span style={{ fontWeight: 600 }}>$0 COP</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '1rem 0 0 0', 
              marginTop: '0.5rem', 
              borderTop: '2px solid rgba(255,255,255,0.15)', 
              fontSize: '1.25rem', 
              fontWeight: 900,
              color: '#ffffff' 
            }}>
              <span>Total Pagado:</span>
              <span style={{ color: '#00F0FF' }}>${totalAmount.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>

        {/* Legal & Footer Disclaimers */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', fontSize: '0.78rem', opacity: 0.6, lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>Términos & Soporte:</strong> Este comprobante de venta electrónico certifica la adquisición exitosa de bienes o servicios a través de la plataforma digital Bassfactory.
          </p>
          <p style={{ margin: '0 0 0.5rem 0' }}>
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
