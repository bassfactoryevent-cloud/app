import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Eventos | Bassfactory",
  description: "Descubre los próximos eventos, fiestas y shows de Bassfactory.",
};

export default async function EventsPage() {
  const supabase = await createClient();
  
  // Fecha de ayer para mantener el evento visible durante el mismo día que ocurre
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Fetch published, postponed, and cancelled events
  const { data: rawEvents } = await supabase
    .from("events")
    .select("*, ticket_tiers(*)")
    .in("status", ["published", "postponed", "cancelled"])
    .order("start_date", { ascending: true });

  // Filter out past published events, but keep all postponed/cancelled ones visible
  const events = rawEvents?.filter(e => {
    if (e.status === "postponed" || e.status === "cancelled") return true;
    if (e.status === "published" && e.start_date) {
      return new Date(e.start_date) >= yesterday;
    }
    return false;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Próximos Eventos</h1>
        <p style={{ opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>Reserva tus entradas para los mejores shows y fiestas de la escena.</p>
      </header>

      <div style={{ margin: '0 auto 4rem auto', maxWidth: '800px', width: '100%' }}>
        <AdBanner placementName="events_sidebar" />
      </div>

      {(!events || events.length === 0) ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Calendar size={48} opacity={0.2} style={{ margin: '0 auto 1.5rem' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No hay eventos próximos</h3>
          <p style={{ opacity: 0.6 }}>Mantente atento a nuestras redes sociales para próximos anuncios.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
          {events.map(event => {
            const date = event.start_date ? new Date(event.start_date) : null;
            const minPrice = event.ticket_tiers && event.ticket_tiers.length > 0 
              ? Math.min(...event.ticket_tiers.map((t: any) => parseFloat(t.price))) 
              : 0;

            return (
              <Link href={`/events/${event.slug}`} key={event.id} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s, borderColor 0.2s' }}>
                <div style={{ height: '250px', backgroundColor: '#111', position: 'relative' }}>
                  {event.cover_image ? (
                    <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', opacity: 0.2 }}>
                      <Calendar size={64} />
                    </div>
                  )}
                  {date && (
                    <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--color-magenta)', fontWeight: 700 }}>{date.toLocaleDateString('es-ES', { month: 'short' })}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{date.getDate()}</div>
                    </div>
                  )}
                  {event.status === 'postponed' && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#f59e0b', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      Aplazado
                    </div>
                  )}
                  {event.status === 'cancelled' && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: '#ef4444', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                      Cancelado
                    </div>
                  )}
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>{event.title}</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                    <MapPin size={16} />
                    <span>{event.location_name || 'Locación por confirmar'}</span>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      {event.is_free ? (
                        <span style={{ fontWeight: 700, color: '#10b981' }}>Entrada Libre</span>
                      ) : (
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                          {minPrice > 0 ? `Desde $${minPrice.toLocaleString('es-CO')}` : 'Boletas Disponibles'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-magenta)', fontWeight: 600 }}>
                      Ver detalles <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
