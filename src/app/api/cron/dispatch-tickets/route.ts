import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { renderToStream } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/pdf/TicketPDF";
import QRCode from "qrcode";
import React from "react";

// Inicializamos Supabase Admin (para leer cosas seguras en CRON jobs)
// Nota: en producción debe usarse SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  try {
    // 1. Obtener los eventos que suceden mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.setHours(0,0,0,0)).toISOString();
    const tomorrowEnd = new Date(tomorrow.setHours(23,59,59,999)).toISOString();

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title, start_date, location_name, cover_image, description")
      .gte("start_date", tomorrowStart)
      .lte("start_date", tomorrowEnd);

    if (eventsError || !events || events.length === 0) {
      return NextResponse.json({ message: "No events for tomorrow" });
    }

    let ticketsDispatched = 0;

    for (const event of events) {
      // 2. Obtener los tickets no despachados para cada evento de mañana
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          id,
          qr_hash,
          ticket_tiers!inner(name),
          merch_orders!inner(id, customer_name, customer_email)
        `)
        .eq("qr_dispatched", false)
        // Hacemos el join implícito para filtrar por event_id
        // Para que esto funcione perfectamente la relación debe estar bien.
        // Pero usamos los tiers del evento:
        .in("tier_id", (
          await supabase.from("ticket_tiers").select("id").eq("event_id", event.id)
        ).data?.map(t => t.id) || []);

      if (!tickets || tickets.length === 0) continue;

      for (const rawTicket of tickets) {
        const ticket = rawTicket as any;
        
        const tierName = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0]?.name : ticket.ticket_tiers?.name;
        const customerName = Array.isArray(ticket.merch_orders) ? ticket.merch_orders[0]?.customer_name : ticket.merch_orders?.customer_name;
        const customerEmail = Array.isArray(ticket.merch_orders) ? ticket.merch_orders[0]?.customer_email : ticket.merch_orders?.customer_email;
        const orderId = Array.isArray(ticket.merch_orders) ? ticket.merch_orders[0]?.id : ticket.merch_orders?.id;

        // Generar Data URI del QR
        const qrDataUri = await QRCode.toDataURL(ticket.qr_hash, {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 300,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        const eventDateStr = new Date(event.start_date).toLocaleDateString('es-CO', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
        });

        // Generar el Stream del PDF usando React.createElement ya que este archivo es .ts
        // Se usa "as any" porque renderToStream exige estrictamente un <Document> en sus tipos
        const pdfStream = await renderToStream(
          React.createElement(TicketPDF, {
            eventName: event.title,
            eventDate: eventDateStr,
            eventLocation: event.location_name,
            ticketTierName: tierName || 'General',
            customerName: customerName || 'Cliente',
            qrDataUri: qrDataUri,
            eventDescription: event.description,
            coverImageUrl: event.cover_image,
            logoUrl: process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/Bass-Factory-Blanco-Sin-Letras.png` : "https://bassfactory.co/Bass-Factory-Blanco-Sin-Letras.png",
            orderId: orderId || ticket.id
          }) as any
        );

        // Convertir stream a buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of pdfStream) {
          chunks.push(chunk as Uint8Array);
        }
        const pdfBuffer = Buffer.concat(chunks);

        // Enviar Correo con Resend
        if (process.env.RESEND_API_KEY) {
          await resend.emails.send({
            from: "Bassfactory Tickets <tickets@bassfactory.co>",
            to: customerEmail,
            subject: `Tus Entradas: ${event.title} - Bassfactory`,
            html: `<p>Hola ${customerName},</p>
                   <p>¡El evento es mañana! Adjunto encuentras tu boleta oficial en PDF con el código QR.</p>
                   <p>Recuerda llevar este PDF en tu celular o impreso para escanear en la puerta.</p>
                   <p>Nos vemos en el dancefloor.</p>`,
            attachments: [
              {
                filename: `Ticket-${event.title.replace(/\s+/g, '-')}.pdf`,
                content: pdfBuffer,
              }
            ]
          });
        }

        // Marcar como despachado
        await supabase
          .from("tickets")
          .update({ qr_dispatched: true })
          .eq("id", ticket.id);

        ticketsDispatched++;
      }
    }

    return NextResponse.json({ success: true, dispatched: ticketsDispatched });
  } catch (error: any) {
    console.error("Cron Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
