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
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["admin", "superadmin", "promoter"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Acceso denegado: Se requieren permisos de control de acceso / taquilla." }, { status: 403 });
    }

    const { qr_hash, event_id } = await req.json();

    if (!qr_hash || !event_id) {
      return NextResponse.json({ error: "Datos de escaneo incompletos (qr_hash y event_id requeridos)." }, { status: 400 });
    }

    // 3. Buscar la boleta por su hash QR único
    const { data: ticket, error: ticketError } = await adminDb
      .from("tickets")
      .select(`
        id, 
        status, 
        tier_id,
        assigned_name,
        ticket_tiers!inner(event_id, name),
        merch_orders!inner(customer_name)
      `)
      .eq("qr_hash", qr_hash)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Boleta no encontrada o código QR no reconocido." }, { status: 404 });
    }

    const t = ticket as any;
    const tierEventId = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0]?.event_id : t.ticket_tiers?.event_id;
    const tierName = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0]?.name : t.ticket_tiers?.name;
    const orderCustomerName = Array.isArray(t.merch_orders) ? t.merch_orders[0]?.customer_name : t.merch_orders?.customer_name;
    
    const attendeeName = t.assigned_name || orderCustomerName || 'Asistente';

    // 4. Validar que la boleta corresponda a este evento
    if (tierEventId !== event_id) {
      return NextResponse.json({ 
        success: false, 
        error: "Esta entrada corresponde a otro evento diferente." 
      }, { status: 403 });
    }

    // 5. Validar estrictamente el estado de la boleta
    if (ticket.status === 'scanned') {
      return NextResponse.json({ error: "¡ALERTA! Esta boleta YA fue utilizada previamente." }, { status: 400 });
    }

    if (ticket.status === 'void') {
      return NextResponse.json({ error: "Boleta INVÁLIDA: El pago de esta orden no fue completado." }, { status: 400 });
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ error: "Boleta CANCELADA por la organización." }, { status: 400 });
    }

    if (ticket.status !== 'valid') {
      return NextResponse.json({ error: `Boleta no apta para ingreso (Estado actual: ${ticket.status}).` }, { status: 400 });
    }

    // 6. Validación atómica de escaneo (previene doble entrada en accesos concurrentes)
    const { data: updated, error: updateError } = await adminDb
      .from("tickets")
      .update({ 
        status: 'scanned', 
        scanned_at: new Date().toISOString() 
      })
      .eq("id", ticket.id)
      .eq("status", "valid")
      .select("id");

    if (updateError || !updated || updated.length === 0) {
      return NextResponse.json({ error: "Esta boleta acaba de ser escaneada simultáneamente en otra puerta." }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Acceso Concedido: ${attendeeName} - Localidad: ${tierName}`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error interno al procesar escaneo." }, { status: 500 });
  }
}
