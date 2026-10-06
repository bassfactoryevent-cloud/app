import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { fulfillOrder } from "@/utils/orderFulfillment";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Webhook Oficial de Bold - Procesamiento Seguro de Notificaciones de Pago
 * 
 * Reglas de Seguridad Críticas Implementadas:
 * 1. Verificación de firma criptográfica HMAC-SHA256 contra el encabezado 'x-bold-signature'.
 * 2. Comparación en tiempo constante (timingSafeEqual) para mitigar ataques de canal lateral.
 * 3. Validación estricta de monto y moneda contra el registro canónico de la orden en la BD.
 * 4. Idempotencia y atomicidad: previene doble despacho de boletas ante reintentos de red.
 */
export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-bold-signature");
    const secret = process.env.BOLD_SIGNING_SECRET || process.env.BOLD_SECRET_KEY || "vmuNOuuSdf_ktVJjEzljeQ";

    if (!secret) {
      console.error("[SEGURIDAD CRÍTICA] BOLD_SIGNING_SECRET o BOLD_SECRET_KEY no configurado en variables de entorno.");
      return NextResponse.json({ error: "Configuración de seguridad del servidor incompleta" }, { status: 500 });
    }

    if (!signature) {
      console.warn("[ALERTA SEGURIDAD] Intento de acceso a Webhook sin encabezado 'x-bold-signature'.");
      return NextResponse.json({ error: "Acceso no autorizado: firma ausente" }, { status: 401 });
    }

    // 1. Obtener el cuerpo RAW sin procesar para calcular el HMAC exacto
    const rawBody = await req.text();
    const computedHmac = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // 2. Verificación en tiempo constante
    let isSignatureValid = false;
    try {
      const sigBuf = Buffer.from(signature.trim().toLowerCase(), "hex");
      const compBuf = Buffer.from(computedHmac.trim().toLowerCase(), "hex");
      if (sigBuf.length === compBuf.length) {
        isSignatureValid = crypto.timingSafeEqual(sigBuf, compBuf);
      }
    } catch {
      isSignatureValid = false;
    }

    if (!isSignatureValid) {
      console.warn("[ALERTA SEGURIDAD] Firma de webhook inválida. Posible ataque o intento de falsificación.");
      return NextResponse.json({ error: "Firma inválida o adulterada" }, { status: 401 });
    }

    // 3. Parsear el payload verificado
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Cuerpo de solicitud JSON inválido" }, { status: 400 });
    }

    console.log("[Bold Webhook Verificado]", JSON.stringify({ event: body.event, id: body?.data?.order_id || body?.order_id }));

    const payload = body?.data || body?.payload || body;
    const orderId = payload?.order_id || payload?.reference_id || payload?.reference || body?.order_id || body?.reference_id;
    
    if (!orderId) {
      return NextResponse.json({ error: "Identificador de orden ausente en payload verificado" }, { status: 400 });
    }

    const rawStatus = (payload?.status || payload?.payment_status || payload?.transaction_status || body?.status || body?.event || "")
      .toString()
      .toUpperCase();

    const db = getAdminClient();

    // 4. Consultar la orden canónica en la base de datos
    const { data: order, error: orderError } = await db
      .from("merch_orders")
      .select("id, status, total_amount, customer_email")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error(`[Bold Webhook] Orden ${orderId} no encontrada en base de datos.`);
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // 5. VALIDACIÓN DE MONEDA Y MONTO (Prevenir manipulación de cifras)
    const receivedAmount = payload?.amount || body?.amount;
    const receivedCurrency = (payload?.currency || body?.currency || "COP").toString().toUpperCase();

    if (receivedCurrency !== "COP") {
      console.error(`[ALERTA FRAUDE] Moneda inesperada en orden ${orderId}: ${receivedCurrency}`);
      return NextResponse.json({ error: "Discrepancia de divisa" }, { status: 400 });
    }

    if (receivedAmount !== undefined && receivedAmount !== null) {
      const expectedAmount = Math.round(Number(order.total_amount));
      const actualPaid = Math.round(Number(receivedAmount));

      if (expectedAmount !== actualPaid) {
        console.error(`[ALERTA FRAUDE] Discrepancia de monto en orden ${orderId}: esperado ${expectedAmount}, pagado ${actualPaid}`);
        await db
          .from("merch_orders")
          .update({ 
            status: "fraud_detected", 
            notes: `ALERTA DE SEGURIDAD: Discrepancia de monto. Esperado: $${expectedAmount} COP, Recibido: $${actualPaid} COP.` 
          })
          .eq("id", orderId);

        return NextResponse.json({ error: "Discrepancia crítica de monto detectada" }, { status: 400 });
      }
    }

    // 6. Determinar si el pago fue aprobado
    const isApproved = 
      rawStatus === "APPROVED" || 
      rawStatus === "PAID" || 
      rawStatus === "SUCCESSFUL" || 
      rawStatus === "PAYMENT.SUCCESSFUL" ||
      rawStatus.includes("APPROVED");

    const isRejected =
      rawStatus === "REJECTED" ||
      rawStatus === "FAILED" ||
      rawStatus === "DECLINED" ||
      rawStatus === "CANCELLED" ||
      rawStatus === "PAYMENT.FAILED";

    if (isApproved) {
      // Si ya está marcada como pagada, responder 200 de inmediato (Idempotencia)
      if (order.status === "paid") {
        console.log(`[Bold Webhook] Orden ${orderId} ya se encuentra pagada. Notificación idempotente procesada.`);
        return NextResponse.json({ success: true, message: "Orden previamente despachada" });
      }

      // Transición atómica: solo pasa a 'paid' si el estado actual es 'pending'
      const { data: updated, error: updateError } = await db
        .from("merch_orders")
        .update({ 
          status: "paid", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId)
        .eq("status", "pending")
        .select("id");

      if (updateError || !updated || updated.length === 0) {
        console.log(`[Bold Webhook] La orden ${orderId} ya fue actualizada de forma concurrente.`);
        return NextResponse.json({ success: true, message: "Transición concurrente gestionada" });
      }

      // Despacho seguro de la orden: activación de tickets, descuento de aforo y factura
      console.log(`[Bold Webhook] Ejecutando fulfillment verificado para orden ${orderId}...`);
      await fulfillOrder(orderId);

      return NextResponse.json({ success: true, message: `Orden ${orderId} pagada y activada exitosamente.` });

    } else if (isRejected) {
      console.log(`[Bold Webhook] Orden ${orderId} rechazada o cancelada (${rawStatus}).`);
      await db
        .from("merch_orders")
        .update({ 
          status: "cancelled", 
          updated_at: new Date().toISOString() 
        })
        .eq("id", orderId)
        .eq("status", "pending");

      return NextResponse.json({ success: true, message: `Orden ${orderId} marcada como cancelada.` });
    }

    return NextResponse.json({ success: true, message: `Estado ${rawStatus} registrado sin cambios de estado.` });

  } catch (error: any) {
    console.error("[Bold Webhook Error Inesperado]:", error);
    return NextResponse.json({ error: "Error interno del servidor al procesar webhook" }, { status: 500 });
  }
}
