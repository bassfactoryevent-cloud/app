import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export interface AppNotification {
  id: string;
  category: "order" | "shipping" | "ticket" | "admin" | "system";
  title: string;
  message: string;
  createdAt: string;
  actionText: string;
  actionHref: string;
  isRead?: boolean;
  isAdminOnly?: boolean;
  meta?: {
    orderId?: string;
    invoiceNumber?: string;
    trackingNumber?: string;
    amount?: number;
  };
}

export async function getUserNotifications(user: { id: string; email?: string | null; role?: string }): Promise<AppNotification[]> {
  const notifications: AppNotification[] = [];

  try {
    // 1. Fetch user orders
    const { data: userOrders } = await adminDb
      .from("merch_orders")
      .select(`
        *,
        merch_order_items (
          id,
          product_name,
          variant_name,
          quantity,
          unit_price,
          total_price
        )
      `)
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email || 'non-existent-email'}`)
      .order("created_at", { ascending: false });

    // 2. Fetch user tickets with tier and event info
    const { data: userTickets } = await adminDb
      .from("tickets")
      .select(`
        id,
        created_at,
        status,
        order_id,
        tier_id,
        ticket_tiers (
          name,
          price,
          events (
            title,
            start_date,
            location_name
          )
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Group tickets by order/event for clean notifications
    const ticketOrderMap: Record<string, { count: number; eventTitle: string; tierName: string; createdAt: string }> = {};
    if (userTickets) {
      for (const t of userTickets) {
        const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
        const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
        const key = t.order_id || t.tier_id || t.id;
        
        if (!ticketOrderMap[key]) {
          ticketOrderMap[key] = {
            count: 0,
            eventTitle: event?.title || "Evento Bassfactory",
            tierName: tier?.name || "General",
            createdAt: t.created_at
          };
        }
        ticketOrderMap[key].count += 1;
      }
    }

    // Process user orders into notifications
    if (userOrders && userOrders.length > 0) {
      for (const order of userOrders) {
        const shortId = order.id.slice(0, 8).toUpperCase();
        const invoiceNum = order.payment_id && order.payment_id.startsWith("BF-FAC-") 
          ? order.payment_id 
          : `BF-FAC-${shortId.slice(0, 4)}`;
        const formattedAmount = Number(order.total_amount).toLocaleString("es-CO");
        const hasMerchItems = order.merch_order_items && order.merch_order_items.length > 0;

        // Notification: Order Payment / Invoice
        if (order.status === "paid") {
          notifications.push({
            id: `notif-order-${order.id}`,
            category: "order",
            title: `¡Pago Confirmado! • Factura ${invoiceNum}`,
            message: `Tu compra #${shortId} por $${formattedAmount} COP fue aprobada con éxito. Ya puedes ver o descargar tu factura electrónica oficial.`,
            createdAt: order.created_at,
            actionText: "Ver Factura Oficial",
            actionHref: `/orders/${order.id}/invoice`,
            meta: {
              orderId: order.id,
              invoiceNumber: invoiceNum,
              amount: order.total_amount
            }
          });

          // Notification: Merch Logistics (preparation / shipped)
          if (hasMerchItems) {
            const firstProduct = order.merch_order_items[0]?.product_name || "Mercancía";
            if (order.tracking_number) {
              notifications.push({
                id: `notif-ship-${order.id}`,
                category: "shipping",
                title: `🚚 Pedido Despachado • Guía ${order.tracking_number}`,
                message: `Tu pedido de ${firstProduct} va en camino a ${order.shipping_city}. Guía de seguimiento: ${order.tracking_number}.`,
                createdAt: order.updated_at || order.created_at,
                actionText: "Rastrear en Mis Pedidos",
                actionHref: "/account/orders",
                meta: {
                  orderId: order.id,
                  trackingNumber: order.tracking_number
                }
              });
            } else {
              notifications.push({
                id: `notif-prep-${order.id}`,
                category: "shipping",
                title: `📦 Pedido de Mercancía en Alistamiento`,
                message: `Estamos preparando ${firstProduct} para despacho a ${order.shipping_address}, ${order.shipping_city}. Te avisaremos en cuanto la transportadora recoja el paquete.`,
                createdAt: order.created_at,
                actionText: "Ver Mis Pedidos",
                actionHref: "/account/orders",
                meta: {
                  orderId: order.id
                }
              });
            }
          }
        } else if (order.status === "pending") {
          notifications.push({
            id: `notif-pending-${order.id}`,
            category: "order",
            title: `⏳ Pago en Verificación • Orden #${shortId}`,
            message: `Estamos esperando la confirmación bancaria de Bold para tu orden de $${formattedAmount} COP.`,
            createdAt: order.created_at,
            actionText: "Ver Estado",
            actionHref: "/account/orders",
          });
        }
      }
    }

    // Notification: Tickets confirmed & antifraud notice
    for (const [key, tGroup] of Object.entries(ticketOrderMap)) {
      notifications.push({
        id: `notif-ticket-${key}`,
        category: "ticket",
        title: `🎟️ Entradas Confirmadas • ${tGroup.eventTitle}`,
        message: `Tienes ${tGroup.count} entrada(s) (${tGroup.tierName}) aseguradas. Recuerda que por protocolos de seguridad antifraude, tu código QR oficial se generará y habilitará exactamente 1 día antes del evento.`,
        createdAt: tGroup.createdAt,
        actionText: "Ver Mis Boletas",
        actionHref: "/account/tickets",
      });
    }

    // 3. ADMIN NOTIFICATIONS (If user is Admin, provide actionable operational alerts)
    if (user.role === "admin") {
      // Recent Merch Orders to ship
      const { data: recentMerchOrders } = await adminDb
        .from("merch_orders")
        .select(`
          id,
          customer_name,
          customer_email,
          shipping_city,
          total_amount,
          tracking_number,
          status,
          created_at,
          merch_order_items (product_name, quantity)
        `)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentMerchOrders) {
        for (const mo of recentMerchOrders) {
          const hasItems = mo.merch_order_items && mo.merch_order_items.length > 0;
          if (hasItems && !mo.tracking_number) {
            notifications.push({
              id: `notif-admin-merch-${mo.id}`,
              category: "admin",
              isAdminOnly: true,
              title: `📦 [ADMIN] Pedido de Merch Pendiente de Despacho`,
              message: `${mo.customer_name} compró mercancía por $${Number(mo.total_amount).toLocaleString('es-CO')} COP para enviar a ${mo.shipping_city}. Asigna la guía de transporte para notificar al cliente.`,
              createdAt: mo.created_at,
              actionText: "Despachar en Pedidos Merch",
              actionHref: "/admin/merch/orders",
            });
          }
        }
      }

      // Recent Platform Sales
      const { data: allRecentOrders } = await adminDb
        .from("merch_orders")
        .select("id, customer_name, total_amount, created_at, payment_id")
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(3);

      if (allRecentOrders) {
        for (const ro of allRecentOrders) {
          notifications.push({
            id: `notif-admin-sale-${ro.id}`,
            category: "admin",
            isAdminOnly: true,
            title: `💰 [ADMIN] Venta Reciente Confirmada ($${Number(ro.total_amount).toLocaleString('es-CO')} COP)`,
            message: `Cliente: ${ro.customer_name} • Factura: ${ro.payment_id || ro.id.slice(0, 8).toUpperCase()}. Consulta los reportes consolidados y balance general.`,
            createdAt: ro.created_at,
            actionText: "Ver Finanzas Globales",
            actionHref: "/admin/finances",
          });
        }
      }

      // User Management Alert
      notifications.push({
        id: "notif-admin-users",
        category: "admin",
        isAdminOnly: true,
        title: "👥 [ADMIN] Gestión de Usuarios y Roles Activa",
        message: "Puedes revisar los usuarios registrados, filtrar por roles (DJs, Promotores, Clientes) y auditar sus compras.",
        createdAt: new Date().toISOString(),
        actionText: "Gestionar Usuarios",
        actionHref: "/admin/users",
      });
    }

    // System Welcome Notification
    notifications.push({
      id: "notif-system-welcome",
      category: "system",
      title: "✨ Bienvenido al Ecosistema Bassfactory",
      message: "Tu cuenta oficial está activa. Tienes acceso prioritario a preventas de eventos, lanzamientos de merch y gestión segura de boletería.",
      createdAt: "2026-06-20T00:00:00.000Z",
      actionText: "Explorar Cartelera de Eventos",
      actionHref: "/events",
    });

  } catch (err) {
    console.error("Error generating user notifications:", err);
  }

  // Sort strictly newest first
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
