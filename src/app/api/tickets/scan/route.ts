import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Validar autenticación de usuario
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión como personal de taquilla." }, { status: 401 });
    }

    const adminDb = getAdminClient();

    // 2. Control de acceso: Verificar rol administrativo / staff
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["admin", "superadmin", "promoter", "scanner"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Acceso denegado: Se requieren permisos de control de acceso / taquilla." }, { status: 403 });
    }

    const { qr_hash, event_id } = await req.json();

    if (!qr_hash || !event_id) {
      return NextResponse.json({ error: "Datos de escaneo incompletos (qr_hash y event_id requeridos)." }, { status: 400 });
    }

    // 2.1 Verificación de asignación al evento (Previene que ex-trabajadores sigan escaneando)
    const { isUserAllowedToScanEvent } = await import("@/utils/staffAssignments");
    const isAllowed = await isUserAllowedToScanEvent(user.id, profile.role, event_id);
    if (!isAllowed) {
      return NextResponse.json({ 
        error: "Acceso Denegado / Revocado: No tienes asignación activa para leer entradas en este evento." 
      }, { status: 403 });
    }

    // 3. Buscar la boleta por su hash QR único (o por ID como fallback)
    let cleanHash = (qr_hash || "").trim();
    if ((cleanHash.startsWith('"') && cleanHash.endsWith('"')) || (cleanHash.startsWith("'") && cleanHash.endsWith("'"))) {
      cleanHash = cleanHash.slice(1, -1).trim();
    }
    if (cleanHash.includes("?") || cleanHash.includes("/")) {
      try {
        const urlStr = cleanHash.startsWith("http") ? cleanHash : `https://${cleanHash}`;
        const parsed = new URL(urlStr);
        const queryHash = parsed.searchParams.get("qr") || parsed.searchParams.get("hash") || parsed.searchParams.get("code");
        if (queryHash) {
          cleanHash = queryHash.trim();
        } else {
          const segments = parsed.pathname.split("/").filter(Boolean);
          const lastSeg = segments[segments.length - 1];
          if (lastSeg && lastSeg.length >= 16) {
            cleanHash = lastSeg.trim();
          }
        }
      } catch {}
    }

    let { data: ticket, error: ticketError } = await adminDb
      .from("tickets")
      .select("id, status, tier_id, order_id, assigned_name, scanned_at, created_at")
      .eq("qr_hash", cleanHash)
      .maybeSingle();

    if (!ticket) {
      const { data: ticketById } = await adminDb
        .from("tickets")
        .select("id, status, tier_id, order_id, assigned_name, scanned_at, created_at")
        .eq("id", cleanHash)
        .maybeSingle();

      if (ticketById) {
        ticket = ticketById;
      }
    }

    if (!ticket) {
      return NextResponse.json({ error: "Boleta no encontrada o código QR no reconocido." }, { status: 404 });
    }

    // 3.1 Obtener localidad y orden sin depender de foreign keys en el schema cache
    const [{ data: tier }, { data: order }] = await Promise.all([
      adminDb.from("ticket_tiers").select("id, event_id, name").eq("id", ticket.tier_id).maybeSingle(),
      ticket.order_id 
        ? adminDb.from("merch_orders").select("id, customer_name").eq("id", ticket.order_id).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    const tierEventId = tier?.event_id;
    const tierName = tier?.name || "Localidad Oficial";
    const orderCustomerName = order?.customer_name;
    const attendeeName = ticket.assigned_name || orderCustomerName || "Asistente";

    // 4. Validar que la boleta corresponda a este evento
    if (tierEventId && tierEventId !== event_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Esta entrada corresponde a otro evento diferente." 
      }, { status: 403 });
    }

    // 5. Validar estrictamente el estado de la boleta
    if (ticket.status === "scanned") {
      const scannedTime = ticket.scanned_at 
        ? new Date(ticket.scanned_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
        : "";
      return NextResponse.json({ 
        error: `¡ALERTA! Esta boleta YA fue utilizada previamente${scannedTime ? ` a las ${scannedTime}` : ""}.` 
      }, { status: 400 });
    }

    if (ticket.status === "void") {
      return NextResponse.json({ error: "Boleta INVÁLIDA: El pago de esta orden no fue completado." }, { status: 400 });
    }

    if (ticket.status === "cancelled") {
      return NextResponse.json({ error: "Boleta CANCELADA por la organización." }, { status: 400 });
    }

    if (ticket.status !== "valid") {
      return NextResponse.json({ error: `Boleta no apta para ingreso (Estado actual: ${ticket.status}).` }, { status: 400 });
    }

    // 6. Validación atómica de escaneo (previene doble entrada en accesos concurrentes)
    const { data: updated, error: updateError } = await adminDb
      .from("tickets")
      .update({ 
        status: "scanned", 
        scanned_at: new Date().toISOString(),
        scanned_by: user.id
      })
      .eq("id", ticket.id)
      .eq("status", "valid")
      .select("id");

    if (updateError || !updated || updated.length === 0) {
      return NextResponse.json({ error: "Esta boleta acaba de ser escaneada simultáneamente en otra puerta." }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return NextResponse.json({ 
      success: true, 
      message: "¡BIENVENIDO A BASSFACTORY!",
      status_label: "ACTIVO EN EL EVENTO",
      attendee_name: attendeeName,
      tier_name: tierName,
      scanned_at: nowIso,
      scanned_time: formattedTime,
      ticket_id: ticket.id,
      event_id: tierEventId,
      scanned_by: user.id,
      scanner_name: profile?.full_name || user.email || "Personal de Puerta"
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno al procesar escaneo." }, { status: 500 });
  }
}
