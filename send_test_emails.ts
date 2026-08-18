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
    // 1. Confirmación de Compra
    console.log('Enviando: Confirmación de Compra...');
    await resend.emails.send({
      from: 'Bassfactory Ventas <ventas@bassfactory.co>',
      to: TARGET_EMAIL,
      subject: 'PRUEBA - Confirmación de tu compra en Bassfactory',
      html: getPurchaseConfirmationEmail(
        'Daniel Lopez',
        '$150.000',
        'TEST-ORD-1234',
        true, // hasTickets
        true  // hasMerch
      )
    });

    // 2. Entrega de Tickets
    console.log('Enviando: Entrega de Tickets...');
    await resend.emails.send({
      from: 'Bassfactory Tickets <ventas@bassfactory.co>',
      to: TARGET_EMAIL,
      subject: 'PRUEBA - Aquí están tus boletas digitales',
      html: getTicketDeliveryEmail(
        'Daniel Lopez',
        'https://bassfactory.co/account/tickets',
        'Bogotá Techno Festival',
        '2',
        'VIP'
      )
    });

    // 3. Transferencia Iniciada
    console.log('Enviando: Transferencia Iniciada...');
    await resend.emails.send({
      from: 'Bassfactory Transferencias <ventas@bassfactory.co>',
      to: TARGET_EMAIL,
      subject: 'PRUEBA - Te han enviado un ticket',
      html: getTransferInitiatedEmail(
        'Daniel', // receiverName
        'Camilo Pérez', // senderName
        'https://bassfactory.co/account/tickets/transfer/TEST-123',
        'Bogotá Techno Festival'
      )
    });

    // 4. Transferencia Aceptada
    console.log('Enviando: Transferencia Aceptada...');
    await resend.emails.send({
      from: 'Bassfactory Transferencias <ventas@bassfactory.co>',
      to: TARGET_EMAIL,
      subject: 'PRUEBA - Tu transferencia fue aceptada exitosamente',
      html: getTransferAcceptedEmail(
        'Daniel', // senderName (who receives this email)
        'Andrés Gómez', // receiverName (who accepted it)
        'Bogotá Techno Festival'
      )
    });

    console.log('¡Todas las pruebas enviadas con éxito!');
  } catch (err) {
    console.error('Error al enviar pruebas:', err);
  }
}

sendTests();
