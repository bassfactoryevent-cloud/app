import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Download,
  Music,
  Globe,
  MapPin,
} from "lucide-react";
import AdBanner from "@/components/AdBanner";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import homeStyles from "@/app/(public)/page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findDjBySlugOrId(supabase: any, slugOrId: string) {
  const selectFields = `
    *,
    event_djs (
      set_time,
      events (id, title, slug, location_name, status, start_date, cover_image)
    )
  `;

  // 1. Try exact or case-insensitive slug match
  const { data: bySlug } = await supabase
    .from("djs")
    .select(selectFields)
    .ilike("slug", slugOrId)
    .maybeSingle();

  if (bySlug) return bySlug;

  // 2. Fallback to UUID id if slug is missing/null (fixes artists without slug like Minot!)
  if (UUID_REGEX.test(slugOrId)) {
    const { data: byId } = await supabase
      .from("djs")
      .select(selectFields)
      .eq("id", slugOrId)
      .maybeSingle();
    if (byId) return byId;
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const supabase = await createClient();
  const { slug } = await params;
  const dj = await findDjBySlugOrId(supabase, decodeURIComponent(slug));

  if (!dj) return { title: "Artista no encontrado | Bassfactory" };

  return {
    title: `${dj.name} | Presskit - Bassfactory`,
    description: dj.bio_short || `Presskit oficial de ${dj.name}`,
    openGraph: {
      images: dj.photo_url ? [dj.photo_url] : [],
    },
  };
}

