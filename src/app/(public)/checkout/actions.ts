"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function processCheckout(formData: FormData) {
  try {
    const supabase = await createClient();

    const customer_name = formData.get("customer_name") as string;
    const customer_email = formData.get("customer_email") as string;
    const customer_phone = formData.get("customer_phone") as string;
    const rawUserId = formData.get("user_id") as string;
    const user_id = (rawUserId && rawUserId.trim().length > 10) ? rawUserId.trim() : null;
    
    const hasMerchStr = formData.get("hasMerch") as string;
    const hasMerch = hasMerchStr === 'true';

    let shipping_address = "Digital / Boleta Electrónica";
    let shipping_city = "Bogotá";
    let shipping_country = "Colombia";
    let shipping_zip = "110111";
    const shipping_cost = hasMerch ? 15000 : 0;

    if (hasMerch) {
      shipping_address = (formData.get("shipping_address") as string) || shipping_address;
      shipping_city = (formData.get("shipping_city") as string) || shipping_city;
      shipping_country = (formData.get("shipping_country") as string) || shipping_country;
      shipping_zip = (formData.get("shipping_zip") as string) || shipping_zip;
    }

    const itemsJson = formData.get("items") as string;
    if (!itemsJson) {
      return { success: false, error: "El carrito está vacío" };
    }
    const items = JSON.parse(itemsJson);

    let subtotal_amount = 0;
    for (const item of items) {
      subtotal_amount += Number(item.unit_price || 0) * Number(item.quantity || 1);
    }
    
    const total_amount = subtotal_amount + shipping_cost;

    const ticketItems = items.filter((item: any) => item.itemType === 'ticket');
    const merchItems = items.filter((item: any) => item.itemType === 'merch');

    // 1. Verificar estado de eventos para boletas
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
          if (eventStatus && eventStatus !== 'published') {
            return { 
              success: false, 
              error: "No se pueden comprar boletas para este evento en este momento. Las ventas están pausadas o el evento ha sido cancelado." 
            };
          }
        }
      }
    }

    // Usar cliente con Service Role si está disponible para evitar bloqueos por RLS en el checkout
    let db = supabase;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      db = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      ) as any;
    }

    // 2. Insertar la orden global
    const { data: order, error: orderError } = await db.from("merch_orders").insert([{
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      shipping_address,
      shipping_city,
      shipping_country,
      shipping_zip,
      subtotal_amount,
      shipping_cost,
      total_amount,
      status: "pending",
      payment_provider: "bold",
      user_id
    }]).select("id").single();

    if (orderError || !order) {
      console.error("Order insertion error:", orderError);
      return { 
        success: false, 
        error: `Error al crear la orden: ${orderError?.message || "Detalles no disponibles"}` 
      };
    }

    // 3. Procesar Merch Items (si aplica)
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

      const { error: itemsError } = await db.from("merch_order_items").insert(orderItemsToInsert);
      if (itemsError) {
        console.error("Merch items insert error:", itemsError);
        return { success: false, error: `Error registrando productos: ${itemsError.message}` };
      }
    }

    // 4. Procesar Tickets (Crear boletas como 'void' temporalmente hasta la confirmación de pago)
    if (ticketItems.length > 0) {
      const ticketsToInsert: any[] = [];
      
      for (const item of ticketItems) {
        for (let i = 0; i < item.quantity; i++) {
          const rawString = `${order.id}-${item.ticket_tier_id}-${i}-${Date.now()}`;
          const qrHash = crypto.createHash('sha256').update(rawString).digest('hex');

          ticketsToInsert.push({
            order_id: order.id,
            tier_id: item.ticket_tier_id,
            qr_hash: qrHash,
            status: 'void',
            user_id
          });
        }
      }

      const { error: ticketsError } = await db.from("tickets").insert(ticketsToInsert);
      if (ticketsError) {
        console.error("Tickets insert error:", ticketsError);
        return { success: false, error: `Error registrando boletas: ${ticketsError.message}` };
      }
    }

    // 5. Generar el Integrity Hash de Bold
    const secretKey = process.env.BOLD_SECRET_KEY || "w3ZCw7yuoQc0Ztc4EDaDPg";
    const currency = "COP";
    const hashString = `${order.id}${total_amount}${currency}${secretKey}`;
    const integrityHash = crypto.createHash('sha256').update(hashString).digest('hex');

    return { 
      success: true, 
      orderId: order.id, 
      amount: total_amount, 
      hash: integrityHash 
    };

  } catch (err: any) {
    console.error("processCheckout unexpected error:", err);
    return { success: false, error: err?.message || "Ocurrió un error inesperado al procesar la orden" };
  }
}
