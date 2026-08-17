import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Mail, Phone, Download, Music, Globe } from "lucide-react";
import AdBanner from "@/components/AdBanner";

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
      bookings (
        performance_time,
        events (id, title, slug, location_name, status, start_date)
      )
    `)
    .eq("slug", (await params).slug)
    .single();

  if (!dj || dj.type !== 'colectivo') {
    notFound();
  }

  // Sort bookings (upcoming first)
  const bookings = dj.bookings?.filter((b: any) => b.events && b.events.status !== 'cancelled').sort((a: any, b: any) => new Date(a.performance_time).getTime() - new Date(b.performance_time).getTime()) || [];

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
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ fontSize: '4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1, margin: 0, color: 'white' }}>
              {dj.name}
            </h1>
            {dj.bio_short && (
              <p style={{ fontSize: '1.25rem', color: 'var(--color-magenta)', fontWeight: 600, maxWidth: '600px', margin: 0 }}>
                {dj.bio_short}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem', display: 'grid', gridTemplateColumns: '1fr', gap: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
          
          {/* COLUMNA IZQUIERDA: BIO Y FOTOS */}
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

            {bookings.length > 0 && (
              <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Upcoming Events</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {bookings.map((booking: any, idx: number) => {
                    const evt = booking.events;
                    return (
                      <Link key={idx} href={`/events/${evt.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }} className="booking-card">
                        <div>
                          <p style={{ fontSize: '0.875rem', color: 'var(--color-magenta)', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {new Date(booking.performance_time).toLocaleString('es-CO')}
                          </p>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{evt.title}</h4>
                          <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '0.25rem' }}>{evt.location_name}</p>
                        </div>
                        <ChevronRight size={24} style={{ opacity: 0.5 }} />
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <AdBanner placementName="dj_epk_banner" />
            </div>
          </div>

          {/* COLUMNA DERECHA: BOOKING, MUSIC, SOCIAL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* BOOKING / CONTACTO */}
            <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', color: 'var(--color-magenta)' }}>Booking & Contact</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dj.contact_email && (
                  <a href={`mailto:${dj.contact_email}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'inherit', textDecoration: 'none', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
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
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .booking-card:hover {
          background-color: rgba(255,255,255,0.05) !important;
        }
      `}} />
    </div>
  );
}
