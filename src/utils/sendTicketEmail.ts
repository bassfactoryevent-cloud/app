import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { renderToStream } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/pdf/TicketPDF";
import QRCode from "qrcode";
import React from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTicketEmail(ticketId: string, customName?: string, customEmail?: string) {
  try {
    // Obtener los datos del ticket
    const { data: rawTicket, error } = await supabase
      .from("tickets")
      .select(`
        id,
        qr_hash,
        assigned_name,
        assigned_email,
        ticket_tiers!inner(name, events!inner(title, date, location, image_url)),
        merch_orders!inner(id, customer_name, customer_email)
      `)
      .eq("id", ticketId)
      .single();

    if (error || !rawTicket) {
      console.error("Error fetching ticket", error);
      return false;
    }

    const ticket = rawTicket as any;
    
    const tier = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0] : ticket.ticket_tiers;
    const event = Array.isArray(tier.events) ? tier.events[0] : tier.events;
    const order = Array.isArray(ticket.merch_orders) ? ticket.merch_orders[0] : ticket.merch_orders;

    // Quién recibe el correo:
    // 1. Si pasamos customName/Email explícito (desde el checkout o nominalización)
    // 2. Si ya estaba asignado en BD
    // 3. Fallback al dueño de la orden
    const finalName = customName || ticket.assigned_name || order.customer_name || 'Cliente';
    const finalEmail = customEmail || ticket.assigned_email || order.customer_email;

    if (!finalEmail) return false;

    // Generar Data URI del QR
    const qrDataUri = await QRCode.toDataURL(ticket.qr_hash, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const eventDateStr = new Date(event.date).toLocaleDateString('es-CO', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    // Generar Stream del PDF
    const pdfStream = await renderToStream(
      React.createElement(TicketPDF, {
        eventName: event.title,
        eventDate: eventDateStr,
        eventLocation: event.location,
        ticketTierName: tier.name || 'General',
        customerName: finalName,
        qrDataUri: qrDataUri,
        coverImageUrl: event.image_url,
        orderId: order.id || ticket.id
      }) as any
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Uint8Array);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Enviar Correo con Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "Bassfactory Tickets <tickets@bassfactory.co>",
        to: finalEmail,
        subject: `Tu Entrada: ${event.title} - Bassfactory`,
        html: `<p>Hola ${finalName},</p>
               <p>¡Tu entrada para <strong>${event.title}</strong> está lista!</p>
               <p>Adjunto encuentras tu boleta oficial en PDF con el código QR. Recuerda llevar este PDF en tu celular o impreso para escanear en la puerta.</p>
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
    await supabase.from("tickets").update({ qr_dispatched: true }).eq("id", ticketId);

    return true;
  } catch (error) {
    console.error("Error sending ticket email", error);
    return false;
  }
}
