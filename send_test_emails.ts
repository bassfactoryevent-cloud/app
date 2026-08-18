import { Resend } from 'resend';
import { 
  getPurchaseConfirmationEmail, 
  getTicketDeliveryEmail, 
  getTransferInitiatedEmail, 
  getTransferAcceptedEmail 
} from './src/utils/emailTemplates';

const resend = new Resend(process.env.RESEND_API_KEY);
const TARGET_EMAIL = 'danielopzj@gmail.com';

async function sendTests() {
  console.log('Enviando pruebas a:', TARGET_EMAIL);

  try {
    await resend.emails.send({
      from: 'Bassfactory Tickets <ventas@bassfactory.co>',
      to: TARGET_EMAIL,
      subject: 'PRUEBA FINAL - Aquí están tus boletas digitales',
      html: getTicketDeliveryEmail(
        'Daniel Lopez',
        'Bogotá Techno Festival',
        '15 de Octubre, 2026',
        'Chamorro City Hall'
      )
    });

    console.log('¡Prueba final enviada con éxito!');
  } catch (err) {
    console.error('Error al enviar pruebas:', err);
  }
}

sendTests();
