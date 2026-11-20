import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import AdBanner from "@/components/AdBanner";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import homeStyles from "@/app/(public)/page.module.css";
import { getUpcomingCutoffIso, isEventToday } from "@/utils/eventTime";
import styles from "./Djs.module.css";
import DjsGridClient from "./DjsGridClient";

export const metadata = {
  title: "Artistas & DJs | Bassfactory",
  description: "Roster oficial y booking de Bassfactory.",
};

export const dynamic = "force-dynamic";

export default async function PublicDjsPage() {
  const supabase = await createClient();

  const [djsRes, eventsRes] = await Promise.all([
    supabase
      .from("djs")
      .select("*")
      .eq("type", "colectivo")
      .order("name", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, slug, start_date, location_name, cover_image")
      .eq("status", "published")
      .gte("start_date", getUpcomingCutoffIso())
      .order("start_date", { ascending: true })
      .limit(8),
  ]);

  const djs = djsRes.data || [];
  const upcomingEvents = eventsRes.data || [];

  return (
    <div className={styles.djsContainer}>
      {/* 1. Artists Header + Genre Filters + Grid */}
      <DjsGridClient djs={djs} />

      {/* 2. Upcoming Events Strip (Home Scale, includes today's event first!) */}
      {upcomingEvents.length > 0 && (
        <section className={styles.eventsSection}>
          <HorizontalScroll
            title="Próximos Eventos"
            viewAllLink="/events"
            canvasIcon="radar"
          >
            {upcomingEvents.map((event: any) => {
              const isToday = isEventToday(event.start_date);
              return (
                <Link
                  href={`/events/${event.slug}`}
                  key={event.id}
                  className={homeStyles.card}
                  style={{
                    position: "relative",
                    borderColor: isToday ? "rgba(229, 9, 20, 0.55)" : undefined,
                  }}
                >
                  {isToday && (
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        zIndex: 2,
                        backgroundColor: "#E50914",
                        color: "#ffffff",
                        fontSize: "0.62rem",
                        fontWeight: 900,
                        padding: "2px 7px",
                        borderRadius: "999px",
                        boxShadow: "0 0 10px rgba(229, 9, 20, 0.6)",
                      }}
                    >
                      ● HOY
                    </span>
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      event.cover_image ||
                      "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400"
                    }
                    alt={event.title}
                    className={homeStyles.cardImage}
                  />
                  <h3 className={homeStyles.cardTitle}>{event.title}</h3>
                  <div
                    className={homeStyles.cardSubtitle}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      marginTop: "0.35rem",
                    }}
                  >
                    <Calendar size={12} />
                    <span>
                      {isToday
                        ? "HOY"
                        : new Date(event.start_date).toLocaleDateString("es-CO", {
                            month: "short",
                            day: "numeric",
                          })}
                    </span>
                  </div>
                  <div
                    className={homeStyles.cardSubtitle}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      marginTop: "0.2rem",
                      flex: 1,
                    }}
                  >
                    <MapPin size={12} />
                    <span>{event.location_name || "Colombia"}</span>
                  </div>
                  <span className={homeStyles.cardButton}>
                    {isToday || event.is_free ? "Adquirir Entrada" : "Comprar Tickets"}
                  </span>
                </Link>
              );
            })}
          </HorizontalScroll>
        </section>
      )}

      {/* 3. Compact Booking CTA */}
      <section className={styles.bookingCta}>
        <div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "white" }}>
            ¿Quieres bookear un artista o producir un evento?
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-secondary)",
              marginTop: "2px",
            }}
          >
            Cotiza fechas disponibles, riders técnicos y producción completa.
          </div>
        </div>
        <Link href="/produccion" className={styles.bookingCtaBtn}>
          Solicitar Booking <ArrowRight size={14} />
        </Link>
      </section>

      {/* 4. Ad Banner placed last at the bottom */}
      <div className={styles.adWrap}>
        <AdBanner placementName="djs_banner" />
      </div>
    </div>
  );
}
