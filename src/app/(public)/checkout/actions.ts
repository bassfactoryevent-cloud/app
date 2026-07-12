"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function processCheckout(formData: FormData) {
  const supabase = await createClient();

  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const customer_phone = formData.get("customer_phone") as string;
  
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

  // Insertar la orden global (Usamos merch_orders como tabla general de órdenes por ahora)
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
    status: "paid", // Temporalmente 'paid' para simular éxito
    payment_provider: "simulated"
  }]).select("id").single();

  if (orderError) {
    console.error("Order error", orderError);
    throw new Error(orderError.message);
  }

  const merchItems = items.filter((item: any) => item.itemType === 'merch');
  const ticketItems = items.filter((item: any) => item.itemType === 'ticket');

  // Procesar Merch
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

    // Restar stock de merch
    for (const item of merchItems) {
      if (item.variant_id) {
        const { data: variant } = await supabase.from("merch_product_variants").select("stock_quantity").eq("id", item.variant_id).single();
        if (variant) {
          await supabase.from("merch_product_variants").update({
            stock_quantity: Math.max(0, variant.stock_quantity - item.quantity)
          }).eq("id", item.variant_id);
        }
      }
    }
  }

  // Procesar Tickets
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
          status: 'valid'
        });
      }
    }

    const { error: ticketsError } = await supabase.from("tickets").insert(ticketsToInsert);
    if (ticketsError) {
      console.error("Tickets error", ticketsError);
      throw new Error("Error generando las entradas: " + ticketsError.message);
    }

    // Restar stock de tickets
    for (const item of ticketItems) {
      if (item.ticket_tier_id) {
        const { data: tier } = await supabase.from("ticket_tiers").select("quantity_available").eq("id", item.ticket_tier_id).single();
        if (tier) {
          await supabase.from("ticket_tiers").update({
            quantity_available: Math.max(0, tier.quantity_available - item.quantity)
          }).eq("id", item.ticket_tier_id);
        }
      }
    }
  }

  // Redirigir al success
  redirect(`/checkout/success?order_id=${order.id}`);
}
