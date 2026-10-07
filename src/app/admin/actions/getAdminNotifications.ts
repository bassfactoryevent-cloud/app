"use server";

import { getAdminClient } from "@/utils/supabase/admin";

export interface AdminNotificationItem {
  id: string;
  category: "sale" | "event" | "user" | "transfer" | "shipping";
  title: string;
  description: string;
  timestamp: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

const adminDb = getAdminClient();

export async function getAdminLiveNotifications(): Promise<AdminNotificationItem[]> {
  try {
    const [
      { data: orders },
      { data: events },
      { data: users },
      { data: transfers }
    ] = await Promise.all([
      // 1. Órdenes / Ventas recientes pagadas
      adminDb
        .from("merch_orders")
        .select(`
          id, customer_name, customer_email, total_amount, status, created_at, tracking_number, shipping_city,
          merch_order_items ( id, product_name, quantity )
        `)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(10),

      // 2. Eventos recientes creados
      adminDb
        .from("events")
        .select("id, title, start_date, created_at")
        .order("created_at", { ascending: false })
        .limit(6),

      // 3. Usuarios registrados recientemente
      adminDb
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false })
        .limit(8),

      // 4. Transferencias de boletas
      adminDb
        .from("ticket_transfers")
        .select("id, to_email, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5)
    ]);

    const notifications: AdminNotificationItem[] = [];

    // Mapeo de Ventas
    if (orders && orders.length > 0) {
      for (const order of orders) {
        const hasMerch = order.merch_order_items && order.merch_order_items.length > 0;
        const formattedAmount = Number(order.total_amount || 0).toLocaleString("es-CO");
        const client = order.customer_name || order.customer_email || "Cliente";

        // Venta confirmada
        notifications.push({
          id: `order-${order.id}`,
          category: "sale",
          title: `💰 Venta Confirmada: $${formattedAmount} COP`,
          description: `${client} completó el pago de ${hasMerch ? 'productos de merch' : 'entradas'}.`,
          timestamp: order.created_at,
          href: "/admin/finances",
          badge: hasMerch ? "Merch" : "Boletas",
          badgeColor: hasMerch ? "#10b981" : "#ec4899"
        });

        // Alerta de despacho si es merch y no tiene número de guía
        if (hasMerch && !order.tracking_number) {
          notifications.push({
            id: `ship-${order.id}`,
            category: "shipping",
            title: `📦 Despacho Pendiente: ${order.shipping_city || 'Nacional'}`,
            description: `Pedido de ${client} por $${formattedAmount} COP requiere guía de transporte.`,
            timestamp: order.created_at,
            href: "/admin/merch/orders",
            badge: "Por Enviar",
            badgeColor: "#f59e0b"
          });
        }
      }
    }

    // Mapeo de Eventos Creados
    if (events && events.length > 0) {
      for (const ev of events) {
        notifications.push({
          id: `event-${ev.id}`,
          category: "event",
          title: `🎪 Evento en Sistema: ${ev.title}`,
          description: `Configurado en la plataforma para taquilla y cartelera oficial.`,
          timestamp: ev.created_at,
          href: `/admin/events`,
          badge: "Evento",
          badgeColor: "#8b5cf6"
        });
      }
    }

    // Mapeo de Usuarios Registrados
    if (users && users.length > 0) {
      for (const u of users) {
        const roleLabel = u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Admin" : u.role === "scanner" ? "Puerta" : "Cliente";
        notifications.push({
          id: `user-${u.id}`,
          category: "user",
          title: `👤 Nuevo Usuario: ${u.full_name || u.email || 'Usuario'}`,
          description: `Registrado con rol ${roleLabel} (${u.email || 'Sin correo'}).`,
          timestamp: u.created_at,
          href: "/admin/users",
          badge: roleLabel,
          badgeColor: u.role === "superadmin" ? "#eab308" : u.role === "admin" ? "#ec4899" : u.role === "scanner" ? "#06b6d4" : "#6b7280"
        });
      }
    }

    // Mapeo de Transferencias
    if (transfers && transfers.length > 0) {
      for (const tr of transfers) {
        notifications.push({
          id: `transfer-${tr.id}`,
          category: "transfer",
          title: `🔄 Transferencia de Entrada`,
          description: `Destinatario: ${tr.to_email} (Estado: ${tr.status}).`,
          timestamp: tr.created_at,
          href: "/admin/events",
          badge: tr.status,
          badgeColor: tr.status === "completed" ? "#10b981" : "#3b82f6"
        });
      }
    }

    // Ordenar de más reciente a más antiguo
    return notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error fetching admin live notifications:", error);
    return [];
  }
}
