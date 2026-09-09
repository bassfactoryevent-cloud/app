import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getPurchaseConfirmationEmail } from "@/utils/emailTemplates";
import { sendTicketEmail } from "@/utils/sendTicketEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use service role on server to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

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
    .select(`
      id,
      qr_hash,
      tier_id,
      ticket_tiers (
        id,
        name,
        events (
          title,
          start_date,
          location_name
        )
      )
    `);

  if (ticketsError) {
    console.error("Tickets activation failed:", ticketsError);
  }

  // 4. Reduce stock for ticket tiers
  if (tickets && tickets.length > 0) {
    // Group counts by tier_id
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

  const hasTickets = !!(tickets && tickets.length > 0);
  const hasMerch = !!(items && items.length > 0);

  // 6. Send General Confirmation Email
  if (process.env.RESEND_API_KEY && order.customer_email) {
    try {
      const formattedAmount = Number(order.total_amount || 0).toLocaleString("es-CO");
      const shortId = order.id.substring(0, 8).toUpperCase();
      const emailHtml = getPurchaseConfirmationEmail(
        order.customer_name || "Cliente",
        formattedAmount,
        shortId,
        hasTickets,
        hasMerch
      );

      await resend.emails.send({
        from: "Bassfactory Ventas <ventas@bassfactory.co>",
        to: order.customer_email,
        subject: `Confirmación de Compra - Orden #${shortId}`,
        html: emailHtml
      });
    } catch (emailErr) {
      console.error("Error sending purchase confirmation email:", emailErr);
    }
  }

  // 7. Las boletas oficiales con código QR no se envían de inmediato por seguridad:
  // Se despachan automáticamente 1 día antes del evento a través del cron job (/api/cron/dispatch-tickets).

  return true;
}
