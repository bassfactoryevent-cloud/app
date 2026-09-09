import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF, InvoiceItem } from "@/components/pdf/InvoicePDF";
import { getOrAssignInvoiceNumber } from "@/utils/orderFulfillment";
import React from "react";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId) {
      return NextResponse.json({ error: "ID de orden requerido" }, { status: 400 });
    }

    // 1. Fetch order details
    const { data: order, error: orderError } = await adminSupabase
      .from("merch_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // 2. Ensure consecutive invoice number is assigned
    let invoiceNumber = order.payment_id;
    if (!invoiceNumber || !invoiceNumber.startsWith("BF-FAC-")) {
      try {
        invoiceNumber = await getOrAssignInvoiceNumber(orderId);
      } catch (e) {
        console.error("Error retrieving invoice number for PDF:", e);
        invoiceNumber = `BF-FAC-${orderId.slice(0, 6).toUpperCase()}`;
      }
    }

    // 3. Fetch merchandise items
    const { data: merchItems } = await adminSupabase
      .from("merch_order_items")
      .select("*")
      .eq("order_id", orderId);

    // 4. Fetch tickets associated with this order
    const { data: rawTickets } = await adminSupabase
      .from("tickets")
      .select("id, tier_id")
      .eq("order_id", orderId);

    let ticketsWithTiers: any[] = [];
    if (rawTickets && rawTickets.length > 0) {
      const tierIds = Array.from(new Set(rawTickets.map((t: any) => t.tier_id).filter(Boolean)));
      if (tierIds.length > 0) {
        const { data: tiersData } = await adminSupabase
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

    // Build unified items list
    const items: InvoiceItem[] = [];

    // Map tickets grouped by tier
    if (ticketsWithTiers.length > 0) {
      const ticketGroups: Record<string, {
        title: string;
        tierName: string;
        quantity: number;
        unitPrice: number;
      }> = {};

      for (const t of ticketsWithTiers) {
        const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
        const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
        const key = t.tier_id || "general";

        if (!ticketGroups[key]) {
          ticketGroups[key] = {
            title: `Boleta Oficial: ${event?.title || 'Evento Bassfactory'}`,
            tierName: `Localidad: ${tier?.name || 'General'}`,
            quantity: 0,
            unitPrice: Number(tier?.price || 0),
          };
        }
        ticketGroups[key].quantity += 1;
      }

      for (const group of Object.values(ticketGroups)) {
        items.push({
          type: 'ticket',
          title: group.title,
          variantOrTier: group.tierName,
          quantity: group.quantity,
          unitPrice: group.unitPrice,
          totalPrice: group.unitPrice * group.quantity,
        });
      }
    }

    // Map merch items
    if (merchItems && merchItems.length > 0) {
      for (const m of merchItems) {
        const unitPrice = Number(m.unit_price || 0);
        const qty = Number(m.quantity || 1);
        const totalPrice = Number(m.total_price || (unitPrice * qty));
        items.push({
          type: 'merch',
          title: m.product_name,
          variantOrTier: m.variant_name ? `Variante: ${m.variant_name}` : undefined,
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });
      }
    }

    // 5. Read logo as base64 Data URI
    let logoDataUri: string | undefined = undefined;
    try {
      const logoPath = path.join(process.cwd(), "public", "Bass-Factory-Blanco-Sin-Letras.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (logoErr) {
      console.error("Error reading logo file:", logoErr);
    }

    const orderDate = new Date(order.created_at).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const subtotal = Number(order.subtotal_amount || 0);
    const shippingCost = Number(order.shipping_cost || 0);
    const totalAmount = Number(order.total_amount || (subtotal + shippingCost));

    // 6. Generate PDF stream
    const pdfStream = await renderToStream(
      React.createElement(InvoicePDF, {
        invoiceNumber: invoiceNumber,
        orderId: order.id,
        orderDate: orderDate,
        customerName: order.customer_name || "Cliente",
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone || undefined,
        shippingAddress: order.shipping_address || undefined,
        shippingCity: order.shipping_city || undefined,
        shippingCountry: order.shipping_country || undefined,
        shippingZip: order.shipping_zip || undefined,
        paymentProvider: "Bold Pasarela de Pagos (En línea)",
        subtotal: subtotal > 0 ? subtotal : (totalAmount - shippingCost),
        shippingCost: shippingCost,
        totalAmount: totalAmount,
        items: items,
        logoDataUri: logoDataUri,
      }) as any
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Uint8Array);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const filename = `Factura_${invoiceNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("Error generating invoice PDF:", err);
    return NextResponse.json(
      { error: err.message || "Error al generar la factura en PDF" },
      { status: 500 }
    );
  }
}
