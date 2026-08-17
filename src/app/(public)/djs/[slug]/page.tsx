import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, Download, Music, Globe, Calendar, MapPin } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import HorizontalScroll from "@/components/ui/HorizontalScroll";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: dj } = await supabase.from("djs").select("name, bio_short, photo_url").eq("slug", (await params).slug).single();
  
  if (!dj) return { title: "DJ Not Found" };
  
  return {
    title: `${dj.name} | Presskit - Bassfactory`,
    description: dj.bio_short || `Descubre el Electronic Press Kit de ${dj.name}`,
    openGraph: {
      images: dj.photo_url ? [dj.photo_url] : [],
    }
  };
}

export default async function DjEPKPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: dj } = await supabase
    .from("djs")
    .select(`
      *,
      event_djs (
        set_time,
        events (id, title, slug, location_name, status, start_date, cover_image)
      )
    `)
    .eq("slug", (await params).slug)
    .single();

  if (!dj || dj.type !== 'colectivo') {
    notFound();
  }

  // Combinar eventos internos y externos
  const internalBookings = dj.event_djs?.filter((b: any) => b.events && b.events.status !== 'cancelled').map((b: any) => {
    const evt = b.events;
    return {
      type: 'internal',
      date: new Date(evt.start_date || b.set_time || 0),
      title: evt.title,
      location: evt.location_name,
      slug: evt.slug,
      cover_image: evt.cover_image
    };
  }) || [];

  const externalBookings = (dj.external_bookings || []).map((b: any) => ({
    type: 'external',
    date: new Date(b.date),
    title: b.title,
    location: b.location,
    url: b.ticket_url,
    cover_image: null
  }));

  // Ordenar todo y mostrar solo eventos desde hoy
  const now = new Date();
  const allBookings = [...internalBookings, ...externalBookings]
    .filter(b => b.date.getTime() >= now.getTime() - 86400000) // Mostrar eventos recientes o futuros
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div style={{ paddingBottom: '4rem' }}>
      
      {/* HERO SECTION */}
      <div style={{ position: 'relative', height: '60vh', minHeight: '400px', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        {dj.cover_image ? (
          <Image src={dj.cover_image} alt={`Portada de ${dj.name}`} fill style={{ objectFit: 'cover', objectPosition: 'center 20%' }} priority />
        ) : dj.photo_url ? (
          <Image src={dj.photo_url} alt={dj.name} fill style={{ objectFit: 'cover', filter: 'blur(10px) brightness(0.5)' }} priority />
        ) : (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.05)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--color-background) 0%, rgba(0,0,0,0.2) 100%)' }} />
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2rem 1rem' }}>
          <Link href="/djs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            <ArrowLeft size={16} /> Volver a Artistas
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', flexWrap: 'wrap' }}>
            {dj.photo_url && (
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.1)', flexShrink: 0, backgroundColor: '#111', position: 'relative' }}>
                <Image src={dj.photo_url} alt={`Foto de perfil de ${dj.name}`} fill style={{ objectFit: 'cover' }} />
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '300px' }}>
              <h1 style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, margin: 0, color: 'white', wordBreak: 'break-word' }}>
                {dj.name}
              </h1>
              {dj.bio_short && (
                <p style={{ color: 'var(--color-magenta)', fontWeight: 600, maxWidth: '600px', margin: 0 }}>
                  {dj.bio_short}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* UPCOMING EVENTS (SLIDER AL ESTILO HOME) */}
        {allBookings.length > 0 && (
          <section>
            <h2 style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Tour Dates & Events
            </h2>
            <HorizontalScroll title="" viewAllLink="">
              {allBookings.map((booking: any, idx: number) => {
                const CardComponent = booking.type === 'internal' ? Link : 'a';
                const hrefProps = booking.type === 'internal' 
                  ? { href: `/events/${booking.slug}` }
                  : { href: booking.url || '#', target: booking.url ? '_blank' : undefined, rel: booking.url ? 'noreferrer' : undefined };
                
                const fallbackImage = dj.photo_url || "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400";
                
                return (
                  <CardComponent 
                    key={idx} 
                    {...hrefProps} 
                    style={{ 
                      textDecoration: 'none', 
                      color: 'inherit', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      backgroundColor: 'rgba(255,255,255,0.03)', 
                      borderRadius: '1rem', 
                      overflow: 'hidden', 
                      border: '1px solid rgba(255,255,255,0.05)', 
                      transition: 'transform 0.2s, borderColor 0.2s',
                      minWidth: '280px',
                      maxWidth: '350px'
                    }} 
                    className="hover-card-transform"
                  >
                    <div style={{ height: '200px', position: 'relative', backgroundColor: '#111' }}>
                      <img 
                        src={booking.cover_image || fallbackImage} 
                        alt={booking.title} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', top: '1rem', left: '1rem', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', padding: '0.5rem 1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--color-magenta)', fontWeight: 700 }}>
                          {booking.date.toLocaleDateString('es-ES', { month: 'short' })}
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>
                          {booking.date.getDate()}
                        </div>
                      </div>
                      {booking.type === 'external' && (
                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'var(--color-magenta)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                          Externo
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>{booking.title}</h3>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.7, marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <MapPin size={16} />
                        <span>{booking.location}</span>
                      </div>
                    </div>
                  </CardComponent>
                )
              })}
            </HorizontalScroll>
          </section>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
          
          {/* COLUMNA IZQUIERDA: BIO & FOTOS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {dj.bio_full && (
              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Biography</h2>
                <div style={{ fontSize: '1.1rem', lineHeight: 1.8, opacity: 0.8, whiteSpace: 'pre-line' }}>
                  {dj.bio_full}
                </div>
              </section>
            )}

            {dj.press_photos && dj.press_photos.length > 0 && (
              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Press Photos</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                  {dj.press_photos.map((photo: string, i: number) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <Image src={photo} alt={`Press photo ${i + 1}`} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* COLUMNA DERECHA: BOOKING Y LINKS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* BOOKING / CONTACTO */}
            <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--color-magenta)' }}>Booking & Contact</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dj.contact_email && (
                  <a href={`mailto:${dj.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'inherit', textDecoration: 'none', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', transition: 'background-color 0.2s' }} className="hover-bg-light">
                    <Mail size={20} style={{ color: 'var(--color-magenta)' }} />
                    <span style={{ fontWeight: 500 }}>{dj.contact_email}</span>
                  </a>
                )}
                {dj.contact_phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                    <Phone size={20} style={{ color: 'var(--color-magenta)' }} />
                    <span style={{ fontWeight: 500 }}>{dj.contact_phone}</span>
                  </div>
                )}
                {dj.tech_rider_url && (
                  <a href={dj.tech_rider_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'white', backgroundColor: 'var(--color-magenta)', textDecoration: 'none', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 600, marginTop: '1rem' }}>
                    <Download size={18} /> Descargar Tech Rider
                  </a>
                )}
              </div>
            </section>

            {/* MÚSICA Y REDES */}
            <section>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Links</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {dj.soundcloud_url && (
                  <a href={dj.soundcloud_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#ff5500', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Music size={16} /> SoundCloud
                  </a>
                )}
                {dj.music_spotify && (
                  <a href={dj.music_spotify} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#1DB954', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Globe size={16} /> Spotify
                  </a>
                )}
                {dj.music_beatport && (
                  <a href={dj.music_beatport} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#00FF00', color: 'black', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Music size={16} /> Beatport
                  </a>
                )}
                {dj.music_apple && (
                  <a href={dj.music_apple} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#FA243C', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Globe size={16} /> Apple Music
                  </a>
                )}
                {dj.music_youtube && (
                  <a href={dj.music_youtube} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#FF0000', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Globe size={16} /> YouTube
                  </a>
                )}
                {dj.social_instagram && (
                  <a href={dj.social_instagram} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#E1306C', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Globe size={16} /> Instagram
                  </a>
                )}
                {dj.social_facebook && (
                  <a href={dj.social_facebook} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#4267B2', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Globe size={16} /> Facebook
                  </a>
                )}
                {dj.social_x && (
                  <a href={dj.social_x} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#1DA1F2', color: 'white', borderRadius: '2rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                    <Globe size={16} /> X (Twitter)
                  </a>
                )}
              </div>
            </section>
            
            <div style={{ marginTop: '2rem' }}>
              <AdBanner placementName="dj_epk_banner" />
            </div>
            
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .hover-bg-light:hover {
          background-color: rgba(255,255,255,0.1) !important;
        }
        .hover-card-transform:hover {
          transform: translateY(-5px);
          border-color: rgba(255,255,255,0.2) !important;
        }
      `}} />
    </div>
  );
}
