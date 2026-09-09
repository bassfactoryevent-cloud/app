import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { ShieldCheck, Ticket, Sparkles } from "lucide-react";
import TicketCard from "./TicketCard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function AccountTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 1. Fetch user order IDs (matching by user_id OR customer_email)
  const { data: userOrders } = await adminDb
    .from("merch_orders")
    .select("id")
    .or(`user_id.eq.${user.id},customer_email.ilike.${user.email}`);

  const orderIds = userOrders?.map((o: any) => o.id) || [];

  // 2. Query tickets by user_id OR assigned_email OR order_id
  let query = adminDb.from("tickets").select(`
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
  `);

  if (orderIds.length > 0) {
    query = query.or(`user_id.eq.${user.id},assigned_email.ilike.${user.email},order_id.in.(${orderIds.join(',')})`);
  } else {
    query = query.or(`user_id.eq.${user.id},assigned_email.ilike.${user.email}`);
  }

  const { data: rawTickets, error: ticketsError } = await query.order("created_at", { ascending: false });

  if (ticketsError) {
    console.error("Error fetching tickets for user:", ticketsError);
  }

  // 3. Fetch tiers & events separately
  let tickets: any[] = [];
  if (rawTickets && rawTickets.length > 0) {
    const tierIds = Array.from(new Set(rawTickets.map((t: any) => t.tier_id).filter(Boolean)));
    if (tierIds.length > 0) {
      const { data: tiersData } = await adminDb
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 3vw, 2.5rem)', fontWeight: 900, marginBottom: '0.4rem', fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-0.02em' }}>
            Mis Boletas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1rem' }}>
            Tus entradas oficiales para los próximos eventos de Bassfactory.
          </p>
        </div>

        {tickets.length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '0.4rem 0.9rem',
            borderRadius: '999px',
            fontSize: '0.825rem',
            fontWeight: 700,
            color: '#22c55e'
          }}>
            <Sparkles size={16} />
            {tickets.length} {tickets.length === 1 ? 'Entrada Adquirida' : 'Entradas Adquiridas'}
          </div>
        )}
      </div>

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
        <ShieldCheck size={26} style={{ color: 'var(--color-magenta)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ color: 'white', fontWeight: 800, margin: '0 0 0.25rem 0', fontSize: '0.95rem', letterSpacing: '0.02em' }}>
            Protocolo de Seguridad y Activación de QR para Taquilla
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.82)', margin: 0, fontSize: '0.875rem', lineHeight: 1.55 }}>
            Tus entradas están confirmadas y aseguradas en el sistema. Para garantizar la seguridad del evento y evitar duplicados o clonación, <strong>el código QR oficial de acceso se activará en tu perfil y se enviará a tu correo 1 día antes del evento a las 00:00h</strong>.
          </p>
        </div>
      </div>

      {!tickets || tickets.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '1rem' }}>
          <Ticket size={48} style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No tienes boletas adquiridas aún</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 1.5rem' }}>
            Cuando compres entradas para nuestros próximos festivales y eventos, aparecerán aquí con su código oficial de acceso.
          </p>
          <a
            href="/events"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-magenta)',
              color: 'white',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            Explorar Próximos Eventos
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {tickets.map((ticket: any) => {
            const tier = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0] : ticket.ticket_tiers;
            const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
            const rawDate = event?.start_date;
            const eventDate = rawDate 
              ? new Date(rawDate).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
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
