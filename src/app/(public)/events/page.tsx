import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Eventos | Bassfactory",
  description: "Descubre los próximos eventos, fiestas y shows de Bassfactory.",
};

export default async function EventsPage() {
  const supabase = await createClient();
  
  // Fetch only published events that have not ended yet (or just all published for now)
  const { data: events } = await supabase
    .from("events")
    .select("*, ticket_tiers(*)")
    .eq("status", "published")
    .order("start_date", { ascending: true });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>Próximos Eventos</h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>Reserva tus entradas para los mejores shows y fiestas de la escena.</p>
      </header>

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