export default async function DjEPKPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const supabase = await createClient();
  const { slug } = await params;
  const dj = await findDjBySlugOrId(supabase, decodeURIComponent(slug));

  if (!dj || dj.type !== "colectivo") {
    notFound();
  }

  const internalBookings =
    dj.event_djs
      ?.filter((b: any) => b.events && b.events.status !== "cancelled")
      .map((b: any) => {
        const evt = b.events;
        return {
          type: "internal",
          date: new Date(evt.start_date || b.set_time || 0),
          title: evt.title,
          location: evt.location_name,
          slug: evt.slug,
          cover_image: evt.cover_image,
        };
      }) || [];

  const externalBookings = (dj.external_bookings || []).map((b: any) => ({
    type: "external",
    date: new Date(b.date),
    title: b.title,
    location: b.location,
    url: b.ticket_url,
    cover_image: null,
  }));

  const now = new Date();
  const allBookings = [...internalBookings, ...externalBookings]
    .filter((b) => b.date.getTime() >= now.getTime() - 86400000)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const socialLinks = [
    { url: dj.soundcloud_url, label: "SoundCloud", bg: "#ff5500", color: "#fff", icon: <Music size={13} /> },
    { url: dj.music_spotify, label: "Spotify", bg: "#1DB954", color: "#fff", icon: <Globe size={13} /> },
    { url: dj.music_beatport, label: "Beatport", bg: "#01FF95", color: "#000", icon: <Music size={13} /> },
    { url: dj.music_apple, label: "Apple Music", bg: "#FA243C", color: "#fff", icon: <Globe size={13} /> },
    { url: dj.music_youtube, label: "YouTube", bg: "#FF0000", color: "#fff", icon: <Globe size={13} /> },
    { url: dj.social_instagram, label: "Instagram", bg: "#E1306C", color: "#fff", icon: <Globe size={13} /> },
    { url: dj.social_facebook, label: "Facebook", bg: "#4267B2", color: "#fff", icon: <Globe size={13} /> },
    { url: dj.social_x, label: "X", bg: "#27272A", color: "#fff", icon: <Globe size={13} /> },
  ].filter((l) => Boolean(l.url));

  return (
    <div style={{ paddingBottom: "3.5rem" }}>
      {/* COMPACT ARTIST HERO (Home Scale) */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "1.5rem 1rem 1.75rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundColor: "#09090b",
        }}
      >
        {dj.cover_image ? (
          <Image
            src={dj.cover_image}
            alt={`Portada de ${dj.name}`}
            fill
            style={{ objectFit: "cover", objectPosition: "center 20%", opacity: 0.35 }}
            priority
          />
        ) : dj.photo_url ? (
          <Image
            src={dj.photo_url}
            alt={dj.name}
            fill
            style={{ objectFit: "cover", filter: "blur(18px)", opacity: 0.28 }}
            priority
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 10,
            maxWidth: "1180px",
            margin: "0 auto",
          }}
        >
          <Link
            href="/djs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.38rem 0.78rem",
              borderRadius: "8px",
              backgroundColor: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              textDecoration: "none",
              marginBottom: "1.25rem",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={13} /> Volver a Artistas
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                padding: "2px",
                background:
                  "linear-gradient(135deg, var(--color-magenta), var(--color-accent))",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  overflow: "hidden",
                  backgroundColor: "#18181B",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {dj.photo_url ? (
                  <Image
                    src={dj.photo_url}
                    alt={dj.name}
                    fill
                    sizes="96px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <Music size={32} color="rgba(255,255,255,0.4)" />
                )}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: "240px" }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-accent)",
                }}
              >
                Roster Oficial Bassfactory
              </span>
              <h1
                style={{
                  fontSize: "clamp(1.6rem, 3.2vw, 2.35rem)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  margin: "3px 0 0 0",
                  color: "white",
                  wordBreak: "break-word",
                }}
              >
                {dj.name}
              </h1>
              {dj.bio_short && (
                <p
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "0.86rem",
                    maxWidth: "620px",
                    margin: "0.35rem 0 0 0",
                    lineHeight: 1.45,
                  }}
                >
                  {dj.bio_short}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT (Home Scale) */}
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "1.5rem 1rem 0",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* LEFT: BIO & PRESS PHOTOS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {dj.bio_full && (
              <section
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  padding: "1.1rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    marginBottom: "0.65rem",
                    color: "white",
                  }}
                >
                  Biografía
                </h2>
                <div
                  style={{
                    fontSize: "0.86rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.82)",
                    whiteSpace: "pre-line",
                  }}
                >
                  {dj.bio_full}
                </div>
              </section>
            )}

            {dj.press_photos && dj.press_photos.length > 0 && (
              <section>
                <h2
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    marginBottom: "0.75rem",
                    color: "white",
                  }}
                >
                  Press Photos
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: "0.65rem",
                  }}
                >
                  {dj.press_photos.map((photo: string, i: number) => (
                    <div
                      key={i}
                      style={{
                        position: "relative",
                        aspectRatio: "1/1",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Image
                        src={photo}
                        alt={`Press photo ${i + 1}`}
                        fill
                        sizes="180px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: BOOKING & LINKS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {(dj.contact_email || dj.contact_phone || dj.tech_rider_url) && (
              <section
                style={{
                  backgroundColor: "var(--color-surface)",
                  padding: "1.1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <h2
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    margin: 0,
                    color: "var(--color-magenta)",
                  }}
                >
                  Booking &amp; Contacto
                </h2>

                {dj.contact_email && (
                  <a
                    href={`mailto:${dj.contact_email}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      color: "white",
                      textDecoration: "none",
                      padding: "0.65rem 0.85rem",
                      backgroundColor: "rgba(0,0,0,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    <Mail size={15} color="var(--color-magenta)" />
                    <span>{dj.contact_email}</span>
                  </a>
                )}

                {dj.contact_phone && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                      padding: "0.65rem 0.85rem",
                      backgroundColor: "rgba(0,0,0,0.35)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    <Phone size={15} color="var(--color-magenta)" />
                    <span>{dj.contact_phone}</span>
                  </div>
                )}

                {dj.tech_rider_url && (
                  <a
                    href={dj.tech_rider_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      color: "white",
                      backgroundColor: "var(--color-magenta)",
                      textDecoration: "none",
                      padding: "0.65rem 1rem",
                      borderRadius: "8px",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      marginTop: "0.2rem",
                    }}
                  >
                    <Download size={15} /> Descargar Tech Rider
                  </a>
                )}
              </section>
            )}

            {socialLinks.length > 0 && (
              <section
                style={{
                  backgroundColor: "var(--color-surface)",
                  padding: "1.1rem",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <h2
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 800,
                    marginBottom: "0.75rem",
                    color: "white",
                  }}
                >
                  Música &amp; Redes
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
                  {socialLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "0.42rem 0.85rem",
                        backgroundColor: link.bg,
                        color: link.color,
                        borderRadius: "999px",
                        textDecoration: "none",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
                      {link.icon} {link.label}
                    </a>
                  ))}
                </div>
              </section>
            )}

            <AdBanner placementName="dj_epk_banner" />
          </div>
        </div>

        {/* UPCOMING EVENTS (Home Card Scale) */}
        {allBookings.length > 0 && (
          <section
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "1.5rem",
            }}
          >
            <HorizontalScroll title="Próximas Fechas" viewAllLink="/events" canvasIcon="radar">
              {allBookings.map((booking: any, idx: number) => {
                const CardComponent = booking.type === "internal" ? Link : "a";
                const hrefProps =
                  booking.type === "internal"
                    ? { href: `/events/${booking.slug}` }
                    : {
                        href: booking.url || "#",
                        target: booking.url ? "_blank" : undefined,
                        rel: booking.url ? "noreferrer" : undefined,
                      };

                const fallbackImage =
                  dj.photo_url ||
                  "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=400";

                return (
                  <CardComponent key={idx} {...hrefProps} className={homeStyles.card}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={booking.cover_image || fallbackImage}
                      alt={booking.title}
                      className={homeStyles.cardImage}
                    />
                    <h3 className={homeStyles.cardTitle}>{booking.title}</h3>
                    <div
                      className={homeStyles.cardSubtitle}
                      style={{ marginTop: "0.25rem" }}
                    >
                      {booking.date.toLocaleDateString("es-CO", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {booking.location && (
                      <div
                        className={homeStyles.cardSubtitle}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          marginTop: "0.15rem",
                          flex: 1,
                        }}
                      >
                        <MapPin size={11} />
                        <span>{booking.location}</span>
                      </div>
                    )}
                    <span className={homeStyles.cardButton}>
                      {booking.type === "internal" ? "Ver Evento" : "Info"}
                    </span>
                  </CardComponent>
                );
              })}
            </HorizontalScroll>
          </section>
        )}
      </div>
    </div>
  );
}
