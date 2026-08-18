import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import TicketCard from "./TicketCard";

export default async function AccountTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user tickets with event details
  const { data: rawTickets } = await supabase
    .from("tickets")
    .select(`
      id,
      qr_hash,
      status,
      tier_id,
      orders (
        id
      ),
      ticket_transfers (
        id,
        to_email,
        to_name,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  let tickets: any[] = [];
  
  if (rawTickets && rawTickets.length > 0) {
    const tierIds = rawTickets.map((t: any) => t.tier_id).filter(Boolean);
    const { data: tiersData } = await supabase
      .from("ticket_tiers")
      .select(`
        id,
        name,
        events (
          title,
          start_time,
          location_name,
          image_url
        )
      `)
      .in("id", tierIds);
      
    tickets = rawTickets.map((t: any) => {
      const tier = tiersData?.find((tr: any) => tr.id === t.tier_id);
      return {
        ...t,
        ticket_tiers: tier
      };
    });
  }

  return (
    <div>
      <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>Mis Tickets</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>Tus entradas para próximos eventos. Presenta el código QR en la puerta.</p>

      {!tickets || tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed var(--glass-border)' }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>No tienes tickets comprados aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {tickets.map((ticket: any) => {
            const event = ticket.ticket_tiers.events;
            const eventDate = new Date(event.start_time).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            return (
              <TicketCard key={ticket.id} ticket={ticket} eventDate={eventDate} />
            );
          })}
        </div>
      )}
    </div>
  );
}
