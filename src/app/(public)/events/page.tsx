import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import VerticalAdSlot from "@/components/VerticalAdSlot";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import { Calendar, MapPin, ArrowRight, ShieldCheck, Sparkles, QrCode, CreditCard, ShoppingBag, ExternalLink } from "lucide-react";
import styles from "./Events.module.css";

export const metadata = {
  title: "Cartelera Oficial de Eventos | Bassfactory",
  description: "Reserva tus entradas oficiales para los mejores festivales, shows y raves de música electrónica en Colombia. Boletería 100% garantizada con QR dinámico.",
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = await createClient();
  
  // Fecha de ayer para mantener el evento visible durante el mismo día que ocurre
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // Fetch en paralelo: eventos, productos de merch y patrocinadores oficiales
  const [eventsRes, merchRes, sponsorsRes] = await Promise.all([
    supabase
      .from("events")
      .select("*, ticket_tiers(*)")
      .in("status", ["published", "postponed", "cancelled"])
      .order("start_date", { ascending: true }),
    supabase
      .from("merch_products")
      .select(`
        id,
        title,
        slug,
        base_price,
        merch_categories(name),
        merch_product_images(image_url, is_primary, sort_order)
      `)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("sponsors")
      .select("id, name, logo_url, website_url")
      .order("name", { ascending: true })
  ]);

  // Filtrar eventos pasados
  const events = (eventsRes.data || []).filter(e => {
    if (e.status === "postponed" || e.status === "cancelled") return true;
    if (e.status === "published") {
      const now = new Date();
      if (e.end_date) {
        return new Date(e.end_date) >= now;
      }
      if (e.start_date) {
        return new Date(e.start_date) >= yesterday;
      }
      return true;
    }
    return false;
  });

  const merchProducts = merchRes.data || [];
  const sponsors = sponsorsRes.data || [];

  return (
    <div className={styles.eventsContainer}>
      
      {/* 1. HERO ACTIVATION SECTION */}
      <header className={styles.heroSection}>
        <div className={styles.heroBadge}>
          <Sparkles size={14} />
          Cartelera Oficial & Taquilla Verificada
        </div>
        <h1 className={styles.heroTitle}>
          Próximos <span className={styles.heroTitleGradient}>Eventos</span>
        </h1>
        <p className={styles.heroSubtitle}>
          El epicentro de los mejores festivales, clubs y raves de música electrónica. Reserva tus entradas oficiales con seguridad garantizada y activación de QR dinámico.
        </p>

        <div className={styles.guaranteesBar}>
          <div className={styles.guaranteeItem}>
            <ShieldCheck size={16} className={styles.guaranteeIcon} />
            <span>Boletería 100% Original</span>
          </div>
          <div className={styles.guaranteeItem}>
            <QrCode size={16} className={styles.guaranteeIcon} />
            <span>QR Dinámico Anti-Clonación</span>
          </div>
          <div className={styles.guaranteeItem}>
            <CreditCard size={16} className={styles.guaranteeIcon} />
            <span>Pagos Seguros con Bold</span>
          </div>
        </div>
      </header>

      {/* 2. 3-COLUMN MAIN LAYOUT: BANNER IZQUIERDO | EVENTOS | BANNER DERECHO */}
      <div className={styles.mainGrid}>
        
        {/* COLUMNA IZQUIERDA: BANNER VERTICAL */}
        <aside className={styles.sidebarCol}>
          <VerticalAdSlot 
            placementName="events_vertical_left" 
            label="Banner Lateral Izquierdo" 
          />
        </aside>

        {/* COLUMNA CENTRAL: CARTELERA DE EVENTOS */}
        <main className={styles.eventsCol}>
          {(!events || events.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1.25rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <Calendar size={56} opacity={0.25} style={{ margin: '0 auto 1.5rem', color: 'var(--color-magenta)' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>No hay eventos programados en este momento</h3>
              <p style={{ opacity: 0.6, maxWidth: '450px', margin: '0 auto' }}>Estamos preparando las próximas fechas. Síguenos en nuestras redes oficiales para los anuncios en primicia.</p>
            </div>
          ) : (
            <div className={styles.eventsGrid}>
              {events.map(event => {
                const date = event.start_date ? new Date(event.start_date) : null;
                const minPrice = event.ticket_tiers && event.ticket_tiers.length > 0 
                  ? Math.min(...event.ticket_tiers.map((t: any) => parseFloat(t.price))) 
                  : 0;

                return (
                  <Link 
                    href={`/events/${event.slug}`} 
                    key={event.id} 
                    className={styles.eventCard}
                  >
                    <div className={styles.imageWrapper}>
                      {event.cover_image ? (
                        <img 
                          src={event.cover_image} 
                          alt={event.title} 
                          className={styles.coverImage} 
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', opacity: 0.2 }}>
                          <Calendar size={64} />
                        </div>
                      )}

                      {date && (
                        <div className={styles.dateBadge}>
                          <div className={styles.dateMonth}>
                            {date.toLocaleDateString('es-ES', { month: 'short' })}
                          </div>
                          <div className={styles.dateDay}>
                            {date.getDate()}
                          </div>
                        </div>
                      )}

                      {event.status === 'postponed' && (
                        <div className={`${styles.statusBadge} ${styles.statusPostponed}`}>
                          Aplazado
                        </div>
                      )}
                      {event.status === 'cancelled' && (
                        <div className={`${styles.statusBadge} ${styles.statusCancelled}`}>
                          Cancelado
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.cardBody}>
                      <h3 className={styles.eventTitle}>{event.title}</h3>
                      
                      <div className={styles.locationRow}>
                        <MapPin size={15} style={{ color: 'var(--color-magenta)', flexShrink: 0 }} />
                        <span>{event.location_name || 'Locación por confirmar'}</span>
                      </div>

                      <div className={styles.cardFooter}>
                        <div>
                          {event.is_free ? (
                            <span className={styles.priceFree}>Entrada Libre</span>
                          ) : (
                            <span className={styles.priceTag}>
                              {minPrice > 0 ? `Desde $${minPrice.toLocaleString('es-CO')}` : 'Boletas Disponibles'}
                            </span>
                          )}
                        </div>
                        <div className={styles.ctaLink}>
                          Ver boletas <ArrowRight size={15} />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>

        {/* COLUMNA DERECHA: BANNER VERTICAL */}
        <aside className={styles.sidebarCol}>
          <VerticalAdSlot 
            placementName="events_vertical_right" 
            label="Banner Lateral Derecho" 
          />
        </aside>

      </div>

      {/* 3. MERCH OFICIAL CAROUSEL */}
      {merchProducts.length > 0 && (
        <section className={styles.merchSection}>
          <HorizontalScroll 
            title="Merch Oficial & Drops" 
            subtitle="Prendas exclusivas, accesorios y cultura del movimiento Bassfactory."
            viewAllLink="/merch"
          >
            {merchProducts.map((product: any) => {
              const images = product.merch_product_images || [];
              const primaryImage = images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url;

              return (
                <Link 
                  key={product.id} 
                  href={`/merch/${product.slug}`} 
                  className={styles.merchCard}
                >
                  <div className={styles.merchImgWrap}>
                    {primaryImage ? (
                      <Image 
                        src={primaryImage} 
                        alt={product.title} 
                        fill 
                        style={{ objectFit: 'cover' }} 
                      />
                    ) : (
                      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                        <ShoppingBag size={48} />
                      </div>
                    )}
                    <span className={styles.merchBadge}>Oficial</span>
                  </div>

                  <div className={styles.merchBody}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {product.merch_categories?.name || 'Tienda'}
                    </span>
                    <h4 className={styles.merchTitle}>{product.title}</h4>
                    <span className={styles.merchPrice}>
                      ${Number(product.base_price || 0).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </Link>
              );
            })}
          </HorizontalScroll>
        </section>
      )}

      {/* 4. PATROCINADORES OFICIALES (SPONSORS) */}
      {sponsors.length > 0 && (
        <section className={styles.sponsorsSection}>
          <div className={styles.sponsorsHeader}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-magenta)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              <Sparkles size={13} />
              Alianzas Oficiales
            </div>
            <h3 className={styles.sponsorsTitle}>Patrocinadores & Marcas Aliadas</h3>
            <p className={styles.sponsorsSubtitle}>
              Marcas y proyectos que impulsan la cultura y el crecimiento de la escena electrónica en Colombia.
            </p>
          </div>

          <div className={styles.sponsorsGrid}>
            {sponsors.map((s: any) => {
              const hasLink = Boolean(s.website_url);
              const CardTag = hasLink ? 'a' : 'div';
              const linkProps = hasLink ? { href: s.website_url, target: '_blank', rel: 'noopener noreferrer' } : {};

              return (
                <CardTag 
                  key={s.id} 
                  {...linkProps}
                  className={styles.sponsorCard}
                >
                  {s.logo_url ? (
                    <img 
                      src={s.logo_url} 
                      alt={s.name} 
                      className={styles.sponsorLogo} 
                    />
                  ) : (
                    <span className={styles.sponsorNameFallback}>
                      {s.name}
                    </span>
                  )}
                  {hasLink && (
                    <ExternalLink size={12} style={{ marginLeft: '0.5rem', opacity: 0.4 }} />
                  )}
                </CardTag>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}
