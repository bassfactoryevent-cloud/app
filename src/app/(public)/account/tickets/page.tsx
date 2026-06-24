import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, QrCode } from "lucide-react";

export default async function AccountTicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Load user tickets with event details
  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      id,
      qr_hash,
      status,
      orders (
        id
      ),
      ticket_tiers (
        name,
        events (
          title,
          start_time,
          location_name,
          image_url
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Mis Tickets</h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Tus entradas para próximos eventos. Presenta el código QR en la puerta.</p>

      {!tickets || tickets.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <p style={{ opacity: 0.7, marginBottom: '1rem' }}>No tienes tickets comprados aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {tickets.map((ticket: any) => {
            const event = ticket.ticket_tiers.events;
            const eventDate = new Date(event.start_time).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            return (
              <div key={ticket.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                {event.image_url && (
                  <div style={{ width: '200px', height: '200px', position: 'relative', flexShrink: 0 }}>
                    <Image src={event.image_url} alt={event.title} fill style={{ objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-magenta)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    {ticket.ticket_tiers.name}
                  </div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>{event.title}</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.8, fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} /> {eventDate}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} /> {event.location_name}
                    </div>
                  </div>
                </div>
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)', width: '250px' }}>
                  {ticket.status === 'valid' ? (
                    <>
                      {/* Simulación visual de QR usando un placeholder o ícono por ahora */}
                      <div style={{ width: '120px', height: '120px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', borderRadius: '0.5rem' }}>
                        <QrCode size={80} color="black" />
                      </div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.5, fontFamily: 'monospace' }}>{ticket.qr_hash.substring(0, 12)}...</div>
                      <div style={{ marginTop: '0.5rem', color: '#22c55e', fontWeight: 700, fontSize: '0.875rem' }}>Válido</div>
                    </>
                  ) : (
                    <div style={{ color: '#ef4444', fontWeight: 700 }}>{ticket.status.toUpperCase()}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
