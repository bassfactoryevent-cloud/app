import { Resend } from "resend";
import { renderToStream } from "@react-pdf/renderer";
import { TicketPDF } from "@/components/pdf/TicketPDF";
import QRCode from "qrcode";
import React from "react";
import fs from "fs";
import path from "path";
import { getTicketDeliveryEmail, getAppUrl } from "@/utils/emailTemplates";

import { getAdminClient } from "@/utils/supabase/admin";

const supabase = getAdminClient();

export async function sendTicketEmail(ticketId: string, customName?: string, customEmail?: string) {
  try {
    // 1. Obtener ticket canónico
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, qr_hash, tier_id, order_id, assigned_name, assigned_email")
      .eq("id", ticketId)
      .single();

    if (ticketError || !ticket) {
      console.error("Error fetching ticket in sendTicketEmail:", ticketError);
      return false;
    }

    // 2. Obtener localidad y evento
    const { data: tier } = await supabase
      .from("ticket_tiers")
      .select("id, name, event_id")
      .eq("id", ticket.tier_id)
      .single();

    const { data: event } = tier?.event_id
      ? await supabase
          .from("events")
          .select("title, start_date, location_name, description, cover_image")
          .eq("id", tier.event_id)
          .single()
      : { data: null };

    if (!tier || !event) {
      console.error("Tier or event not found for ticket:", ticketId);
      return false;
    }

    // 3. Obtener orden asociada
    const { data: order } = ticket.order_id
      ? await supabase
          .from("merch_orders")
          .select("id, customer_name, customer_email")
          .eq("id", ticket.order_id)
          .single()
      : { data: null };

    // Destinatario final
    const finalName = customName || ticket.assigned_name || order?.customer_name || "Cliente";
    const finalEmail = customEmail || ticket.assigned_email || order?.customer_email;

    if (!finalEmail) return false;

    // Generar Data URI del QR
    const qrDataUri = await QRCode.toDataURL(ticket.qr_hash, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' }
    });

    const eventDateStr = new Date(event.start_date).toLocaleDateString('es-CO', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing in sendTicketEmail");
      return false;
    }

    // Leer logo local como Base64 Data URI para evitar fallos de red en @react-pdf/renderer
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

    // Procesar cover_image de forma segura (@react-pdf/renderer solo soporta PNG/JPEG, no WebP)
    let coverImageDataUri: string | undefined = undefined;
    if (event.cover_image) {
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
      }
    }

    // Generar Stream del PDF
    const pdfStream = await renderToStream(
      React.createElement(TicketPDF, {
        eventName: event.title,
        eventDate: eventDateStr,
        eventLocation: event.location_name || "Por confirmar",
        ticketTierName: tier.name || 'General',
        customerName: finalName,
        qrDataUri: qrDataUri,
        eventDescription: event.description || "",
        coverImageUrl: coverImageDataUri,
        logoDataUri: logoDataUri,
        logoUrl: logoDataUri ? undefined : `${getAppUrl()}/Bass-Factory-Blanco-Sin-Letras.png`,
        orderId: order?.id || ticket.id
      }) as any
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk as Uint8Array);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Enviar Correo con Resend y verificar respuesta
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Bassfactory Tickets <tickets@bassfactory.co>",
      to: finalEmail,
      subject: `Tu Entrada: ${event.title} - Bassfactory`,
      html: getTicketDeliveryEmail(finalName, event.title, eventDateStr, event.location_name || "Por confirmar"),
      attachments: [
        {
          filename: `Ticket-${event.title.replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    if (emailError) {
      console.error("Resend error in sendTicketEmail:", emailError);
      return false;
    }

    console.log(`Ticket email sent to ${finalEmail} (id: ${emailData?.id})`);

    // Marcar como despachado
    await supabase.from("tickets").update({ qr_dispatched: true }).eq("id", ticketId);

    return true;
  } catch (error) {
    console.error("Error sending ticket email", error);
    return false;
  }
}
