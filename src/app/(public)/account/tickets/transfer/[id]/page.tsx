import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Ticket, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";

export default async function TransferAcceptPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Requerir Login
  if (!user) {
    redirect(`/login?redirect=/account/tickets/transfer/${params.id}`);
  }

  // 2. Fetch Transfer
  const { data: transfer } = await supabase
    .from("ticket_transfers")
    .select(`
      id,
      status,
      to_email,
      to_name,
      tickets (
        id,
        qr_hash,
        ticket_tiers (
          name,
          events (
            title,
            start_time,
            location_name,
            image_url
          )
        )
      ),
      users!ticket_transfers_from_user_id_fkey (
        raw_user_meta_data
      )
    `)
    .eq("id", params.id)
    .single();

  if (!transfer) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Transferencia no encontrada</h1>
        <p style={{ opacity: 0.7, marginTop: '1rem' }}>El enlace es inválido o la transferencia ya no existe.</p>
      </div>
    );
  }

  const usersData = Array.isArray(transfer.users) ? transfer.users[0] : transfer.users;
  const senderName = (usersData as any)?.raw_user_meta_data?.name || "Un usuario";
  const t = transfer.tickets as any;
  const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
  const event = Array.isArray(tier.events) ? tier.events[0] : tier.events;

  // Acciones (Server Actions Inlined)
  async function acceptTransfer() {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Marcar transfer como aceptado
    await supabase.from("ticket_transfers").update({ status: 'accepted' }).eq("id", transfer.id);

    // 2. Cambiar dueño del ticket y resetear qr_dispatched
    await supabase.from("tickets").update({ 
      user_id: user.id,
      assigned_name: user.user_metadata?.name || transfer.to_name,
      assigned_email: user.email || transfer.to_email,
      qr_dispatched: false // Reset para forzar el re-envío si fuera necesario
    }).eq("id", t.id);

    // 3. Generar y enviar el PDF en background
    import("@/utils/sendTicketEmail").then(({ sendTicketEmail }) => {
      sendTicketEmail(t.id, user.user_metadata?.name || transfer.to_name, user.email || transfer.to_email).catch(console.error);
    });

    revalidatePath(`/account/tickets/transfer/${transfer.id}`);
    revalidatePath(`/account/tickets`);
  }

  async function rejectTransfer() {
    "use server";
    const supabase = await createClient();
    await supabase.from("ticket_transfers").update({ status: 'rejected' }).eq("id", transfer.id);
    revalidatePath(`/account/tickets/transfer/${transfer.id}`);
  }

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '0 1rem' }}>
      
      {transfer.status === 'pending' && (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <Ticket size={48} color="var(--color-magenta)" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>¡Tienes una entrada!</h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            <strong>{senderName}</strong> te ha transferido una boleta oficial.
          </p>

          <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '1rem', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {event.image_url && (
              <Image src={event.image_url} alt={event.title} width={80} height={80} style={{ borderRadius: '0.5rem', objectFit: 'cover' }} />
            )}
            <div>
              <div style={{ color: 'var(--color-magenta)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {tier.name}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.25rem 0' }}>{event.title}</h3>
              <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                {new Date(event.start_time).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <form action={rejectTransfer} style={{ flex: 1 }}>
              <button style={{ width: '100%', padding: '1rem', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                Rechazar
              </button>
            </form>
            <form action={acceptTransfer} style={{ flex: 2 }}>
              <button style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--color-magenta)', border: 'none', color: 'white', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>
                Aceptar Boleta
              </button>
            </form>
          </div>
        </div>
      )}

      {transfer.status === 'accepted' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <CheckCircle2 size={64} color="#22c55e" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', marginBottom: '1rem' }}>Boleta Aceptada</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            La boleta ahora es tuya y la hemos enviado a tu correo. También puedes verla en tu perfil.
          </p>
          <a href="/account/tickets" style={{ display: 'inline-block', padding: '1rem 2rem', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 600 }}>
            Ver Mis Boletas
          </a>
        </div>
      )}

      {transfer.status === 'rejected' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <XCircle size={64} color="#ef4444" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Boleta Rechazada</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Has rechazado esta boleta. Será devuelta al comprador original.
          </p>
        </div>
      )}

      {transfer.status === 'cancelled' && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <XCircle size={64} color="#f59e0b" style={{ margin: '0 auto 1.5rem' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Transferencia Cancelada</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            El dueño original canceló esta transferencia antes de que pudieras aceptarla.
          </p>
        </div>
      )}

    </div>
  );
}
