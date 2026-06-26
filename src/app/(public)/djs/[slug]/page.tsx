import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Download, Music } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: dj } = await supabase.from("djs").select("stage_name").eq("slug", (await params).slug).single();
  
  if (!dj) return { title: "DJ no encontrado - Bassfactory" };
  return { title: `${dj.stage_name} - Bassfactory Artists` };
}

export default async function PublicDjPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();

  const { data: dj } = await supabase
    .from("djs")
    .select(`
      *,
      dj_media (media_type, url),
      bookings (
        performance_time,
        events (id, name, slug, location, date, status)
      )
    `)
    .eq("slug", (await params).slug)
    .single();

  if (!dj) notFound();

  // Sort bookings (upcoming first)
  const bookings = dj.bookings?.filter((b: any) => b.events && b.events.status !== 'cancelled').sort((a: any, b: any) => new Date(a.performance_time).getTime() - new Date(b.performance_time).getTime()) || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
      
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.875rem', opacity: 0.7 }}>
        <Link href="/djs" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={14} /> Volver a DJs
        </Link>
        <span><ChevronRight size={14} /></span>
        <span style={{ color: 'var(--color-magenta)' }}>{dj.stage_name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4rem', alignItems: 'start' }}>
        
        {/* Columna Izquierda (Foto y Presskit) */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4/5', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
            {dj.image_url ? (
              <Image src={dj.image_url} alt={dj.stage_name} fill style={{ objectFit: 'cover' }} priority />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Music size={64} />
              </div>
            )}
          </div>
          
          {dj.presskit_pdf && (
            <a href={dj.presskit_pdf} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none', borderRadius: '0.5rem', fontWeight: 600, transition: 'background-color 0.2s' }}>
              <Download size={20} />
              Descargar Presskit
            </a>
          )}
        </div>

        {/* Columna Derecha (Bio y Eventos) */}
        <div>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '2rem', lineHeight: 1.1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {dj.stage_name}
          </h1>

          <div style={{ marginBottom: '4rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--color-magenta)' }}>Biografía</h3>
            <div 
              style={{ opacity: 0.8, lineHeight: 1.6, fontSize: '1.1rem' }}
              dangerouslySetInnerHTML={{ __html: dj.bio || '<p>Biografía no disponible aún.</p>' }} 
            />
          </div>

          {bookings.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Próximos Eventos</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.map((booking: any, idx: number) => {
                  const evt = booking.events;
                  return (
                    <Link key={idx} href={`/events/${evt.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }} className="booking-card">
                      <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-magenta)', fontWeight: 700, marginBottom: '0.25rem' }}>
                          {new Date(booking.performance_time).toLocaleString('es-CO')}
                        </p>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{evt.name}</h4>
                        <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '0.25rem' }}>{evt.location}</p>
                      </div>
                      <ChevronRight size={24} style={{ opacity: 0.5 }} />
                    </Link>
                  )
                })}
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                .booking-card:hover {
                  background-color: rgba(255,255,255,0.05) !important;
                }
              `}} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
