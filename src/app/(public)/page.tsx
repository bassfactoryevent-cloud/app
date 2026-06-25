import styles from "./page.module.css";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { Calendar, MapPin } from "lucide-react";

export const revalidate = 60; // Revalidate every minute

export default async function Home() {
  const supabase = await createClient();

  // Fetch upcoming events
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .gte('start_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(5);

  // Fetch DJs
  const { data: djs } = await supabase
    .from('djs')
    .select('*')
    .limit(10);

  // Fetch Merch
  const { data: merch } = await supabase
    .from('merch_products')
    .select('*')
    .eq('status', 'published')
    .limit(8);

  const heroEvent = events && events.length > 0 ? events[0] : null;
  const upcomingEvents = events && events.length > 1 ? events.slice(1) : [];

  return (
    <div className={styles.page}>
      
      {/* 1. Hero Banner: Next Upcoming Event */}
      <div className={styles.hero}>
        <div className={styles.heroBackground}>
          <img 
            src={heroEvent?.cover_image || "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600&auto=format&fit=crop"} 
            alt="Hero Background" 
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay}></div>
        </div>
        
        <div className={styles.heroContent}>
          <div className={styles.heroDate}>
            {heroEvent?.start_date ? new Date(heroEvent.start_date).toLocaleDateString('es-CO', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Próximamente'}
          </div>
          <h1 className={styles.title}>
            {heroEvent?.title || "Techno Vanguard"}
          </h1>
          <p className={styles.subtitle}>
            {heroEvent?.description || "El evento más inmersivo de la ciudad. Únete a la cultura Bassfactory."}
          </p>

          <div className={styles.actions}>
            {heroEvent ? (
              <>
                <Link href={`/events/${heroEvent.slug}`} className={styles.btnPrimary}>
                  Conseguir Entradas
                </Link>
                <Link href={`/events/${heroEvent.slug}#lineup`} className={styles.btnSecondary}>
                  Ver Lineup
                </Link>
              </>
            ) : (
              <Link href="/events" className={styles.btnPrimary}>
                Explorar Eventos
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        {/* 2. Próximos Eventos */}
        {upcomingEvents.length > 0 && (
          <HorizontalScroll title="Próximos Eventos" viewAllLink="/events">
            {upcomingEvents.map(event => (
              <Link href={`/events/${event.slug}`} key={event.id} className={styles.card}>
                <img src={event.cover_image || "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400"} alt={event.title} className={styles.cardImage} />
                <h3 className={styles.cardTitle}>{event.title}</h3>
                <div className={styles.cardSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <Calendar size={14} />
                  <span>{new Date(event.start_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</span>
                </div>
                <div className={styles.cardSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={14} />
                  <span>{event.location_name}</span>
                </div>
              </Link>
            ))}
          </HorizontalScroll>
        )}

        {/* 3. DJs / Lineup Base */}
        {djs && djs.length > 0 && (
          <HorizontalScroll title="Artistas Destacados" subtitle="Talento de la casa y residentes" viewAllLink="/djs">
            {djs.map(dj => (
              <Link href={`/djs/${dj.slug || dj.id}`} key={dj.id} className={styles.djCard}>
                <img src={dj.image_url || "https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=300"} alt={dj.stage_name} className={styles.djImage} />
                <h3 className={styles.cardTitle}>{dj.stage_name}</h3>
                <span className={styles.cardSubtitle}>DJ / Producer</span>
              </Link>
            ))}
          </HorizontalScroll>
        )}

        {/* 4. Merch Oficial */}
        {merch && merch.length > 0 && (
          <HorizontalScroll title="Merch Oficial" subtitle="Vístete para la rave" viewAllLink="/merch">
            {merch.map(product => (
              <Link href={`/merch/${product.slug}`} key={product.id} className={styles.card}>
                {/* No hay images directas en product, requeriría un join con merch_product_images, usaremos placeholder si no hay */}
                <img src={"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400"} alt={product.title} className={styles.cardImage} />
                <h3 className={styles.cardTitle}>{product.title}</h3>
                <p className={styles.cardSubtitle}>$ {Number(product.base_price).toLocaleString('es-CO')}</p>
              </Link>
            ))}
          </HorizontalScroll>
        )}
      </div>

    </div>
  );
}
