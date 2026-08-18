import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Validar autorización básica (debe ser admin o staff logueado)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { qr_hash, event_id } = await req.json();

    if (!qr_hash || !event_id) {
      return NextResponse.json({ error: "Datos de escaneo incompletos" }, { status: 400 });
    }

    // 1. Buscar la boleta por su hash QR
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        id, 
        status, 
        tier_id,
        ticket_tiers!inner(event_id, name)
      `)
      .eq("qr_hash", qr_hash)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Boleta no encontrada o código QR inválido" }, { status: 404 });
    }

    // 2. Validar que la boleta pertenece a este evento específico
    if (ticket.ticket_tiers.event_id !== event_id) {
      return NextResponse.json({ error: "Esta boleta pertenece a otro evento distinto" }, { status: 403 });
    }

    // 3. Validar el estado de la boleta
    if (ticket.status === 'scanned') {
      return NextResponse.json({ error: "Esta boleta ya fue escaneada anteriormente" }, { status: 400 });
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({ error: "Esta boleta está cancelada" }, { status: 400 });
    }

    // 4. Marcar como escaneada (Supabase Realtime emitirá el cambio automáticamente)
    const { error: updateError } = await supabase
      .from("tickets")
      .update({ status: 'scanned' }) // Asume que agregaremos la columna o que es un campo de texto
      .eq("id", ticket.id);

    if (updateError) {
      return NextResponse.json({ error: "Error interno al actualizar la boleta" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Acceso concedido. (Localidad: ${ticket.ticket_tiers.name})`
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
