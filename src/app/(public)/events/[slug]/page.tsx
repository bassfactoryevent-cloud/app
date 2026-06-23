import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Music, Briefcase } from "lucide-react";
import EventCheckout from "./EventCheckout";
import styles from "../../../admin/components/TiptapEditor.module.css"; // Reuse tiptap styles for rendering

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("title, cover_image").eq("slug", params.slug).single();
  return {
    title: event ? `${event.title} | Bassfactory` : "Evento | Bassfactory",
    openGraph: { images: event?.cover_image ? [event.cover_image] : [] }
  };
}

export default async function EventPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  
  // Obtener evento con sus relaciones
  const { data: event } = await supabase
    .from("events")
    .select(`
      *,
      ticket_tiers(*),
      event_djs(djs(*)),
      event_sponsors(sponsors(*))
    `)
    .eq("slug", params.slug)
    .single();

  if (!event || event.status !== "published") {
    notFound();
  }

  const djs = event.event_djs?.map((ed: any) => ed.djs) || [];
  const sponsors = event.event_sponsors?.map((es: any) => es.sponsors) || [];
  const date = event.start_date ? new Date(event.start_date) : null;

  return (
    <div>
      {/* Hero Header */}
      <div style={{ position: 'relative', height: '60vh', minHeight: '400px', backgroundColor: '#000', display: 'flex', alignItems: 'flex-end' }}>
        {event.cover_image && (
          <img src={event.cover_image} alt={event.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '2rem', width: '100%' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{event.title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '1.25rem', opacity: 0.9, fontWeight: 600 }}>
            {date && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={20} /> {date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
            {event.location_name && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={20} /> {event.location_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content & Checkout Grid */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', display: 'flex', gap: '4rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Column: Info, Lineup, Description */}
        <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          
          {/* Descripción */}
          {event.description && (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Acerca del Evento</h3>
              <div 
                className={styles.tiptapContent} 
                style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: event.description }} 
              />
            </div>
          )}

          {/* Lineup */}
          {djs.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Music /> Line Up</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '2rem' }}>
                {djs.map((dj: any) => (
                  <div key={dj.id} style={{ textAlign: 'center' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }}>
                      {dj.photo_url ? (
                        <img src={dj.photo_url} alt={dj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Music size={32} opacity={0.5} /></div>
                      )}
                    </div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{dj.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patrocinadores */}
          {sponsors.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase /> Presentado por</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
                {sponsors.map((s: any) => (
                  <div key={s.id} style={{ opacity: 0.8 }}>
                    {s.logo_url ? (
                      <img src={s.logo_url} alt={s.name} style={{ maxHeight: '40px', maxWidth: '150px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontWeight: 700 }}>{s.name}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Checkout Widget */}
        <div style={{ flex: '1 1 350px', position: 'sticky', top: '2rem' }}>
          <EventCheckout 
            eventId={event.id} 
            isFree={event.is_free} 
            ticketTiers={event.ticket_tiers || []} 
          />
        </div>

      </div>
    </div>
  );
}
