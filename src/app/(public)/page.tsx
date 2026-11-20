import styles from "./page.module.css";
import { createClient, getCachedUser } from "@/utils/supabase/server";
import Link from "next/link";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { Calendar, MapPin } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import HeroSpotlight from "@/components/home/HeroSpotlight";
import StageMontageCanvas from "@/components/home/StageMontageCanvas";
import CanvasIcon from "@/components/ui/CanvasIcon";
import { parseHeroConfig } from "@/types/hero";
import { getUserTicketsData } from "@/utils/userTickets";
import HomeUserStrip from "@/components/home/HomeUserStrip";
import { getUpcomingCutoffIso, isEventToday } from "@/utils/eventTime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const [supabase, user] = await Promise.all([createClient(), getCachedUser()]);

  // Ejecutar TODAS las consultas del Home en un único Promise.all paralelo (0 cascada)
  const [
    userContextRes,
    eventsRes,
    merchRes,
    postsRes,
    principalPostsRes,
    heroSettingsRes,
  ] = await Promise.all([
    user
      ? Promise.all([
          getUserTicketsData({ id: user.id, email: user.email }),
          supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        ])
      : Promise.resolve(null),
    supabase
      .from("events")
      .select("id, title, slug, start_date, location_name, cover_image, description, is_free")
      .eq("status", "published")
      .gte("start_date", getUpcomingCutoffIso())
      .order("start_date", { ascending: true })
      .limit(8),
    supabase
      .from("merch_products")
      .select("id, title, slug, base_price, description, merch_product_images(image_url, is_primary, sort_order)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, is_principal, created_at, categories (name, slug)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("posts")
      .select("id, title, slug, excerpt, cover_image, is_principal, created_at, categories (name, slug)")
      .eq("is_published", true)
      .eq("is_principal", true)
      .limit(1),
    supabase.from("hero_settings").select("*").eq("id", 1).single(),
  ]);

  const attendingEventIds = new Set<string>();
  let userTicketsData = null;
  let userName = "Raver";
  if (user && userContextRes) {
    const [tData, profileRes] = userContextRes;
    userTicketsData = tData;
    userName =
      profileRes.data?.full_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "Raver";
    for (const t of tData.tickets || []) {
      const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
      const ev = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      if (ev?.id) attendingEventIds.add(ev.id);
    }
  }

  const events: any[] | null = eventsRes.data;
  const merch: any[] | null = merchRes.data;
  const posts: any[] | null = postsRes.data;
  const principalPost: any = principalPostsRes.data?.[0];
  const heroSettings = heroSettingsRes.data;

  // Parse Hero Spotlight Multi-Slide configuration
  const heroConfig = parseHeroConfig(heroSettings, {
    events: events || [],
    merch: merch || [],
    posts: principalPost ? [principalPost, ...(posts || [])] : posts || [],
  });

  return (
    <div className={styles.page}>
      
      {/* 1. Hero Spotlight Multi-Slide Carousel */}
      <HeroSpotlight
        slides={heroConfig.slides}
        autoplayMs={heroConfig.autoplayMs}
      />

      <div className={styles.container}>
        <div className={styles.mainLayout}>
          
          {/* COLUMNA IZQUIERDA (Contenido Principal) */}
          <div className={styles.contentColumn}>
            {user && userTicketsData && (
              <HomeUserStrip userName={userName} ticketsData={userTicketsData} />
            )}

            {/* 1. Eventos con icono Canvas Radar */}
            <HorizontalScroll title="Eventos" viewAllLink="/events" canvasIcon="radar">
              {events && events.slice(0, 8).map((event: any) => {
                const isAttending = attendingEventIds.has(event.id);
                const isToday = isEventToday(event.start_date);
                return (
                  <Link href={`/events/${event.slug}`} key={event.id} className={styles.card} style={{ position: 'relative', borderColor: isToday ? 'rgba(229, 9, 20, 0.55)' : undefined }}>
                    {isToday && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          zIndex: 2,
                          backgroundColor: '#E50914',
                          color: '#ffffff',
                          fontSize: '0.62rem',
                          fontWeight: 900,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          boxShadow: '0 0 10px rgba(229, 9, 20, 0.6)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        ● HOY
                      </span>
                    )}
                    {isAttending && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '14px',
                          left: '14px',
                          zIndex: 2,
                          backgroundColor: '#22c55e',
                          color: '#052e16',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.45)',
                        }}
                      >
                        ✓ Asistes
                      </span>
                    )}
                    <img src={event.cover_image || "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400"} alt={event.title} className={styles.cardImage} />
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    <div className={styles.cardSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                      <Calendar size={12} />
                      <span>{new Date(event.start_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className={styles.cardSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem', flex: 1 }}>
                      <MapPin size={12} />
                      <span>{event.location_name || "Colombia"}</span>
                    </div>
                    <span className={styles.cardButton}>{isAttending ? 'Ver Mi Entrada' : (isToday || event.is_free) ? 'Adquirir Entrada' : 'Comprar Tickets'}</span>
                  </Link>
                );
              })}
            </HorizontalScroll>

            {/* Banner Publicidad Delgado (Bajo Eventos) */}
            <AdBanner placementName="home_horizontal_thin" />

            {/* 2. Noticias, Cultura (Blog) con icono Canvas Equalizer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Encabezado del bloque agrupado */}
              <div className={styles.blogHeaderRow}>
                <div className={styles.blogHeaderTitleGroup}>
                  <CanvasIcon variant="equalizer" size={24} />
                  <h2 className={styles.blogHeaderTitle}>Noticias, Cultura</h2>
                </div>
                <Link href="/blog" className={styles.blogHeaderLink}>
                  Ver todo →
                </Link>
              </div>


              {principalPost && (
                <div className={styles.principalHeroContainer}>
                  {/* Left: Image */}
                  <div className={styles.principalHeroImage}>
                    {principalPost.cover_image && (
                      <img 
                        src={principalPost.cover_image}
                        alt={principalPost.title}
                        style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
                      />
                    )}
                  </div>
                  {/* Right: Content */}
                  <div className={styles.principalHeroContent}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', alignItems: 'flex-start' }}>
                      <span className={styles.principalHeroTag}>
                        Noticias, Cultura
                      </span>
                      <h2 className={styles.principalHeroTitle}>
                        {principalPost.title}
                      </h2>
                      <p className={styles.principalHeroExcerpt}>
                        {principalPost.excerpt || (principalPost.content?.replace(/<[^>]+>/g, '').substring(0, 120) + '...')}
                      </p>
                      <div style={{ marginTop: '0.25rem' }}>
                        <Link href={`/blog/${principalPost.slug}`} className={styles.principalHeroButton}>
                          Seguir leyendo
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <HorizontalScroll title="" viewAllLink="">
                {posts && posts.length > 0 ? posts.filter((p: any) => p.id !== principalPost?.id).map((post: any) => (
                  <Link href={`/blog/${post.slug}`} key={post.id} className={styles.card}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', overflow: 'hidden', borderRadius: '6px' }}>
                      <img src={post.cover_image || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400"} alt={post.title} className={styles.cardImage} style={{ position: 'absolute', top: 0, left: 0, height: '100%', marginBottom: 0 }} />
                      {post.categories && (
                        <div className={styles.cardCategoryBadge}>
                          {post.categories.name}
                        </div>
                      )}

                    </div>
                    <h3 className={styles.cardTitle} style={{ marginTop: '0.7rem' }}>{post.title}</h3>
                    <p className={styles.cardSubtitle} style={{ marginTop: '0.35rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                      {post.excerpt}
                    </p>
                    <span className={styles.cardButtonOutline}>Ver Más</span>
                  </Link>
                )) : (
                  <p style={{ color: 'var(--color-text-secondary)', padding: '1rem' }}>No hay noticias publicadas aún.</p>
                )}
              </HorizontalScroll>
            </div>

            {/* 3. Merch con icono Canvas Prism */}
            <HorizontalScroll title="Merch" viewAllLink="/merch" canvasIcon="prism">
              {merch && merch.slice(0, 8).map(product => {
                const primaryImage = product.merch_product_images?.find((img: any) => img.is_primary)?.image_url || product.merch_product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400";
                const priceVal = product.price_cop ?? product.base_price ?? 0;
                return (
                  <Link href={`/merch/${product.slug}`} key={product.id} className={styles.card}>
                    <img src={primaryImage} alt={product.title} className={styles.cardImage} />
                    <h3 className={styles.cardTitle}>{product.title}</h3>
                    <p className={styles.cardSubtitle} style={{ flex: 1 }}>$ {Number(priceVal).toLocaleString('es-CO')}</p>
                    <span className={styles.cardButton}>Comprar</span>
                  </Link>
                );
              })}
            </HorizontalScroll>

            {/* Banner Publicidad Horizontal */}
            <AdBanner placementName="home_horizontal" />

          </div>

          {/* COLUMNA DERECHA (Sidebar) */}
          <div className={styles.sidebarColumn}>
            
            {/* Banner Publicidad Vertical (en móvil se mueve al final del sidebar para no quedar pegado al banner horizontal) */}
            <div className={styles.sidebarAd}>
              <AdBanner placementName="home_sidebar" />
            </div>

            {/* Asesoría, Consultoría y Acompañamiento para crear eventos */}
            <StageMontageCanvas />

            {/* Ravers: Reseña */}
            <div className={styles.raversReviews}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Ravers: Reseñas</h3>
              
              <div className={styles.reviewItem}>
                <p className={styles.reviewText}>"El mejor sonido que he escuchado en años. La energía fue increíble de principio a fin."</p>
                <p className={styles.reviewAuthor}>- @technolover99</p>
              </div>
              
              <div className={styles.reviewItem}>
                <p className={styles.reviewText}>"La organización fue impecable. Sin duda Bassfactory está cambiando la escena."</p>
                <p className={styles.reviewAuthor}>- @camilo_dj</p>
              </div>
            </div>

          </div>
        </div>

        {/* SECCIONES INFERIORES */}
        
        {/* Registro */}
        <div className={styles.registrationBanner}>
          <h2>Únete al Movimiento</h2>
          <p>Regístrate para recibir acceso anticipado a tickets, descuentos en merch y noticias exclusivas.</p>
          <form action="/register" method="GET" className={styles.registrationForm}>
            <input type="email" name="email" placeholder="Tu correo electrónico" className={styles.pillInput} required />
            <button type="submit" className={styles.pillButton}>Registrarse</button>
          </form>
        </div>

      </div>
    </div>
  );
}
