"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar, MapPin, ArrowRight, Search, X } from "lucide-react";
import styles from "./Events.module.css";

interface EventsGridClientProps {
  events: any[];
  attendingEventIds: string[];
  favoriteGenres: string[];
  followedDjs: string[];
  isLoggedIn: boolean;
}

export default function EventsGridClient({
  events,
  attendingEventIds,
  favoriteGenres,
  followedDjs,
  isLoggedIn,
}: EventsGridClientProps) {
  const [filterTab, setFilterTab] = useState<"upcoming" | "attending" | "for_you" | "all">(
    "upcoming"
  );
  const [search, setSearch] = useState("");

  const attendingSet = useMemo(() => new Set(attendingEventIds), [attendingEventIds]);

  const isForYou = (ev: any) => {
    const evDjs = Array.isArray(ev.event_djs)
      ? ev.event_djs.map((d: any) => d.dj_id)
      : [];
    const djMatch = followedDjs.some((id) => evDjs.includes(id));
    const haystack = `${ev.title || ""} ${ev.description || ""}`.toLowerCase();
    const genreMatch = favoriteGenres.some((g) => haystack.includes(g.toLowerCase()));
    return djMatch || genreMatch;
  };

  const yesterdayMs = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getTime();
  }, []);

  const upcomingEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.status === "cancelled") return false;
      if (e.status === "postponed") return true;
      const refDate = e.end_date || e.start_date;
      if (!refDate) return true;
      return new Date(refDate).getTime() >= yesterdayMs;
    });
  }, [events, yesterdayMs]);

  const filteredEvents = useMemo(() => {
    let base =
      filterTab === "upcoming"
        ? upcomingEvents
        : filterTab === "attending"
        ? upcomingEvents.filter((e) => attendingSet.has(e.id))
        : filterTab === "for_you"
        ? upcomingEvents.filter((e) => isForYou(e))
        : events;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      base = base.filter(
        (e) =>
          (e.title || "").toLowerCase().includes(q) ||
          (e.location_name || "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [filterTab, upcomingEvents, events, search, attendingSet, favoriteGenres, followedDjs]);

  const forYouCount = useMemo(
    () => upcomingEvents.filter((e) => isForYou(e)).length,
    [upcomingEvents, favoriteGenres, followedDjs]
  );

  const attendingCount = useMemo(
    () => upcomingEvents.filter((e) => attendingSet.has(e.id)).length,
    [upcomingEvents, attendingSet]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Compact Filter & Search Strip */}
      <div className={styles.filterBar}>
        <div className={styles.filterPills}>
          <button
            type="button"
            onClick={() => setFilterTab("upcoming")}
            className={`${styles.filterPill} ${filterTab === "upcoming" ? styles.filterPillActive : ""}`}
          >
            Próximos ({upcomingEvents.length})
          </button>

          {isLoggedIn && attendingCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab("attending")}
              className={`${styles.filterPill} ${filterTab === "attending" ? styles.filterPillActive : ""}`}
            >
              Asistes ({attendingCount})
            </button>
          )}

          {isLoggedIn && forYouCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab("for_you")}
              className={`${styles.filterPill} ${filterTab === "for_you" ? styles.filterPillActive : ""}`}
            >
              Para ti ({forYouCount})
            </button>
          )}

          {events.length > upcomingEvents.length && (
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`${styles.filterPill} ${filterTab === "all" ? styles.filterPillActive : ""}`}
            >
              Todos ({events.length})
            </button>
          )}
        </div>

        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento o lugar..."
            className={styles.searchInput}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className={styles.searchClear}
              aria-label="Limpiar búsqueda"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar
            size={34}
            style={{ margin: "0 auto 0.65rem", color: "var(--color-magenta)", opacity: 0.6 }}
          />
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
            No hay eventos con este filtro
          </div>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.8rem",
              margin: "0.25rem 0 0.85rem",
            }}
          >
            Prueba viendo todos los próximos eventos o limpiando la búsqueda.
          </p>
          {filterTab !== "upcoming" && (
            <button
              type="button"
              onClick={() => {
                setFilterTab("upcoming");
                setSearch("");
              }}
              style={{
                padding: "0.45rem 0.9rem",
                borderRadius: "7px",
                backgroundColor: "var(--color-magenta)",
                color: "white",
                border: "none",
                fontSize: "0.76rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Ver próximos eventos
            </button>
          )}
        </div>
      ) : (
        <div className={styles.eventsGrid}>
          {filteredEvents.map((event) => {
            const date = event.start_date ? new Date(event.start_date) : null;
            const prices = (event.ticket_tiers || [])
              .map((t: any) => parseFloat(t.price))
              .filter((n: number) => !Number.isNaN(n));
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const isAttending = attendingSet.has(event.id);
            const matchForYou = !isAttending && isLoggedIn && isForYou(event);

            return (
              <Link
                href={`/events/${event.slug}`}
                key={event.id}
                className={styles.eventCard}
              >
                <div className={styles.imageWrapper}>
                  {event.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.cover_image}
                      alt={event.title}
                      className={styles.coverImage}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        opacity: 0.2,
                      }}
                    >
                      <Calendar size={42} />
                    </div>
                  )}

                  {date && (
                    <div className={styles.dateBadge}>
                      <div className={styles.dateMonth}>
                        {date.toLocaleDateString("es-CO", { month: "short" })}
                      </div>
                      <div className={styles.dateDay}>{date.getDate()}</div>
                    </div>
                  )}

                  {event.status === "postponed" && (
                    <div className={`${styles.statusBadge} ${styles.statusPostponed}`}>
                      Aplazado
                    </div>
                  )}
                  {event.status === "cancelled" && (
                    <div className={`${styles.statusBadge} ${styles.statusCancelled}`}>
                      Cancelado
                    </div>
                  )}

                  {isAttending && event.status === "published" && (
                    <div className={styles.attendingBadge}>✓ Asistes</div>
                  )}
                  {matchForYou && event.status === "published" && (
                    <div className={styles.forYouBadge}>★ Para ti</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>

                  <div className={styles.locationRow}>
                    <MapPin
                      size={13}
                      style={{ color: "var(--color-magenta)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.location_name || "Por confirmar"}
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <div>
                      {event.is_free ? (
                        <span className={styles.priceFree}>Entrada Libre</span>
                      ) : (
                        <span className={styles.priceTag}>
                          {minPrice > 0
                            ? `Desde $${minPrice.toLocaleString("es-CO")}`
                            : "Disponible"}
                        </span>
                      )}
                    </div>
                    <span className={styles.ctaLink}>
                      {isAttending ? "Mi Entrada" : "Boletas"} <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
