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
    .limit(8);

  // Fetch DJs
  const { data: djs } = await supabase
    .from('djs')
    .select('*')
    .limit(10);

  // Fetch Merch
  const { data: merch } = await supabase
    .from('merch_products')
    .select('*, merch_product_images(image_url, is_primary, sort_order)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch Blog Posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch Hero Settings
  const { data: heroSettings } = await supabase
    .from('hero_settings')
    .select('*')
    .eq('id', 1)
    .single();

  // (Optional fallback) Fetch upcoming events in case we want to use the first event as a fallback
  const heroEvent = events && events.length > 0 ? events[0] : null;

  const subtitle = heroSettings?.subtitle || "El ecosistema definitivo de la cultura electrónica en tu ciudad.";
  const tags = heroSettings?.tags || [];
  const titleHtml = heroSettings?.title || "MÚSICA<br/>Cultura<br/>Movimiento";

  let bgMediaUrl = heroSettings?.media_url || heroEvent?.cover_image || "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600&auto=format&fit=crop";
  let isVideoEmbed = false;
  let renderAsVideo = heroSettings?.media_type === "video";

  if (bgMediaUrl.includes("vimeo.com")) {
    isVideoEmbed = true;
    renderAsVideo = true;
    const vimeoId = bgMediaUrl.split("vimeo.com/")[1]?.split("?")[0];
    bgMediaUrl = `https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0`;
  } else if (bgMediaUrl.includes("youtube.com") || bgMediaUrl.includes("youtu.be")) {
    isVideoEmbed = true;
    renderAsVideo = true;
    let ytId = "";
    if (bgMediaUrl.includes("youtu.be")) {
      ytId = bgMediaUrl.split("youtu.be/")[1]?.split("?")[0];
    } else {
      ytId = bgMediaUrl.split("v=")[1]?.split("&")[0];
    }
    bgMediaUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&showinfo=0`;
  }

  return (
    <div className={styles.page}>
      
      {/* 1. Hero Banner: Next Upcoming Event or Dynamic Banner */}
      <div className={styles.hero}>
        <div className={styles.heroBackground}>
          {renderAsVideo ? (
            isVideoEmbed ? (
              <iframe
                src={bgMediaUrl}
                className={styles.heroVideo}
                style={{ width: '100vw', height: '56.25vw', minHeight: '100%', minWidth: '177.77vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', border: 'none' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <video 
                src={bgMediaUrl} 
                autoPlay 
                loop 
                muted 
                playsInline
                className={styles.heroVideo}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )
          ) : (
            <img 
              src={bgMediaUrl} 
              alt="Hero Background" 
              className={styles.heroImage}
            />
          )}
          <div className={styles.heroOverlay}></div>
        </div>
        
        <div className={styles.heroContent}>
          {/* Tags */}
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {tags.map((tag: any, i: number) => tag.url ? (
                <Link key={i} href={tag.url} style={{ padding: '0.25rem 1rem', backgroundColor: 'var(--color-magenta)', color: 'white', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
                  {tag.text}
                </Link>
              ) : (
                <span key={i} style={{ padding: '0.25rem 1rem', backgroundColor: 'var(--color-magenta)', color: 'white', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600 }}>
                  {tag.text}
                </span>
              ))}
            </div>
          )}

          <h1 className={styles.title} dangerouslySetInnerHTML={{ __html: titleHtml }} />
          <p className={styles.subtitle}>
            {subtitle}
          </p>

          <div className={styles.actions}>
            {(heroSettings?.primary_button_text && heroSettings?.primary_button_url) ? (
              <Link href={heroSettings.primary_button_url} className={styles.btnPrimary}>
                {heroSettings.primary_button_text}
              </Link>
            ) : null}
            
            {(heroSettings?.secondary_button_text && heroSettings?.secondary_button_url) ? (
              <Link href={heroSettings.secondary_button_url} className={styles.btnSecondary} style={{ padding: '0.875rem 2rem', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '100px', fontWeight: 600, textDecoration: 'none', backdropFilter: 'blur(10px)' }}>
                {heroSettings.secondary_button_text}
              </Link>
            ) : null}

            {/* Fallback original button if no settings exist */}
            {!heroSettings?.primary_button_text && (
              <Link href="/events" className={styles.btnPrimary}>
                Ver Eventos
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.mainLayout}>
          
          {/* COLUMNA IZQUIERDA (Contenido Principal) */}
          <div className={styles.contentColumn}>
            
            {/* 1. Eventos */}
            <HorizontalScroll title="Eventos">
              {events && events.slice(0, 8).map(event => (
                <Link href={`/events/${event.slug}`} key={event.id} className={styles.card}>
                  <img src={event.cover_image || "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400"} alt={event.title} className={styles.cardImage} />
                  <h3 className={styles.cardTitle}>{event.title}</h3>
                  <div className={styles.cardSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                    <Calendar size={14} />
                    <span>{new Date(event.start_date).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className={styles.cardSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', flex: 1 }}>
                    <MapPin size={14} />
                    <span>{event.location_name}</span>
                  </div>
                  <span className={styles.cardButton}>Comprar Boletas</span>
                </Link>
              ))}
            </HorizontalScroll>

            {/* 2. Noticias, Cultura (Blog) */}
            <HorizontalScroll title="Noticias, Cultura">
              {posts && posts.length > 0 ? posts.map(post => (
                <Link href={`/blog/${post.slug}`} key={post.id} className={styles.card}>
                  <img src={post.cover_image || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400"} alt={post.title} className={styles.cardImage} />
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  <p className={styles.cardSubtitle} style={{ marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                    {post.excerpt}
                  </p>
                  <span className={styles.cardButtonOutline}>Ver Más</span>
                </Link>
              )) : (
                <p style={{ color: 'var(--color-text-secondary)', padding: '1rem' }}>No hay noticias publicadas aún.</p>
              )}
            </HorizontalScroll>

            {/* 3. Merch */}
            <HorizontalScroll title="Merch">
              {merch && merch.slice(0, 8).map(product => {
                const primaryImage = product.merch_product_images?.find((img: any) => img.is_primary)?.image_url || product.merch_product_images?.[0]?.image_url || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400";
                return (
                  <Link href={`/merch/${product.slug}`} key={product.id} className={styles.card}>
                    <img src={primaryImage} alt={product.title} className={styles.cardImage} />
                    <h3 className={styles.cardTitle}>{product.title}</h3>
                    <p className={styles.cardSubtitle} style={{ flex: 1 }}>$ {Number(product.base_price).toLocaleString('es-CO')}</p>
                    <span className={styles.cardButton}>Comprar</span>
                  </Link>
                );
              })}
            </HorizontalScroll>

          </div>

          {/* COLUMNA DERECHA (Sidebar) */}
          <div className={styles.sidebarColumn}>
            
            {/* Banner Publicidad Vertical */}
            <div className={styles.adBannerVertical}>
              Banner<br/>Publicidad
            </div>

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
        
        {/* Banner Publicidad Horizontal */}
        <div className={styles.adBannerHorizontal}>
          Publicidad
        </div>

        {/* Registro */}
        <div className={styles.registrationBanner}>
          <h2>Únete al Movimiento</h2>
          <p>Regístrate para recibir acceso anticipado a tickets, descuentos en merch y noticias exclusivas.</p>
          <form className={styles.registrationForm}>
            <input type="email" placeholder="Tu correo electrónico" className={styles.pillInput} required />
            <button type="button" className={styles.pillButton}>Registrarse</button>
          </form>
        </div>

      </div>
    </div>
  );
}
