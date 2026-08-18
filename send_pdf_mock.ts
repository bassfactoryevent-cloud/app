import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { Resend } from "resend";
import { renderToStream } from "@react-pdf/renderer";
import { TicketPDF } from "./src/components/pdf/TicketPDF";
import QRCode from "qrcode";
import React from "react";
import { getTicketDeliveryEmail } from "./src/utils/emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

async function run() {
  const qrDataUri = await QRCode.toDataURL('HASH-123-MOCK', {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 300,
    color: { dark: '#000000', light: '#ffffff' }
  });

  const eventTitle = "Bogotá Techno Festival";
  const eventDateStr = "sábado, 15 de octubre de 2026, 22:00";
  const eventLocation = "Chamorro City Hall";
  const tierName = "VIP Early Bird";
  const finalName = "Daniel Lopez";
  const finalEmail = "danielopzj@gmail.com";

  const pdfStream = await renderToStream(
    React.createElement(TicketPDF, {
      eventName: eventTitle,
      eventDate: eventDateStr,
      eventLocation: eventLocation,
      ticketTierName: tierName,
      customerName: finalName,
      qrDataUri: qrDataUri,
      eventDescription: "Sumérgete en más de 12 horas continuas del mejor techno industrial. Disfruta de un line-up de talla mundial en el mejor venue de la ciudad.",
      logoUrl: "https://bassfactory.co/Bass-Factory-Blanco-Sin-Letras.png",
      coverImageUrl: "https://bassfactory.co/industrial_shadows_1782405312617.png",
      orderId: "TEST-ORD-001"
    }) as any
  );

  const chunks: Uint8Array[] = [];
  for await (const chunk of pdfStream) {
    chunks.push(chunk as Uint8Array);
  }
  const pdfBuffer = Buffer.concat(chunks);

  await resend.emails.send({
    from: "Bassfactory Tickets <ventas@bassfactory.co>",
    to: finalEmail,
    subject: `Tu Entrada: ${eventTitle} - Bassfactory`,
    html: getTicketDeliveryEmail(finalName, eventTitle, eventDateStr, eventLocation),
    attachments: [
      {
        filename: `Ticket-${eventTitle.replace(/\s+/g, '-')}.pdf`,
        content: pdfBuffer,
      }
    ]
  });
  console.log("PDF Sent!");
}

run().catch(console.error);
