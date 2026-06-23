"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function processMerchCheckout(formData: FormData) {
  const supabase = await createClient();

  const customer_name = formData.get("customer_name") as string;
  const customer_email = formData.get("customer_email") as string;
  const customer_phone = formData.get("customer_phone") as string;
  const shipping_address = formData.get("shipping_address") as string;
  const shipping_city = formData.get("shipping_city") as string;
  const shipping_country = formData.get("shipping_country") as string;
  const shipping_zip = formData.get("shipping_zip") as string;
  const itemsJson = formData.get("items") as string;
  
  if (!itemsJson) throw new Error("El carrito está vacío");
  const items = JSON.parse(itemsJson);

  let subtotal_amount = 0;
  for (const item of items) {
    subtotal_amount += item.unit_price * item.quantity;
  }
  
  // Costo de envío fijo por ahora para simular
  const shipping_cost = 15000;
  const total_amount = subtotal_amount + shipping_cost;

  // Insertar la orden (simulando que se pagó para efectos de prueba, status 'paid' o 'pending' según gateway final)
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

  // Insertar los items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    variant_id: item.variant_id,
    product_name: item.product_name,
    variant_name: item.variant_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity
  }));

  const { error: itemsError } = await supabase.from("merch_order_items").insert(orderItems);

  if (itemsError) {
    console.error("Order items error", itemsError);
    throw new Error(itemsError.message);
  }

  // Restar stock de las variantes
  for (const item of items) {
    if (item.variant_id) {
      // Fetch current stock
      const { data: variant } = await supabase.from("merch_product_variants").select("stock_quantity").eq("id", item.variant_id).single();
      if (variant) {
        await supabase.from("merch_product_variants").update({
          stock_quantity: Math.max(0, variant.stock_quantity - item.quantity)
        }).eq("id", item.variant_id);
      }
    }
  }

  // Redirigir al success
  redirect(`/checkout/success?order_id=${order.id}`);
}
