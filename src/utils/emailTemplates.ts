const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://bassfactory.co";
const LOGO_URL = `${APP_URL}/Bass-Factory-Blanco-Sin-Letras.png`;

const baseTemplate = (title: string, contentHtml: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #050505;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
    }
    .wrapper {
      background-color: #050505;
      padding: 40px 10px; /* Reduced side padding so it fits well on mobile without horizontal scroll */
      box-sizing: border-box;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
      box-sizing: border-box;
      background-color: #111111;
      border: 1px solid #222222;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      text-align: center;
      padding: 40px 20px 20px;
      background: linear-gradient(180deg, rgba(217,4,22,0.1) 0%, rgba(17,17,17,1) 100%);
    }
    .header img {
      width: 180px;
      height: auto;
    }
    .content {
      padding: 20px 40px 40px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin-top: 0;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
      color: #D90416;
    }
    p {
      font-size: 16px;
      color: #a1a1aa;
      margin-bottom: 20px;
    }
    strong {
      color: #ffffff;
    }
    .button {
      display: inline-block;
      background-color: #D90416;
      color: #ffffff !important;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding: 30px 20px;
      background-color: #050505;
      border-top: 1px solid #222222;
      color: #71717a;
      font-size: 12px;
    }
    .footer a {
      color: #71717a;
      text-decoration: underline;
    }
    .details-box {
      background-color: #0a0a0a;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .details-row:last-child {
      margin-bottom: 0;
    }
    .details-label {
      color: #a1a1aa;
    }
    .details-value {
      color: #ffffff;
      font-weight: 600;
      text-align: right;
    }
    hr {
      border: 0;
      border-top: 1px solid #222;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="${LOGO_URL}" alt="Bassfactory" />
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Bassfactory. Todos los derechos reservados.</p>
        <p>Si tienes dudas, contáctanos a <a href="mailto:soporte@bassfactory.co">soporte@bassfactory.co</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export interface PurchasedItem {
  type: "ticket" | "merch";
  title: string;
  tierOrVariant?: string;
  eventDate?: string;
  eventLocation?: string;
  quantity: number;
  priceFormatted?: string;
  ticketCodes?: string[];
}

export const getPurchaseConfirmationEmail = (
  name: string, 
  amount: string, 
  orderId: string, 
  hasTickets: boolean, 
  hasMerch: boolean,
  items: PurchasedItem[] = []
) => {
  let noticeHtml = "";
  if (hasTickets && hasMerch) {
    noticeHtml = `
      <div style="background-color: rgba(229, 9, 20, 0.1); border: 1px solid rgba(229, 9, 20, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
        <p style="margin: 0; font-weight: bold; color: #ff4d4d; font-size: 15px;">🛡️ Información sobre tus Boletas y Merch:</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #e4e4e7; line-height: 1.5;">
          • <strong>Boletas:</strong> Tus entradas están 100% aseguradas. Por protocolos de seguridad y prevención de clonación en taquilla, <strong>tu código QR oficial se generará y enviará a este correo exactamente 1 día antes del evento</strong>.<br>
          • <strong>Merch:</strong> Tu pedido de mercancía física está siendo preparado y te notificaremos cuando sea despachado.
        </p>
      </div>
    `;
  } else if (hasTickets) {
    noticeHtml = `
      <div style="background-color: rgba(229, 9, 20, 0.1); border: 1px solid rgba(229, 9, 20, 0.3); border-radius: 8px; padding: 15px; margin: 20px 0; text-align: left;">
        <p style="margin: 0; font-weight: bold; color: #ff4d4d; font-size: 15px;">🛡️ Protocolo de Seguridad en Taquilla:</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #e4e4e7; line-height: 1.5;">
          Tus entradas están confirmadas y aseguradas. Por motivos de seguridad y para evitar la clonación o reventa no autorizada, <strong>tu boleta oficial con código QR se generará y enviará a tu correo electrónico exactamente 1 día antes del evento</strong>.
        </p>
      </div>
    `;
  } else if (hasMerch) {
    noticeHtml = `
      <p style="color: #a1a1aa; font-size: 14px;">Tu pedido de mercancía está siendo procesado en nuestro almacén. Te notificaremos con el número de seguimiento apenas esté en camino.</p>
    `;
  }

  const itemsHtml = items && items.length > 0 ? `
    <div style="background-color: #0c0c0e; border: 1px solid #27272a; border-radius: 10px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #ffffff; font-size: 14px; font-weight: 800; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #1f1f23; padding-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
        🛒 Artículos Adquiridos
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px solid #1a1a1f;">
              <td style="padding: 12px 0; vertical-align: top;">
                <div style="color: #ffffff; font-weight: 700; font-size: 15px; line-height: 1.3;">
                  ${item.type === 'ticket' ? '🎟️' : '👕'} ${item.title}
                </div>
                ${item.tierOrVariant ? `<div style="color: #00F0FF; font-size: 13px; font-weight: 600; margin-top: 4px;">${item.tierOrVariant}</div>` : ''}
                ${item.eventDate ? `<div style="color: #a1a1aa; font-size: 12px; margin-top: 3px;">📅 ${item.eventDate}${item.eventLocation ? ` • 📍 ${item.eventLocation}` : ''}</div>` : ''}
                ${item.ticketCodes && item.ticketCodes.length > 0 ? `
                  <div style="color: #71717a; font-size: 11px; font-family: monospace; margin-top: 5px;">
                    Boleta(s): <strong style="color: #ffffff;">${item.ticketCodes.join(', ')}</strong>
                  </div>
                ` : ''}
              </td>
              <td style="padding: 12px 0 12px 12px; text-align: right; vertical-align: top; white-space: nowrap;">
                <div style="color: #ffffff; font-weight: 700; font-size: 14px;">Cant: ${item.quantity}</div>
                ${item.priceFormatted ? `<div style="color: #a1a1aa; font-size: 13px; margin-top: 3px;">${item.priceFormatted}</div>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const content = `
    <h1>¡Pago Confirmado con Éxito!</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Hemos recibido y validado el pago de tu orden en Bassfactory. A continuación encuentras el detalle de los artículos adquiridos:</p>
    
    ${itemsHtml}

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Número de Orden</span>
        <span class="details-value">#${orderId}</span>
      </div>
      <hr />
      <div class="details-row">
        <span class="details-label">Estado de la Compra</span>
        <span class="details-value" style="color: #22c55e;">Aprobado / Pagado</span>
      </div>
      <hr />
      <div class="details-row">
        <span class="details-label">Total Pagado</span>
        <span class="details-value" style="color: #ffffff; font-size: 16px;">$${amount} COP</span>
      </div>
    </div>

    ${noticeHtml}
    
    <center style="margin-top: 25px;">
      <a href="${APP_URL}/account/tickets" class="button">Ver Mis Boletas en Bassfactory</a>
    </center>
  `;
  return baseTemplate("Pago Confirmado - Bassfactory", content);
};

export const getTicketDeliveryEmail = (name: string, eventTitle: string, eventDate: string, eventLocation: string) => {
  const content = `
    <h1>Aquí está tu entrada</h1>
    <p>Hola <strong>${name}</strong>,</p>
    <p>Tu entrada oficial para <strong>${eventTitle}</strong> está adjunta a este correo electrónico en formato PDF.</p>
    
    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Evento</span>
        <span class="details-value">${eventTitle}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Fecha</span>
        <span class="details-value">${eventDate}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Lugar</span>
        <span class="details-value">${eventLocation}</span>
      </div>
    </div>

    <p>Recuerda llevar tu código QR (el PDF adjunto) descargado en tu celular o impreso para agilizar el ingreso al evento.</p>
    <p>Nos vemos en el dancefloor.</p>
    
    <center>
      <a href="${APP_URL}/account/tickets" class="button">Ver en mi cuenta</a>
    </center>
  `;
  return baseTemplate(`Tu Entrada: ${eventTitle}`, content);
};

export const getTransferInitiatedEmail = (receiverName: string, senderName: string, eventTitle: string, transferUrl: string) => {
  const content = `
    <h1>¡Te han enviado una entrada!</h1>
    <p>Hola <strong>${receiverName}</strong>,</p>
    <p><strong>${senderName}</strong> te ha transferido una boleta oficial para <strong>${eventTitle}</strong> a través de Bassfactory.</p>
    
    <p>Para asegurar tu ingreso y descargar tu código QR personal, es obligatorio que aceptes la transferencia ingresando a tu cuenta (si no tienes una, podrás crearla fácilmente con este mismo correo).</p>
    
    <center>
      <a href="${transferUrl}" class="button">Aceptar Boleta</a>
    </center>

    <p style="font-size: 14px; margin-top: 20px;"><em>Nota: Si no aceptas la transferencia, la boleta regresará a su comprador original.</em></p>
  `;
  return baseTemplate(`${senderName} te envió una boleta`, content);
};

export const getTransferAcceptedEmail = (senderName: string, receiverName: string, eventTitle: string) => {
  const content = `
    <h1>Transferencia Exitosa</h1>
    <p>Hola <strong>${senderName}</strong>,</p>
    <p>Te confirmamos que <strong>${receiverName}</strong> ha aceptado correctamente la boleta para <strong>${eventTitle}</strong> que le transferiste.</p>
    
    <p>La boleta ha salido de tu cuenta y el nuevo código QR ha sido despachado a su destinatario. Ya no tienes que preocuparte por nada más.</p>
    
    <center>
      <a href="${APP_URL}/account/tickets" class="button">Ver mis boletas</a>
    </center>
  `;
  return baseTemplate(`Transferencia aceptada por ${receiverName}`, content);
};

export const getSupabaseRegistrationTemplate = () => {
  const content = `
    <h1>Confirma tu correo</h1>
    <p>Hola,</p>
    <p>Bienvenido a la comunidad Bassfactory. Has creado una nueva cuenta y necesitamos verificar tu dirección de correo electrónico para asegurar tu acceso.</p>
    
    <p>Por favor haz clic en el siguiente botón para confirmar tu cuenta y acceder a todas las funciones (compra de tickets, transferencias y merchandising).</p>
    
    <center>
      <a href="{{ .ConfirmationURL }}" class="button">Verificar Cuenta</a>
    </center>
  `;
  return baseTemplate(`Bienvenido a Bassfactory`, content);
};

export const getSupabasePasswordResetTemplate = () => {
  const content = `
    <h1>Restablecer Contraseña</h1>
    <p>Hola,</p>
    <p>Hemos recibido una solicitud para cambiar la contraseña de tu cuenta en Bassfactory.</p>
    
    <p>Si fuiste tú, haz clic en el botón de abajo para asignar una nueva contraseña segura.</p>
    
    <center>
      <a href="{{ .ConfirmationURL }}" class="button">Cambiar Contraseña</a>
    </center>
    
    <p style="font-size: 14px; margin-top: 20px;"><em>Si no solicitaste este cambio, puedes ignorar este correo sin problema.</em></p>
  `;
  return baseTemplate(`Restablece tu contraseña`, content);
};
