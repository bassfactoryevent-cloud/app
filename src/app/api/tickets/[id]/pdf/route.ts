import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { renderToStream } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/pdf/TicketPDF";
import QRCode from "qrcode";
import React from "react";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminSupabase = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const ticketId = resolvedParams.id;

    if (!ticketId) {
      return NextResponse.json({ error: "ID de boleta requerido" }, { status: 400 });
    }

    // 1. Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión para descargar la boleta." }, { status: 401 });
    }

    // 2. Fetch ticket with admin client to bypass RLS and read joined data reliably
    const { data: rawTicket, error: ticketError } = await adminSupabase
      .from("tickets")
      .select(`
        id,
        user_id,
        qr_hash,
        status,
        qr_dispatched,
        assigned_name,
        assigned_email,
        order_id,
        tier_id
      `)
      .eq("id", ticketId)
      .single();

    if (ticketError || !rawTicket) {
      return NextResponse.json({ error: "Boleta no encontrada" }, { status: 404 });
    }

    const ticket = rawTicket as any;

    // Check ownership or admin
    if (ticket.user_id !== user.id) {
      const { data: roleData } = await adminSupabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        return NextResponse.json({ error: "No tienes permiso para descargar esta boleta" }, { status: 403 });
      }
    }

    if (ticket.status !== "valid" && ticket.status !== "scanned") {
      return NextResponse.json({ error: `La boleta no está activa (Estado: ${ticket.status})` }, { status: 400 });
    }

    // Fetch tier and event details
    let tier: any = null;
    let event: any = null;

    if (ticket.tier_id) {
      const { data: tierData } = await adminSupabase
        .from("ticket_tiers")
        .select(`
          id,
          name,
          price,
          events (
            id,
            title,
            start_date,
            location_name,
            location_address,
            cover_image,
            description
          )
        `)
        .eq("id", ticket.tier_id)
        .single();

      if (tierData) {
        tier = tierData;
        event = Array.isArray(tierData.events) ? tierData.events[0] : tierData.events;
      }
    }

    // Fetch order details if available
    let order: any = null;
    if (ticket.order_id) {
      const { data: orderData } = await adminSupabase
        .from("merch_orders")
        .select("id, customer_name, customer_email")
        .eq("id", ticket.order_id)
        .single();

      if (orderData) {
        order = orderData;
      }
    }

    const eventTitle = event?.title || "Evento Bassfactory";
    const customerName = ticket.assigned_name || order?.customer_name || user.user_metadata?.name || "Asistente Oficial";
    const orderId = order?.id || ticket.order_id || ticket.id;

    // Generate QR Code data URI (using qr_hash or ticket id)
    const qrDataUri = await QRCode.toDataURL(ticket.qr_hash || ticket.id, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
      color: { dark: "#000000", light: "#ffffff" },
    });

    const eventDateStr = event?.start_date
      ? new Date(event.start_date).toLocaleDateString("es-CO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Fecha por confirmar";

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bassfactory.co";

    // Generate PDF stream using TicketPDF
    const pdfStream = await renderToStream(
      React.createElement(TicketPDF, {
        eventName: eventTitle,
        eventDate: eventDateStr,
        eventLocation: event?.location_name || "Bogotá, Colombia",
        ticketTierName: tier?.name || "General",
        customerName: customerName,
        qrDataUri: qrDataUri,
        eventDescription: event?.description || "",
        coverImageUrl: event?.cover_image,
        logoUrl: `${appUrl}/Bass-Factory-Blanco-Sin-Letras.png`,
        orderId: String(orderId),
      }) as any
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Uint8Array);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const safeFilename = `Boleta-${eventTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}-${ticket.id.slice(0, 8).toUpperCase()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error generating ticket PDF:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar el PDF de la boleta" },
      { status: 500 }
    );
  }
}
