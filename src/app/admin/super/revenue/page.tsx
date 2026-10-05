import { getAdminClient } from "@/utils/supabase/admin";
import { getPlatformSettings } from "../../settings/actions";
import { checkSuperAdmin } from "../actions";
import SuperRevenueClient from "./SuperRevenueClient";
import { Coins } from "lucide-react";

export const dynamic = "force-dynamic";

const adminDb = getAdminClient();

export default async function SuperRevenuePage() {
  await checkSuperAdmin();

  // 1. Cargar configuración de comisiones
  const settings = await getPlatformSettings();
  const devFeePerTicket = Number(settings.dev_fee_per_ticket) || 2000;
  const devFeeMerchPercent = Number(settings.dev_fee_merch_percent) || 5;
  const devFeeAdsPercent = Number(settings.dev_fee_ads_percent) || 5;

  // 2. Cargar tickets, localidades, eventos, órdenes y pautas
  const [
    { data: events },
    { data: tiers },
    { data: tickets },
    { data: merchOrders },
    { data: adCampaigns }
  ] = await Promise.all([
    adminDb.from("events").select("id, title"),
    adminDb.from("ticket_tiers").select("id, event_id, name, price"),
    adminDb.from("tickets").select("id, tier_id, order_id, status, created_at"),
    adminDb.from("merch_orders").select(`
      id, customer_name, customer_email, total_amount, status, created_at, shipping_address,
      merch_order_items (
        id, product_name, variant_name, quantity, unit_price, total_price
      )
    `).order("created_at", { ascending: false }),
    adminDb.from("ad_campaigns").select("id, name, client_name, start_date, end_date, is_active, created_at").order("created_at", { ascending: false })
  ]);

  const tierMap = new Map((tiers || []).map((t: any) => [t.id, t]));
  const eventMap = new Map((events || []).map((e: any) => [e.id, e]));

  // Conjunto de IDs de órdenes correspondientes a tickets
  const ticketOrderIds = new Set((tickets || []).map((t: any) => t.order_id).filter(Boolean));

  // 3. Cálculos de Boletería
  // Filtrar boletas válidas o escaneadas
  const validTickets = (tickets || []).filter((t: any) => t.status === "valid" || t.status === "scanned");
  const totalTicketsSold = validTickets.length;
  const devTicketRevenue = totalTicketsSold * devFeePerTicket;

  // Agrupar tickets por orden para visualización en el libro contable
  const ticketsByOrder = new Map<string, any[]>();
  validTickets.forEach((t: any) => {
    const orderKey = t.order_id || t.id;
    if (!ticketsByOrder.has(orderKey)) {
      ticketsByOrder.set(orderKey, []);
    }
    ticketsByOrder.get(orderKey)!.push(t);
  });

  // 4. Cálculos de Merch
  let totalMerchVolume = 0;
  const paidMerchOrders = (merchOrders || []).filter((order: any) => {
    const isTicketOrder = ticketOrderIds.has(order.id) || (order.shipping_address && order.shipping_address.toLowerCase().includes("digital"));
    const isPaid = order.status === "paid" || order.status === "shipped" || order.status === "delivered";
    if (!isTicketOrder && isPaid) {
      totalMerchVolume += Number(order.total_amount || 0);
      return true;
    }
    return false;
  });

  const devMerchRevenue = totalMerchVolume * (devFeeMerchPercent / 100);

  // 5. Cálculos de Pautas / Ads
  // Si en el futuro se guardan montos en ad_campaigns, se suman aquí
  const totalAdsVolume = 0;
  const devAdsRevenue = totalAdsVolume * (devFeeAdsPercent / 100);

  const totalDevRevenue = devTicketRevenue + devMerchRevenue + devAdsRevenue;

  // 6. Preparar Libro Maestro de Transacciones
  const transactions: any[] = [];

  // Transacciones de Boletas
  ticketsByOrder.forEach((orderTickets, orderId) => {
    const firstTicket = orderTickets[0];
    const tier = tierMap.get(firstTicket.tier_id);
    const event = tier ? eventMap.get(tier.event_id) : null;
    const ticketCount = orderTickets.length;
    const totalOrderValue = ticketCount * Number(tier?.price || 0);
    const devShare = ticketCount * devFeePerTicket;

    // Buscar datos de cliente si existe la orden en merch_orders
    const orderMeta = (merchOrders || []).find((o: any) => o.id === orderId);

    transactions.push({
      id: orderId,
      type: "ticket",
      date: firstTicket.created_at,
      concept: `Boletería: ${event?.title || "Evento Oficial"}`,
      details: `${ticketCount}x ${tier?.name || "Boleto"} (${devFeePerTicket.toLocaleString("es-CO")} COP c/u)`,
      customer: orderMeta?.customer_name || orderMeta?.customer_email || "Usuario App",
      grossAmount: totalOrderValue,
      devShare,
      status: "Liquidado",
    });
  });

  // Transacciones de Merch
  paidMerchOrders.forEach((order: any) => {
    const orderItems = order.merch_order_items || [];
    const itemsText = orderItems.map((i: any) => `${i.quantity}x ${i.product_name}`).join(", ") || "Productos Tienda";
    const grossAmount = Number(order.total_amount || 0);
    const devShare = grossAmount * (devFeeMerchPercent / 100);

    transactions.push({
      id: order.id,
      type: "merch",
      date: order.created_at,
      concept: "Tienda Oficial Merch",
      details: `${itemsText} (${devFeeMerchPercent}% comisión)`,
      customer: order.customer_name || order.customer_email || "Cliente Tienda",
      grossAmount,
      devShare,
      status: "Liquidado",
    });
  });

  // Transacciones de Campañas de Pautas (si existen)
  (adCampaigns || []).forEach((c: any) => {
    transactions.push({
      id: c.id,
      type: "ad",
      date: c.created_at,
      concept: `Pauta: ${c.name}`,
      details: `Cliente: ${c.client_name || "Directo"} (${devFeeAdsPercent}% comisión)`,
      customer: c.client_name || "Anunciante",
      grossAmount: 0,
      devShare: 0,
      status: c.is_active ? "Activa" : "Finalizada",
    });
  });

  // Ordenar transacciones por fecha descendente
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "2.25rem", fontWeight: 900, color: "white", fontFamily: "Outfit, sans-serif", margin: 0 }}>
          <Coins size={32} style={{ color: "#eab308" }} />
          Ganancias y Liquidaciones de Desarrollo
        </h1>
        <p style={{ opacity: 0.7, fontSize: "1rem", color: "var(--color-text-secondary)", marginTop: "0.35rem" }}>
          Panel exclusivo para el seguimiento de ingresos de desarrollo: $2.000 COP por boleta vendida, 5% en merch y 5% en pautas publicitarias.
        </p>
      </div>

      <SuperRevenueClient
        initialRates={{
          dev_fee_per_ticket: devFeePerTicket,
          dev_fee_merch_percent: devFeeMerchPercent,
          dev_fee_ads_percent: devFeeAdsPercent,
        }}
        metrics={{
          totalDevRevenue,
          devTicketRevenue,
          devMerchRevenue,
          devAdsRevenue,
          totalTicketsSold,
          totalMerchVolume,
          totalAdsVolume,
        }}
        transactions={transactions}
      />
    </div>
  );
}
