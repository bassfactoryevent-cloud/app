import { NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const CONTACT_INBOX = process.env.CONTACT_INBOX_EMAIL || "danielopzj@gmail.com";

function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 2000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, city, service, eventType, attendance, budget, date, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nombre, correo y mensaje son obligatorios." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return NextResponse.json({ error: "Correo electrónico inválido." }, { status: 400 });
    }

    const rows: [string, unknown][] = [
      ["Nombre", name],
      ["Correo", email],
      ["Teléfono / WhatsApp", phone],
      ["Ciudad", city],
      ["Servicio de interés", service],
      ["Tipo de evento", eventType],
      ["Aforo estimado", attendance],
      ["Presupuesto", budget],
      ["Fecha tentativa", date],
    ];

    const html = `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px;border-radius:12px">
        <h2 style="color:#D90416;margin:0 0 12px">Nueva solicitud de Asesoría / Producción</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          ${rows
            .filter(([, v]) => v)
            .map(
              ([k, v]) =>
                `<tr><td style="padding:6px 8px;color:#a1a1aa;width:180px">${k}</td><td style="padding:6px 8px">${esc(v)}</td></tr>`
            )
            .join("")}
        </table>
        <h3 style="margin:18px 0 6px">Mensaje</h3>
        <p style="white-space:pre-wrap;color:#e4e4e7">${esc(message)}</p>
      </div>`;

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY missing — contact request:", rows, message);
    } else {
      const { error } = await resend.emails.send({
        from: "Bassfactory <tickets@bassfactory.co>",
        to: [CONTACT_INBOX],
        replyTo: String(email),
        subject: `🎛️ Asesoría de eventos: ${String(name).slice(0, 60)}`,
        html,
      });
      if (error) {
        console.error("Resend contact error:", error);
        return NextResponse.json(
          { error: "No pudimos enviar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp." },
          { status: 500 }
        );
      }

      // Confirmation to the requester (best-effort)
      await resend.emails
        .send({
          from: "Bassfactory <tickets@bassfactory.co>",
          to: [String(email)],
          subject: "Recibimos tu solicitud — Bassfactory Producción",
          html: `<div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px;border-radius:12px">
            <h2 style="color:#D90416;margin:0 0 10px">¡Hola ${esc(name)}!</h2>
            <p style="color:#e4e4e7">Recibimos tu solicitud de asesoría para crear tu evento. Nuestro equipo de producción te contactará en menos de 48 horas hábiles.</p>
            <p style="color:#a1a1aa;font-size:13px">— Equipo Bassfactory</p></div>`,
        })
        .catch(() => null);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Error inesperado." }, { status: 500 });
  }
}
