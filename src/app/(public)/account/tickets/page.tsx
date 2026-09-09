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
      status,
      created_at
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

  // 4. Group tickets by Event
  const groupedMap = new Map<string, { event: any; tickets: any[] }>();
  for (const t of tickets) {
    const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
    const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
    const eventId = event?.id || "general-event";

    if (!groupedMap.has(eventId)) {
      groupedMap.set(eventId, {
        event: event || { title: "Evento Bassfactory" },
        tickets: []
      });
    }
    groupedMap.get(eventId)!.tickets.push(t);
  }

  const eventGroups = Array.from(groupedMap.values());

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '4rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 900, marginBottom: '0.4rem', fontFamily: 'Outfit, sans-serif', color: 'white', letterSpacing: '-0.02em' }}>
            Mis Boletas
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0, fontSize: '1rem' }}>
            Tus entradas oficiales para los próximos festivales y eventos de Bassfactory.
          </p>
        </div>

        {tickets.length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '0.45rem 1rem',
            borderRadius: '999px',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: '#22c55e'
          }}>
            <Sparkles size={16} />
            {tickets.length} {tickets.length === 1 ? 'Entrada Adquirida en Total' : 'Entradas Adquiridas en Total'}
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
            Protocolo de Seguridad y Activación Antifraude
          </h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: 0, fontSize: '0.875rem', lineHeight: 1.55 }}>
            Tus boletas están aseguradas. Para garantizar la seguridad del evento y evitar la reventa y clonación no autorizada, <strong>los botones de descarga en PDF y el código QR de acceso oficial permanecen bloqueados y se habilitarán exactamente 1 día antes del evento a las 00:00h</strong> en tu perfil y correo registrado.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {eventGroups.map((group) => {
            const rawDate = group.event?.start_date;
            const eventDate = rawDate 
              ? new Date(rawDate).toLocaleDateString('es-CO', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : 'Fecha por confirmar';
            
            return (
              <TicketCard 
                key={group.event?.id || "default-event"} 
                event={group.event} 
                tickets={group.tickets} 
                eventDate={eventDate} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
