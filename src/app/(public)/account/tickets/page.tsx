import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import TicketCard from "./TicketCard";

export default async function AccountTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user tickets with transfers
  const { data: rawTickets, error: ticketsError } = await supabase
    .from("tickets")
    .select(`
      id,
      order_id,
      qr_hash,
      status,
      tier_id,
      assigned_name,
      assigned_email,
      qr_dispatched,
      created_at,
      ticket_transfers (
        id,
        to_email,
        to_name,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ticketsError) {
    console.error("Error fetching tickets for user:", ticketsError);
  }

  let tickets: any[] = [];

  if (rawTickets && rawTickets.length > 0) {
    const tierIds = Array.from(new Set(rawTickets.map((t: any) => t.tier_id).filter(Boolean)));
    if (tierIds.length > 0) {
      const { data: tiersData } = await supabase
        .from("ticket_tiers")
        .select(`
          id,
          name,
          price,
          events (
            id,
            title,
            start_date,
            location_name,
            location_address,
            cover_image,
            description
          )
        `)
        .in("id", tierIds);

      tickets = rawTickets.map((t: any) => {
        const tier = tiersData?.find((tr: any) => tr.id === t.tier_id);
        return {
          ...t,
          ticket_tiers: tier || null
        };
      });
    } else {
      tickets = rawTickets;
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Mis Boletas</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Tus entradas oficiales para los próximos eventos de Bassfactory.</p>

      {/* Banner Informativo sobre Generación de Boletas */}
      <div style={{
        backgroundColor: 'rgba(229, 9, 20, 0.08)',
        border: '1px solid rgba(229, 9, 20, 0.25)',
        borderRadius: '1rem',
        padding: '1.25rem 1.5rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <ShieldCheck size={24} style={{ color: 'var(--color-magenta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ color: 'white', fontWeight: 700, margin: '0 0 0.25rem 0', fontSize: '0.95rem' }}>
            Protección Antifraude y Acceso a Taquilla
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, fontSize: '0.875rem', lineHeight: 1.5 }}>
            Tus entradas están confirmadas. Para garantizar la seguridad del evento y evitar duplicados o clonación, <strong>el código QR oficial para el ingreso en taquilla se activará y se enviará a tu correo 1 día antes del evento</strong>.
          </p>
        </div>
      </div>

      {!tickets || tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>No tienes boletas adquiridas aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {tickets.map((ticket: any) => {
            const tier = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0] : ticket.ticket_tiers;
            const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
            const rawDate = event?.start_time || event?.start_date;
            const eventDate = rawDate 
              ? new Date(rawDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Fecha por confirmar';
            
            return (
              <TicketCard key={ticket.id} ticket={ticket} eventDate={eventDate} />
            );
          })}
        </div>
      )}
    </div>
  );
}
