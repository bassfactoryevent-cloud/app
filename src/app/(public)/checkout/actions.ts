"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";
import { getPurchaseConfirmationEmail } from "@/utils/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function processCheckout(formData: FormData) {
  const supabase = await createClient();

  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const customer_phone = formData.get("customer_phone") as string;
  const user_id = formData.get("user_id") as string;
  
  const hasMerchStr = formData.get("hasMerch") as string;
  const hasMerch = hasMerchStr === 'true';

  let shipping_address = null;
  let shipping_city = null;
  let shipping_country = null;
  let shipping_zip = null;
  const shipping_cost = hasMerch ? 15000 : 0;

  if (hasMerch) {
    shipping_address = formData.get("shipping_address") as string;
    shipping_city = formData.get("shipping_city") as string;
    shipping_country = formData.get("shipping_country") as string;
    shipping_zip = formData.get("shipping_zip") as string;
  }

  const itemsJson = formData.get("items") as string;
  if (!itemsJson) throw new Error("El carrito está vacío");
  const items = JSON.parse(itemsJson);

  let subtotal_amount = 0;
  for (const item of items) {
    subtotal_amount += item.unit_price * item.quantity;
  }
  
  const total_amount = subtotal_amount + shipping_cost;

  // Insertar la orden global (Usamos merch_orders como tabla general de órdenes)
  const { data: order, error: orderError } = await supabase.from("merch_orders").insert([{
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
    status: "pending", // Cambiado a 'pending' para la pasarela de pagos
    payment_provider: "bold",
    user_id
  }]).select("id").single();

  if (orderError) {
    console.error("Order error", orderError);
    throw new Error(orderError.message);
  }

  const merchItems = items.filter((item: any) => item.itemType === 'merch');
  const ticketItems = items.filter((item: any) => item.itemType === 'ticket');

  // Verify event statuses for tickets
  if (ticketItems.length > 0) {
    const tierIds = ticketItems.map((item: any) => item.ticket_tier_id);
    const { data: tiers } = await supabase
      .from("ticket_tiers")
      .select("event_id, events(status)")
      .in("id", tierIds);

    if (tiers) {
      for (const tier of tiers) {
        const t = tier as any;
        const eventStatus = Array.isArray(t.events) ? t.events[0]?.status : t.events?.status;
        if (eventStatus !== 'published') {
          throw new Error("No se pueden comprar boletas para este evento en este momento. Las ventas están pausadas o el evento ha sido cancelado.");
        }
      }
    }
  }

  // Procesar Merch (Solo insertar los items, sin reducir stock todavía)
  if (merchItems.length > 0) {
    const orderItemsToInsert = merchItems.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity
    }));

    const { error: itemsError } = await supabase.from("merch_order_items").insert(orderItemsToInsert);
    if (itemsError) throw new Error(itemsError.message);
  }

  // Procesar Tickets (Crear boletas como 'void' temporalmente hasta el pago)
  if (ticketItems.length > 0) {
    const ticketsToInsert: any[] = [];
    
    for (const item of ticketItems) {
      for (let i = 0; i < item.quantity; i++) {
        // Generar un hash único para el código QR de cada boleta
        const rawString = `${order.id}-${item.ticket_tier_id}-${i}-${Date.now()}`;
        const qrHash = crypto.createHash('sha256').update(rawString).digest('hex');

        ticketsToInsert.push({
          order_id: order.id,
          tier_id: item.ticket_tier_id,
          qr_hash: qrHash,
          status: 'void', // Serán activadas por el webhook
          user_id
        });
      }
    }

    const { error: ticketsError } = await supabase.from("tickets").insert(ticketsToInsert);
    if (ticketsError) throw new Error(ticketsError.message);
  }

  // Generar el Integrity Hash de Bold
  const secretKey = process.env.BOLD_SECRET_KEY || "w3ZCw7yuoQc0Ztc4EDaDPg";
  const currency = "COP";
  // Bold format: order_id + amount + currency + secret_key
  const hashString = `${order.id}${total_amount}${currency}${secretKey}`;
  const integrityHash = crypto.createHash('sha256').update(hashString).digest('hex');

  return { 
    success: true, 
    orderId: order.id, 
    amount: total_amount, 
    hash: integrityHash 
  };
}
