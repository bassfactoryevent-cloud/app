import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { fulfillOrder } from "@/utils/orderFulfillment";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId || orderId.length < 10) {
      return NextResponse.json({ error: "ID de orden inválido" }, { status: 400 });
    }

    const db = getAdminClient();
    const { data: order, error } = await db
      .from("merch_orders")
      .select("id, status, updated_at")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Si la orden aún está pendiente, consultar activamente a la API de Bold
    if (order.status === "pending") {
      try {
        const apiKey = process.env.NEXT_PUBLIC_BOLD_API_KEY || "nwvAHzfbKKkqP6Sw4wCi86jB5tqAf9WPwJi-zBFQftA";
        const boldRes = await fetch(`https://payments.api.bold.co/v2/payment-voucher/${orderId}`, {
          headers: {
            "Authorization": `x-api-key ${apiKey}`
          },
          cache: "no-store"
        });

        if (boldRes.ok) {
          const boldData = await boldRes.json();
          const paymentStatus = (boldData?.payment_status || "").toString().toUpperCase();

          if (paymentStatus === "APPROVED" || paymentStatus === "PAID" || paymentStatus === "SUCCESSFUL") {
            console.log(`[Bold Poller Status] Pago aprobado por Bold para orden ${orderId}. Despachando...`);
            await fulfillOrder(orderId);
            return NextResponse.json({
              orderId: order.id,
              status: "paid",
              updatedAt: new Date().toISOString()
            });
          } else if (paymentStatus === "REJECTED" || paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
            await db
              .from("merch_orders")
              .update({ status: "cancelled", updated_at: new Date().toISOString() })
              .eq("id", orderId);
            return NextResponse.json({
              orderId: order.id,
              status: "cancelled",
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (boldErr) {
        console.error("Error al consultar estado en Bold API:", boldErr);
      }
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      updatedAt: order.updated_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
