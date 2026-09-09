import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getPurchaseConfirmationEmail } from "@/utils/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use service role to bypass RLS in the webhook
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Make sure to add this to .env
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fulfillOrder(orderId: string) {
  // 1. Mark order as paid
  const { data: order, error: orderError } = await supabase
    .from("merch_orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .select()
    .single();

  if (orderError || !order) {
    console.error("Order update failed:", orderError);
    throw new Error("Order not found or update failed");
  }

  // 2. Validate and activate tickets (change from 'void' to 'valid')
  const { data: tickets, error: ticketsError } = await supabase
    .from("tickets")
    .update({ status: "valid" })
    .eq("order_id", orderId)
    .eq("status", "void")
    .select(`
      id,
      qr_hash,
      ticket_tiers (
        name,
        events (
          title,
          start_time,
          location_name
        )
      )
    `);

  if (ticketsError) {
    console.error("Tickets activation failed:", ticketsError);
  }

  // 3. Process Merch stock reduction (if any)
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
          
        if (variant) {
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

  // 4. Send Confirmation Email
  if (process.env.RESEND_API_KEY) {
    let ticketDetails = "";
    if (tickets && tickets.length > 0) {
      ticketDetails = tickets.map((t: any) => {
        const event = Array.isArray(t.ticket_tiers?.events) ? t.ticket_tiers.events[0] : t.ticket_tiers?.events;
        return `- ${t.ticket_tiers?.name} para ${event?.title || 'Evento'}`;
      }).join("<br>");
    }

    let merchDetails = "";
    if (items && items.length > 0) {
      merchDetails = items.map((item: any) => `- ${item.quantity}x Merch Item`).join("<br>"); // Simplified
    }

    await resend.emails.send({
      from: "Bassfactory Ventas <ventas@bassfactory.co>",
      to: order.customer_email,
      subject: `Confirmación de Compra - Orden #${order.id.slice(0, 8)}`,
      html: getPurchaseConfirmationEmail({
        customerName: order.customer_name,
        orderId: order.id,
        amount: order.total_amount,
        itemsList: `${ticketDetails}<br>${merchDetails}`
      })
    });
  }

  return true;
}
