import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import AdBanner from "@/components/AdBanner";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import {
  ShieldCheck,
  QrCode,
  CreditCard,
  ShoppingBag,
} from "lucide-react";
import styles from "./Events.module.css";
import { getUserTicketsData } from "@/utils/userTickets";
import EventsGridClient from "./EventsGridClient";

export const metadata = {
  title: "Eventos | Bassfactory",
  description:
    "Fechas confirmadas y boletería oficial Bassfactory con QR antifraude.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage() {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const attendingEventIds: string[] = [];
  const meta = user?.user_metadata || {};
  const favoriteGenres: string[] = Array.isArray(meta.favorite_genres)
    ? meta.favorite_genres
    : [];
  const followedDjs: string[] = Array.isArray(meta.followed_djs)
    ? meta.followed_djs
    : [];

  if (user) {
    const tData = await getUserTicketsData({ id: user.id, email: user.email });
    for (const t of tData.tickets || []) {
      const tier = Array.isArray(t.ticket_tiers) ? t.ticket_tiers[0] : t.ticket_tiers;
      const ev = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
      if (ev?.id && !attendingEventIds.includes(ev.id)) {
        attendingEventIds.push(ev.id);
      }
    }
  }

  const [eventsRes, merchRes, sponsorsRes, adsRes] = await Promise.all([
    supabase
      .from("events")
      .select("*, ticket_tiers(*), event_djs(dj_id)")
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
      .order("name", { ascending: true }),
    supabase
      .from("ads")
      .select(`
        id,
        ad_placements!inner(name, is_active),
        ad_campaigns!inner(is_active, end_date)
      `)
      .eq("is_active", true)
      .eq("ad_campaigns.is_active", true)
      .eq("ad_placements.is_active", true)
      .in("ad_placements.name", ["events_vertical_left", "events_vertical_right"]),
  ]);

  const allEvents = eventsRes.data || [];
  const merchProducts = merchRes.data || [];
  const sponsors = sponsorsRes.data || [];

  const now = new Date();
  const hasLeftAd = (adsRes.data || []).some((a: any) => {
    const pName = Array.isArray(a.ad_placements)
      ? a.ad_placements[0]?.name
      : a.ad_placements?.name;
    const campaign = Array.isArray(a.ad_campaigns)
      ? a.ad_campaigns[0]
      : a.ad_campaigns;
    return (
      pName === "events_vertical_left" &&
      (!campaign?.end_date || new Date(campaign.end_date) >= now)
    );
  });

  const hasRightAd = (adsRes.data || []).some((a: any) => {
    const pName = Array.isArray(a.ad_placements)
      ? a.ad_placements[0]?.name
      : a.ad_placements?.name;
    const campaign = Array.isArray(a.ad_campaigns)
      ? a.ad_campaigns[0]
      : a.ad_campaigns;
    return (
      pName === "events_vertical_right" &&
      (!campaign?.end_date || new Date(campaign.end_date) >= now)
    );
  });

  const gridClass =
    hasLeftAd && hasRightAd
      ? styles.mainGridBoth
      : hasLeftAd
      ? styles.mainGridLeftOnly
      : hasRightAd
      ? styles.mainGridRightOnly
      : styles.mainGridNoAds;

  return (
    <div className={styles.eventsContainer}>
      {/* COMPACT HERO HEADER (Home Scale + Short Copy) */}
      <header className={styles.heroSection}>
        <div className={styles.heroTopRow}>
          <div>
            <h1 className={styles.heroTitle}>Eventos</h1>
            <p className={styles.heroSubtitle}>
              Fechas confirmadas y boletería oficial.
            </p>
          </div>

          <div className={styles.guaranteesBar}>
            <div className={styles.guaranteeItem}>
              <ShieldCheck size={14} className={styles.guaranteeIcon} />
              <span>Entradas oficiales</span>
            </div>
            <div className={styles.guaranteeItem}>
              <QrCode size={14} className={styles.guaranteeIcon} />
              <span>QR antifraude</span>
            </div>
            <div className={styles.guaranteeItem}>
              <CreditCard size={14} className={styles.guaranteeIcon} />
              <span>Pagos con Bold</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN GRID + OPTIONAL SIDEBAR ADS */}
      <div className={gridClass}>
        {hasLeftAd && (
          <aside className={styles.sidebarCol}>
            <AdBanner placementName="events_vertical_left" />
          </aside>
        )}

        <main className={styles.eventsCol}>
          {hasLeftAd && (
            <div className={styles.mobileAdSlot}>
              <AdBanner placementName="events_vertical_left" />
            </div>
          )}

          <EventsGridClient
            events={allEvents}
            attendingEventIds={attendingEventIds}
            favoriteGenres={favoriteGenres}
            followedDjs={followedDjs}
            isLoggedIn={Boolean(user)}
          />

          {hasRightAd && (
            <div className={styles.mobileAdSlot} style={{ marginTop: "1.25rem" }}>
              <AdBanner placementName="events_vertical_right" />
            </div>
          )}
        </main>

        {hasRightAd && (
          <aside className={styles.sidebarCol}>
            <AdBanner placementName="events_vertical_right" />
          </aside>
        )}
      </div>

      {/* MERCH OFICIAL */}
      {merchProducts.length > 0 && (
        <section className={styles.merchSection}>
          <HorizontalScroll
            title="Merch Oficial"
            viewAllLink="/merch"
            canvasIcon="prism"
          >
            {merchProducts.map((product: any) => {
              const images = product.merch_product_images || [];
              const primaryImage =
                images.find((img: any) => img.is_primary)?.image_url ||
                images[0]?.image_url;

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
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          height: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: 0.3,
                        }}
                      >
                        <ShoppingBag size={36} />
                      </div>
                    )}
                  </div>

                  <div className={styles.merchBody}>
                    <span className={styles.merchCategory}>
                      {product.merch_categories?.name || "Merch"}
                    </span>
                    <h4 className={styles.merchTitle}>{product.title}</h4>
                    <span className={styles.merchPrice}>
                      ${Number(product.base_price || 0).toLocaleString("es-CO")}
                    </span>
                  </div>
                </Link>
              );
            })}
          </HorizontalScroll>
        </section>
      )}

      {/* ALIADOS */}
      {sponsors.length > 0 && (
        <section className={styles.sponsorsSection}>
          <div className={styles.sponsorsHeader}>
            <h3 className={styles.sponsorsTitle}>Aliados</h3>
          </div>

          <div className={styles.sponsorsGrid}>
            {sponsors.map((s: any) => {
              const hasLink = Boolean(s.website_url);
              const CardTag = hasLink ? "a" : "div";
              const linkProps = hasLink
                ? { href: s.website_url, target: "_blank", rel: "noopener noreferrer" }
                : {};

              return (
                <CardTag key={s.id} {...linkProps} className={styles.sponsorCard}>
                  {s.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo_url} alt={s.name} className={styles.sponsorLogo} />
                  ) : (
                    <span className={styles.sponsorNameFallback}>{s.name}</span>
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
