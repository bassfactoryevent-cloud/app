export type HeroSourceType = "custom" | "event" | "merch" | "post" | "ad";

export interface HeroTag {
  text: string;
  url?: string;
}

export interface HeroSlideMeta {
  event_date?: string;
  location?: string;
  price_label?: string;
  sponsor_name?: string;
  show_countdown?: boolean;
}

export interface HeroSlide {
  id: string;
  active: boolean;
  source_type: HeroSourceType;
  source_id?: string | null;
  badge_label?: string;
  media_type: "image" | "video";
  media_url: string;
  title: string;
  subtitle?: string;
  primary_button_text?: string;
  primary_button_url?: string;
  secondary_button_text?: string;
  secondary_button_url?: string;
  tags: HeroTag[];
  meta?: HeroSlideMeta;
}

export interface HeroV2Payload {
  __hero_v2: true;
  autoplay_ms: number;
  slides: HeroSlide[];
}

export function parseHeroConfig(
  heroSettings: any,
  fallbackCatalog?: {
    events?: any[];
    merch?: any[];
    posts?: any[];
  }
): {
  autoplayMs: number;
  slides: HeroSlide[];
} {
  const rawTags = heroSettings?.tags;

  // If already saved using Hero Spotlight Engine v2, return exact saved slides
  if (
    rawTags &&
    typeof rawTags === "object" &&
    !Array.isArray(rawTags) &&
    rawTags.__hero_v2 === true &&
    Array.isArray(rawTags.slides) &&
    rawTags.slides.length > 0
  ) {
    return {
      autoplayMs: Number(rawTags.autoplay_ms) >= 0 ? Number(rawTags.autoplay_ms) : 6500,
      slides: rawTags.slides,
    };
  }

  // Otherwise build Slide #1 from current hero_settings + auto-showcase from catalog
  const legacyTags: HeroTag[] = Array.isArray(rawTags) ? rawTags : [];
  const firstEvent = fallbackCatalog?.events?.[0] || null;
  const firstMerch = fallbackCatalog?.merch?.[0] || null;
  const firstPost = fallbackCatalog?.posts?.[0] || null;

  const defaultMedia =
    heroSettings?.media_url ||
    firstEvent?.cover_image ||
    "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600&auto=format&fit=crop";

  const slides: HeroSlide[] = [
    {
      id: "slide-main-1",
      active: true,
      source_type: "custom",
      source_id: null,
      badge_label: "ECOSISTEMA BASSFACTORY",
      media_type: heroSettings?.media_type === "video" ? "video" : "image",
      media_url: defaultMedia,
      title: heroSettings?.title || "MÚSICA<br/>Cultura<br/>Movimiento",
      subtitle:
        heroSettings?.subtitle ||
        "El ecosistema definitivo de la cultura electrónica en tu ciudad.",
      primary_button_text: heroSettings?.primary_button_text || "Ver Eventos",
      primary_button_url: heroSettings?.primary_button_url || "/events",
      secondary_button_text: heroSettings?.secondary_button_text || "Suscribete",
      secondary_button_url: heroSettings?.secondary_button_url || "/register",
      tags: legacyTags,
      meta: {},
    },
  ];

  if (firstEvent) {
    const cleanDesc = (firstEvent.description || "")
      .replace(/<[^>]+>/g, "")
      .slice(0, 145);
    slides.push({
      id: `slide-event-${firstEvent.id}`,
      active: true,
      source_type: "event",
      source_id: firstEvent.id,
      badge_label: "PRÓXIMO EVENTO OFICIAL",
      media_type: "image",
      media_url:
        firstEvent.cover_image ||
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1600",
      title: firstEvent.title,
      subtitle:
        cleanDesc ||
        `Asegura tu entrada QR oficial para ${firstEvent.title}. Cupos limitados por fase.`,
      primary_button_text: "Comprar Tickets",
      primary_button_url: `/events/${firstEvent.slug}`,
      secondary_button_text: "Ver Cartelera",
      secondary_button_url: "/events",
      tags: [],
      meta: {
        event_date: firstEvent.start_date,
        location: firstEvent.location || "Colombia",
        show_countdown: true,
      },
    });
  }

  if (firstMerch) {
    const primaryImg =
      firstMerch.merch_product_images?.find((img: any) => img.is_primary)
        ?.image_url ||
      firstMerch.merch_product_images?.[0]?.image_url ||
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1600";
    const formattedPrice = firstMerch.price_cop
      ? `$${Number(firstMerch.price_cop).toLocaleString("es-CO")} COP`
      : "EDICIÓN LIMITADA";

    slides.push({
      id: `slide-merch-${firstMerch.id}`,
      active: true,
      source_type: "merch",
      source_id: firstMerch.id,
      badge_label: "MERCH OFICIAL • DROP",
      media_type: "image",
      media_url: primaryImg,
      title: firstMerch.title,
      subtitle:
        (firstMerch.description || "").replace(/<[^>]+>/g, "").slice(0, 145) ||
        "Prendas oficiales de edición limitada diseñadas para la cultura underground.",
      primary_button_text: "Comprar Prenda",
      primary_button_url: `/merch/${firstMerch.slug}`,
      secondary_button_text: "Ver Colección",
      secondary_button_url: "/merch",
      tags: [],
      meta: {
        price_label: formattedPrice,
        show_countdown: false,
      },
    });
  }

  if (firstPost) {
    slides.push({
      id: `slide-post-${firstPost.id}`,
      active: true,
      source_type: "post",
      source_id: firstPost.id,
      badge_label: "EDITORIAL • CULTURA",
      media_type: "image",
      media_url:
        firstPost.cover_image ||
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600",
      title: firstPost.title,
      subtitle:
        firstPost.excerpt ||
        "Explora las últimas noticias, lanzamientos y entrevistas de la escena electrónica.",
      primary_button_text: "Leer Artículo",
      primary_button_url: `/blog/${firstPost.slug}`,
      secondary_button_text: "Ver Editorial",
      secondary_button_url: "/blog",
      tags: [],
      meta: {
        show_countdown: false,
      },
    });
  }

  return {
    autoplayMs: 6500,
    slides,
  };
}
