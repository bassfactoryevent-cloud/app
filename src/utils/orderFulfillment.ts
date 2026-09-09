import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getPurchaseConfirmationEmail, PurchasedItem } from "@/utils/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_fallback");

// Use service role on server to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function sendOrderConfirmationEmail(orderId: string, customEmail?: string) {
  try {
    // 1. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("merch_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order fetch failed in sendOrderConfirmationEmail:", orderError);
      return false;
    }

    const recipientEmail = customEmail || order.customer_email;
    if (!recipientEmail || !process.env.RESEND_API_KEY) {
      return false;
    }

    // 2. Fetch tickets associated with this order (without broken foreign key join)
    const { data: rawTickets } = await supabase
      .from("tickets")
      .select("id, qr_hash, tier_id")
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
      } else {
        ticketsWithTiers = rawTickets;
      }
    }

    // 3. Fetch merchandise items
    const { data: items } = await supabase
      .from("merch_order_items")
      .select("product_name, variant_name, quantity, unit_price, total_price")
      .eq("order_id", orderId);

    const purchasedItems: PurchasedItem[] = [];

    // Map tickets grouped by tier
    if (ticketsWithTiers && ticketsWithTiers.length > 0) {
      const ticketsByTier: Record<string, {
        tierName: string;
        eventTitle: string;
        eventDate: string;
        eventLocation: string;
        count: number;
        ticketCodes: string[];
        unitPrice: number;
      }> = {};

      for (const t of ticketsWithTiers) {
        const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
        const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
        const tierId = t.tier_id || 'general';

        if (!ticketsByTier[tierId]) {
          const formattedDate = event?.start_date
            ? new Date(event.start_date).toLocaleDateString('es-CO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : '';

          ticketsByTier[tierId] = {
            tierName: tier?.name || 'General',
            eventTitle: event?.title || 'Evento Bassfactory',
            eventDate: formattedDate,
            eventLocation: event?.location_name || 'Bogotá, Colombia',
            count: 0,
            ticketCodes: [],
            unitPrice: Number(tier?.price || 0)
          };
        }

        ticketsByTier[tierId].count += 1;
        ticketsByTier[tierId].ticketCodes.push(`#${t.id.slice(0, 8).toUpperCase()}`);
      }

      for (const group of Object.values(ticketsByTier)) {
        purchasedItems.push({
          type: 'ticket',
          title: `Entrada Oficial: ${group.eventTitle}`,
          tierOrVariant: `Localidad: ${group.tierName}`,
          eventDate: group.eventDate,
          eventLocation: group.eventLocation,
          quantity: group.count,
          priceFormatted: group.unitPrice > 0 ? `$${(group.unitPrice * group.count).toLocaleString('es-CO')} COP` : undefined,
          ticketCodes: group.ticketCodes
        });
      }
    }

    // Map merchandise items
    if (items && items.length > 0) {
      for (const item of items) {
        const totalPrice = item.total_price || (item.unit_price * item.quantity);
        purchasedItems.push({
          type: 'merch',
          title: item.product_name,
          tierOrVariant: item.variant_name ? `Variante: ${item.variant_name}` : undefined,
          quantity: item.quantity,
          priceFormatted: totalPrice ? `$${Number(totalPrice).toLocaleString('es-CO')} COP` : undefined
        });
      }
    }

    const hasTickets = !!(ticketsWithTiers && ticketsWithTiers.length > 0);
    const hasMerch = !!(items && items.length > 0);
    const formattedAmount = Number(order.total_amount || 0).toLocaleString("es-CO");
    const shortId = order.id.substring(0, 8).toUpperCase();

    const emailHtml = getPurchaseConfirmationEmail(
      order.customer_name || "Cliente",
      formattedAmount,
      shortId,
      hasTickets,
      hasMerch,
      purchasedItems
    );

    await resend.emails.send({
      from: "Bassfactory Ventas <ventas@bassfactory.co>",
      to: recipientEmail,
      subject: `Confirmación de Compra - Orden #${shortId}`,
      html: emailHtml
    });

    console.log(`Purchase confirmation email with ${purchasedItems.length} items sent to ${recipientEmail}`);
    return true;
  } catch (err) {
    console.error("Error in sendOrderConfirmationEmail:", err);
    return false;
  }
}

export async function fulfillOrder(orderId: string) {
  // 1. Fetch current order
  const { data: order, error: orderError } = await supabase
    .from("merch_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Order fetch failed:", orderError);
    throw new Error("Order not found");
  }

  // Avoid duplicate fulfillment if already paid
  if (order.status === "paid") {
    console.log(`Order ${orderId} already marked as paid.`);
    return true;
  }

  // 2. Mark order as paid
  await supabase
    .from("merch_orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", orderId);

  // 3. Validate and activate tickets (change from 'void' to 'valid')
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .update({ status: "valid" })
    .eq("order_id", orderId)
    .select("id, qr_hash, tier_id");

  if (ticketsError) {
    console.error("Tickets activation failed:", ticketsError);
  }

  // 4. Reduce stock for ticket tiers
  if (tickets && tickets.length > 0) {
    const tierCounts: Record<string, number> = {};
    for (const t of tickets) {
      if (t.tier_id) {
        tierCounts[t.tier_id] = (tierCounts[t.tier_id] || 0) + 1;
      }
    }

    for (const [tierId, count] of Object.entries(tierCounts)) {
      const { data: tier } = await supabase
        .from("ticket_tiers")
        .select("quantity_available")
        .eq("id", tierId)
        .single();

      if (tier && typeof tier.quantity_available === "number") {
        await supabase
          .from("ticket_tiers")
          .update({
            quantity_available: Math.max(0, tier.quantity_available - count)
          })
          .eq("id", tierId);
      }
    }
  }

  // 5. Process Merch stock reduction
  const { data: items } = await supabase
    .from("merch_order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  if (items && items.length > 0) {
    for (const item of items) {
      if (item.variant_id) {
        const { data: variant } = await supabase
          .from("merch_product_variants")
          .select("stock_quantity")
          .eq("id", item.variant_id)
          .single();
          
        if (variant && typeof variant.stock_quantity === "number") {
          await supabase
            .from("merch_product_variants")
            .update({
              stock_quantity: Math.max(0, variant.stock_quantity - item.quantity)
            })
            .eq("id", item.variant_id);
        }
      }
    }
  }

  // 6. Send General Confirmation Email with purchased items list
  await sendOrderConfirmationEmail(orderId);

  // 7. Las boletas oficiales con código QR se despachan automáticamente 1 día antes del evento a través del cron job (/api/cron/dispatch-tickets).

  return true;
}
