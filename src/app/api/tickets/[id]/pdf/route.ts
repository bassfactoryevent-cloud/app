import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { renderToStream } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/pdf/TicketPDF";
import QRCode from "qrcode";
import React from "react";
import fs from "fs";
import path from "path";

import { getAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminSupabase = getAdminClient();
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

    // 3. Validar propiedad de la boleta o rol administrativo
    let isOwner = ticket.user_id === user.id || ticket.assigned_email?.toLowerCase() === user.email?.toLowerCase();

    if (!isOwner && ticket.order_id) {
      const { data: order } = await adminSupabase
        .from("merch_orders")
        .select("user_id, customer_email")
        .eq("id", ticket.order_id)
        .single();
      if (order && (order.user_id === user.id || order.customer_email?.toLowerCase() === user.email?.toLowerCase())) {
        isOwner = true;
      }
    }

    // Verificación independiente del rol de administrador
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Acceso denegado: No tienes permiso para descargar esta entrada." }, { status: 403 });
    }

    if (ticket.status !== "valid" && ticket.status !== "scanned") {
      return NextResponse.json({ error: `La boleta no está activa (Estado: ${ticket.status})` }, { status: 400 });
    }

    // 4. Fetch tier and event details
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

    // 5. Antifraud 24-hour activation rule
    const eventStartDate = event?.start_date ? new Date(event.start_date) : null;
    const isWithin24Hours = eventStartDate 
      ? (eventStartDate.getTime() - Date.now()) <= 24 * 60 * 60 * 1000 
      : false;
    const isEnabled = isWithin24Hours || ticket.qr_dispatched;

    if (!isEnabled && !isAdmin) {
      return NextResponse.json({
        error: "Por seguridad antifraude, la boleta oficial en PDF y el código QR de acceso solo están disponibles 1 día antes del evento."
      }, { status: 403 });
    }

    // 6. Fetch order details if available
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

    // 7. Generate QR Code data URI
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

    // 8. Read local logo as Base64 Data URI to prevent network/URL failures
    let logoDataUri: string | undefined = undefined;
    try {
      const logoPath = path.join(process.cwd(), "public", "Bass-Factory-Blanco-Sin-Letras.png");
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoDataUri = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      }
    } catch (logoErr) {
      console.error("Error reading logo file for ticket PDF:", logoErr);
    }

    // 9. Process cover image safely without native sharp dependency
    let coverImageDataUri: string | undefined = undefined;
    if (event?.cover_image) {
      try {
        const imgRes = await fetch(event.cover_image);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get("content-type") || "";
          if (contentType.includes("png") || contentType.includes("jpeg") || contentType.includes("jpg")) {
            const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
            coverImageDataUri = `data:${contentType};base64,${imgBuffer.toString("base64")}`;
          }
        }
      } catch (imgErr) {
        console.error("Error fetching cover_image for ticket PDF:", imgErr);
        coverImageDataUri = undefined;
      }
    }

    // 10. Generate PDF stream using TicketPDF
    const pdfStream = await renderToStream(
      React.createElement(TicketPDF, {
        eventName: eventTitle,
        eventDate: eventDateStr,
        eventLocation: event?.location_name || "Bogotá, Colombia",
        ticketTierName: tier?.name || "General",
        customerName: customerName,
        qrDataUri: qrDataUri,
        eventDescription: event?.description || "",
        coverImageUrl: coverImageDataUri,
        logoDataUri: logoDataUri,
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
