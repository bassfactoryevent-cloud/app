"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import crypto from "crypto";

export async function processCheckout(formData: FormData) {
  try {
    const db = getAdminClient();

    // 1. Validar y sanitizar datos del cliente
    const customer_name = (formData.get("customer_name") as string || "").trim();
    const customer_email = (formData.get("customer_email") as string || "").trim().toLowerCase();
    const customer_phone = (formData.get("customer_phone") as string || "").trim();
    const rawUserId = formData.get("user_id") as string;
    const user_id = (rawUserId && rawUserId.trim().length > 10) ? rawUserId.trim() : null;

    if (!customer_name || customer_name.length < 2) {
      return { success: false, error: "Por favor ingresa un nombre válido para la compra." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customer_email || !emailRegex.test(customer_email)) {
      return { success: false, error: "Por favor ingresa un correo electrónico válido." };
    }

    const hasMerchStr = formData.get("hasMerch") as string;
    const hasMerch = hasMerchStr === 'true';

    let shipping_address = "Digital / Boleta Electrónica";
    let shipping_city = "Bogotá";
    let shipping_country = "Colombia";
    let shipping_zip = "110111";
    const shipping_cost = hasMerch ? 15000 : 0;

    if (hasMerch) {
      shipping_address = ((formData.get("shipping_address") as string) || "").trim() || shipping_address;
      shipping_city = ((formData.get("shipping_city") as string) || "").trim() || shipping_city;
      shipping_country = ((formData.get("shipping_country") as string) || "").trim() || shipping_country;
      shipping_zip = ((formData.get("shipping_zip") as string) || "").trim() || shipping_zip;

      if (!shipping_address || shipping_address.length < 5) {
        return { success: false, error: "Por favor ingresa una dirección de entrega completa para tu mercancía." };
      }
    }

    // 2. Validar estructura de items
    const itemsJson = formData.get("items") as string;
    if (!itemsJson) {
      return { success: false, error: "El carrito está vacío." };
    }

    let rawItems: any[];
    try {
      rawItems = JSON.parse(itemsJson);
    } catch {
      return { success: false, error: "Datos del carrito inválidos." };
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return { success: false, error: "El carrito no contiene productos." };
    }

    if (rawItems.length > 25) {
      return { success: false, error: "Excedido el límite máximo de artículos por compra (máx. 25)." };
    }

    // 3. SEGURIDAD ESTRICTA: RECALCULAR TODOS LOS PRECIOS Y STOCK DIRECTAMENTE EN BASE DE DATOS
    // NUNCA confiar en unit_price o precios enviados desde el navegador
    let verifiedSubtotal = 0;
    const verifiedOrderItems: any[] = [];
    const verifiedTickets: any[] = [];

    for (const item of rawItems) {
      const quantity = Math.floor(Number(item.quantity || 1));
      if (isNaN(quantity) || quantity < 1 || quantity > 10) {
        return { success: false, error: "Cantidad no permitida (mínimo 1, máximo 10 por artículo)." };
      }

      if (item.itemType === 'ticket') {
        const tierId = item.ticket_tier_id || item.id;
        if (!tierId) {
          return { success: false, error: "Identificador de localidad no válido." };
        }

        const { data: tier, error: tierError } = await db
          .from("ticket_tiers")
          .select(`
            id,
            name,
            price,
            quantity_available,
            event_id,
            events (
              id,
              title,
              status
            )
          `)
          .eq("id", tierId)
          .single();

        if (tierError || !tier) {
          return { success: false, error: "Localidad de boletería no encontrada o no disponible." };
        }

        const event = Array.isArray(tier.events) ? tier.events[0] : tier.events;
        if (!event || event.status !== 'published') {
          return { 
            success: false, 
            error: `La venta de entradas para "${event?.title || 'este evento'}" está cerrada o pausada.` 
          };
        }

        if (typeof tier.quantity_available === 'number' && tier.quantity_available < quantity) {
          return { 
            success: false, 
            error: `Aforo agotado para la localidad "${tier.name}". Disponibles: ${tier.quantity_available}.` 
          };
        }

        const canonicalPrice = Math.round(Number(tier.price || 0));
        verifiedSubtotal += canonicalPrice * quantity;

        verifiedTickets.push({
          tierId: tier.id,
          quantity,
          unitPrice: canonicalPrice
        });

      } else if (item.itemType === 'merch') {
        const variantId = item.variant_id;
        const productId = item.product_id || item.id;

        let canonicalPrice = 0;
        let productName = item.product_name || "Producto Oficial";
        let variantName = item.variant_name || null;

        if (variantId) {
          const { data: variant, error: varError } = await db
            .from("merch_product_variants")
            .select(`
              id,
              title,
              price,
              stock_quantity,
              product_id,
              merch_products (
                id,
                title,
                status,
                base_price
              )
            `)
            .eq("id", variantId)
            .single();

          if (varError || !variant) {
            return { success: false, error: "Variante de producto no encontrada o descontinuada." };
          }

          const prod = Array.isArray(variant.merch_products) ? variant.merch_products[0] : variant.merch_products;
          if (!prod || prod.status !== 'published') {
            return { success: false, error: `El producto "${prod?.title || 'seleccionado'}" no está disponible.` };
          }

          if (typeof variant.stock_quantity === 'number' && variant.stock_quantity < quantity) {
            return { 
              success: false, 
              error: `Stock insuficiente para "${prod.title} (${variant.title})". Disponibles: ${variant.stock_quantity}.` 
            };
          }

          canonicalPrice = Math.round(Number(variant.price ?? prod.base_price ?? 0));
          productName = prod.title;
          variantName = variant.title;

          verifiedOrderItems.push({
            product_id: prod.id,
            variant_id: variant.id,
            product_name: productName,
            variant_name: variantName,
            quantity,
            unit_price: canonicalPrice,
            total_price: canonicalPrice * quantity
          });

        } else if (productId) {
          const { data: product, error: prodError } = await db
            .from("merch_products")
            .select("id, title, status, base_price")
            .eq("id", productId)
            .single();

          if (prodError || !product || product.status !== 'published') {
            return { success: false, error: "Producto no disponible para compra." };
          }

          canonicalPrice = Math.round(Number(product.base_price || 0));
          productName = product.title;

          verifiedOrderItems.push({
            product_id: product.id,
            variant_id: null,
            product_name: productName,
            variant_name: null,
            quantity,
            unit_price: canonicalPrice,
            total_price: canonicalPrice * quantity
          });
        }

        verifiedSubtotal += canonicalPrice * quantity;
      }
    }

    const verifiedTotal = verifiedSubtotal + shipping_cost;
    if (verifiedTotal <= 0) {
      return { success: false, error: "El monto total de la orden debe ser superior a $0 COP." };
    }

    // 4. Crear la orden con estado 'pending'
    const { data: order, error: orderError } = await db
      .from("merch_orders")
      .insert([{
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        shipping_address,
        shipping_city,
        shipping_country,
        shipping_zip,
        subtotal_amount: verifiedSubtotal,
        shipping_cost,
        total_amount: verifiedTotal,
        status: "pending",
        payment_provider: "bold",
        user_id
      }])
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insertion error:", orderError);
      return { success: false, error: "No se pudo generar la orden. Inténtalo de nuevo." };
    }

    // 5. Insertar items de merch verificados
    if (verifiedOrderItems.length > 0) {
      const itemsToInsert = verifiedOrderItems.map(item => ({
        ...item,
        order_id: order.id
      }));

      const { error: itemsError } = await db.from("merch_order_items").insert(itemsToInsert);
      if (itemsError) {
        console.error("Merch items insert error:", itemsError);
        return { success: false, error: "Error registrando los detalles de mercancía." };
      }
    }

    // 6. Insertar boletas en estado 'void' (se activarán a 'valid' ÚNICAMENTE mediante el webhook firmado de Bold)
    if (verifiedTickets.length > 0) {
      const ticketsToInsert: any[] = [];
      for (const t of verifiedTickets) {
        for (let i = 0; i < t.quantity; i++) {
          const rawString = `${order.id}-${t.tierId}-${i}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
          const qrHash = crypto.createHash('sha256').update(rawString).digest('hex');

          ticketsToInsert.push({
            order_id: order.id,
            tier_id: t.tierId,
            qr_hash: qrHash,
            status: 'void',
            user_id
          });
        }
      }

      const { error: ticketsError } = await db.from("tickets").insert(ticketsToInsert);
      if (ticketsError) {
        console.error("Tickets insert error:", ticketsError);
        return { success: false, error: "Error registrando las entradas del evento." };
      }
    }

    // 7. Generar el Hash de Integridad Criptográfico de Bold (SHA-256)
    // Fórmula oficial Bold: SHA256(order_id + amount + currency + secret_key)
    const secretKey = process.env.BOLD_SECRET_KEY || "vmuNOuuSdf_ktVJjEzljeQ";
    if (!secretKey) {
      console.error("ERROR CRÍTICO: BOLD_SECRET_KEY no está configurada en las variables de entorno.");
      return { success: false, error: "La pasarela de pagos no está configurada correctamente en el servidor." };
    }

    const currency = "COP";
    const hashString = `${order.id}${verifiedTotal}${currency}${secretKey}`;
    const integrityHash = crypto.createHash('sha256').update(hashString).digest('hex');

    const boldApiKey = process.env.NEXT_PUBLIC_BOLD_API_KEY || process.env.BOLD_API_KEY || "nwvAHzfbKKkqP6Sw4wCi86jB5tqAf9WPwJi-zBFQftA";

    return { 
      success: true, 
      orderId: order.id, 
      amount: verifiedTotal, 
      hash: integrityHash,
      boldApiKey
    };

  } catch (err: any) {
    console.error("processCheckout unexpected error:", err);
    return { success: false, error: "Ocurrió un error inesperado al procesar la orden." };
  }
}
