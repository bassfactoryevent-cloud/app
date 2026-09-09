import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Ticket, CheckCircle2, XCircle, Clock } from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function TransferAcceptPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const transferId = resolvedParams.id;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Requerir Login para poder asociar la boleta a su cuenta
  if (!user) {
    redirect(`/login?redirect=/account/tickets/transfer/${transferId}`);
  }

  // 2. Fetch Transfer
  const { data: rawTransfer } = await supabase
    .from("ticket_transfers")
    .select(`
      id,
      status,
      to_email,
      to_name,
      created_at,
      tickets (
        id,
        qr_hash,
        ticket_tiers (
          name,
          events (
            title,
            start_date,
            location_name,
            cover_image
          )
        )
      ),
      users!ticket_transfers_from_user_id_fkey (
        raw_user_meta_data,
        email
      )
    `)
    .eq("id", transferId)
    .single();

  if (!rawTransfer) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '0 1rem' }}>
        <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'white' }}>Transferencia no encontrada</h1>
        <p style={{ opacity: 0.7, marginTop: '1rem', color: 'var(--color-text-secondary)' }}>El enlace es inválido o la transferencia ya no existe.</p>
      </div>
    );
  }

  let transfer = rawTransfer;

  // 3. Comprobar límite de expiración (48 horas)
  const isExpired = transfer.status === 'pending' && (
    Date.now() - new Date(transfer.created_at).getTime() > 48 * 60 * 60 * 1000
  );

  if (isExpired) {
    await supabase.from("ticket_transfers").update({ status: 'expired' }).eq("id", transfer.id);
    transfer = { ...transfer, status: 'expired' };
  }

  const usersData = Array.isArray(transfer.users) ? transfer.users[0] : transfer.users;
  const senderName = (usersData as any)?.raw_user_meta_data?.name || (usersData as any)?.raw_user_meta_data?.full_name || "Un usuario de Bassfactory";
  const senderEmail = (usersData as any)?.email;
  const t = transfer.tickets as any;
  const tier = Array.isArray(t?.ticket_tiers) ? t.ticket_tiers[0] : t?.ticket_tiers;
  const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;

  // Acciones (Server Actions Inlined)
  async function acceptTransfer() {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !rawTransfer) return;

    // 1. Marcar transfer como aceptado
    await supabase.from("ticket_transfers").update({ status: 'accepted', updated_at: new Date().toISOString() }).eq("id", rawTransfer.id);

    // 2. Cambiar dueño del ticket y resetear qr_dispatched
    await supabase.from("tickets").update({ 
      user_id: user.id,
      assigned_name: user.user_metadata?.name || user.user_metadata?.full_name || rawTransfer.to_name,
      assigned_email: user.email || rawTransfer.to_email,
      transferred_at: new Date().toISOString(),
      qr_dispatched: false
    }).eq("id", t.id);

    // 3. Notificar al dueño original que la boleta fue aceptada
    const receiverName = user.user_metadata?.name || user.user_metadata?.full_name || rawTransfer.to_name || "Tu amigo";
    if (senderEmail && process.env.RESEND_API_KEY) {
      import("resend").then(async ({ Resend }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { getTransferAcceptedEmail } = await import("@/utils/emailTemplates");
        
        await resend.emails.send({
          from: "Bassfactory Tickets <tickets@bassfactory.co>",
          to: senderEmail,
          subject: `¡Boleta aceptada por ${receiverName}!`,
          html: getTransferAcceptedEmail(senderName, receiverName, event?.title || "Evento")
        });
      }).catch(console.error);
    }

    revalidatePath(`/account/tickets/transfer/${rawTransfer.id}`);
    revalidatePath(`/account/tickets`);
  }

  async function rejectTransfer() {
    "use server";
    if (!rawTransfer) return;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("ticket_transfers").update({ status: 'rejected', updated_at: new Date().toISOString() }).eq("id", rawTransfer.id);

    // Notificar al dueño que la boleta fue devuelta
    const receiverName = user?.user_metadata?.name || rawTransfer.to_name || "El destinatario";
    if (senderEmail && process.env.RESEND_API_KEY) {
      import("resend").then(async ({ Resend }) => {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Bassfactory Tickets <tickets@bassfactory.co>",
          to: senderEmail,
          subject: `Boleta devuelta por ${receiverName}`,
          html: `<p>Hola ${senderName},</p><p>${receiverName} ha rechazado o devuelto la transferencia de la boleta para <strong>${event?.title || "el evento"}</strong>. La entrada ya se encuentra nuevamente disponible en tu cuenta.</p>`
        });
      }).catch(console.error);
    }

    revalidatePath(`/account/tickets/transfer/${rawTransfer.id}`);
    revalidatePath(`/account/tickets`);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem' }}>
      
      {transfer.status === 'pending' && (
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', borderRadius: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Ticket size={48} color="var(--color-magenta)" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>¡Tienes una entrada esperándote!</h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', marginBottom: '1.75rem' }}>
            <strong>{senderName}</strong> te ha transferido una boleta oficial para este evento:
          </p>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem', display: 'flex', gap: '1.25rem', alignItems: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(event?.cover_image || event?.image_url) && (
              <Image src={event.cover_image || event.image_url} alt={event.title} width={90} height={90} style={{ borderRadius: '0.5rem', objectFit: 'cover' }} />
            )}
            <div>
              <div style={{ color: 'var(--color-accent, #00f0ff)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {tier?.name || 'General'}
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.25rem 0', color: 'white' }}>{event?.title}</h3>
              <div style={{ fontSize: '0.85rem', opacity: 0.75, color: 'var(--color-text-secondary)' }}>
                {event?.start_date ? new Date(event.start_date).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha por confirmar'}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#fde68a', textAlign: 'left' }}>
            ⏱️ <strong>Límite de aceptación:</strong> Tienes 48 horas para aceptar esta boleta. Si no la aceptas a tiempo, regresará automáticamente al comprador original.
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <form action={rejectTransfer} style={{ flex: 1 }}>
              <button style={{ width: '100%', padding: '0.9rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                Rechazar / Devolver
              </button>
            </form>
            <form action={acceptTransfer} style={{ flex: 2 }}>
              <button style={{ width: '100%', padding: '0.9rem', backgroundColor: 'var(--color-magenta)', border: 'none', color: 'white', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
                Aceptar y Guardar Boleta
              </button>
            </form>
          </div>
        </div>
      )}

      {transfer.status === 'accepted' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '1.25rem' }}>
          <CheckCircle2 size={64} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', marginBottom: '1rem' }}>Boleta Aceptada con Éxito</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            La boleta ahora te pertenece y ha sido guardada en tu cuenta. Recuerda que el código QR oficial se activará 1 día antes del evento.
          </p>
          <a href="/account/tickets" style={{ display: 'inline-block', padding: '0.9rem 2rem', backgroundColor: 'var(--color-magenta)', border: 'none', color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 700 }}>
            Ir a Mis Boletas
          </a>
        </div>
      )}

      {transfer.status === 'rejected' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '1.25rem' }}>
          <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>Boleta Devuelta</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Has rechazado esta boleta. Ya ha sido devuelta a la cuenta de su comprador original.
          </p>
        </div>
      )}

      {transfer.status === 'expired' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '1.25rem' }}>
          <Clock size={64} color="#f59e0b" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#f59e0b' }}>Invitación Expirada</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Esta transferencia superó el límite de tiempo de 48 horas para ser aceptada. La entrada regresó automáticamente a su comprador original.
          </p>
        </div>
      )}

      {transfer.status === 'cancelled' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '1.25rem' }}>
          <XCircle size={64} color="#f59e0b" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>Transferencia Cancelada</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            El comprador original canceló esta transferencia antes de que fuera aceptada.
          </p>
        </div>
      )}

    </div>
  );
}
