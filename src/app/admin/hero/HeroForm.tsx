"use client";

import React, { useState } from "react";
import { saveHeroSlidesAction } from "./actions";
import {
  HeroSlide,
  HeroSourceType,
  parseHeroConfig,
} from "@/types/hero";
import {
  Save,
  Image as ImageIcon,
  Video,
  Plus,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Calendar,
  ShoppingBag,
  FileText,
  Megaphone,
  Sparkles,
  Eye,
  EyeOff,
  Clock,
  Upload,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface CatalogProps {
  events: any[];
  merch: any[];
  posts: any[];
  ads: any[];
}

const SOURCE_TYPES: {
  id: HeroSourceType;
  label: string;
  badgeDefault: string;
  icon: any;
}[] = [
  {
    id: "event",
    label: "Evento Oficial",
    badgeDefault: "PRÓXIMO EVENTO OFICIAL",
    icon: Calendar,
  },
  {
    id: "merch",
    label: "Merch / Drop",
    badgeDefault: "MERCH OFICIAL • DROP",
    icon: ShoppingBag,
  },
  {
    id: "post",
    label: "Post / Noticia",
    badgeDefault: "EDITORIAL • CULTURA",
    icon: FileText,
  },
  {
    id: "ad",
    label: "Pauta / Sponsor",
    badgeDefault: "PARTNER OFICIAL",
    icon: Megaphone,
  },
  {
    id: "custom",
    label: "Libre / Video",
    badgeDefault: "ECOSISTEMA BASSFACTORY",
    icon: Sparkles,
  },
];

function stripHtmlClean(raw?: string) {
  if (!raw) return "";
  return raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSlideFieldsFromItem(
  sourceType: HeroSourceType,
  item: any
): Partial<HeroSlide> {
  if (!item) return {};

  if (sourceType === "event") {
    const cleanDesc = stripHtmlClean(item.description).slice(0, 150);
    const loc = item.location_name || item.location || "Colombia";
    return {
      source_type: "event",
      source_id: item.id,
      badge_label: "PRÓXIMO EVENTO OFICIAL",
      media_type: "image",
      media_url:
        item.cover_image ||
        "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1600",
      title: item.title,
      subtitle:
        cleanDesc ||
        `Vive la experiencia oficial en ${loc}. Entradas QR disponibles por fases.`,
      primary_button_text: "Comprar Tickets",
      primary_button_url: `/events/${item.slug}`,
      secondary_button_text: "Ver Todos los Eventos",
      secondary_button_url: "/events",
      meta: {
        event_date: item.start_date,
        location: loc,
        show_countdown: true,
      },
    };
  }

  if (sourceType === "merch") {
    const primaryImg =
      item.merch_product_images?.find((img: any) => img.is_primary)
        ?.image_url ||
      item.merch_product_images?.[0]?.image_url ||
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1600";
    const priceVal = item.base_price ?? item.price_cop;
    const formattedPrice = priceVal
      ? `$${Number(priceVal).toLocaleString("es-CO")} COP`
      : "EDICIÓN LIMITADA";

    return {
      source_type: "merch",
      source_id: item.id,
      badge_label: "MERCH OFICIAL • EDICIÓN LIMITADA",
      media_type: "image",
      media_url: primaryImg,
      title: item.title,
      subtitle:
        stripHtmlClean(item.description).slice(0, 150) ||
        "Prenda oficial de la colección Bassfactory. Envíos a todo el país.",
      primary_button_text: "Comprar Prenda",
      primary_button_url: `/merch/${item.slug}`,
      secondary_button_text: "Ver Tienda",
      secondary_button_url: "/merch",
      meta: {
        price_label: formattedPrice,
        show_countdown: false,
      },
    };
  }

  if (sourceType === "post") {
    const cleanExcerpt =
      item.excerpt ||
      stripHtmlClean(item.content).slice(0, 150) ||
      "Lee el artículo completo en la sección editorial de Bassfactory.";
    return {
      source_type: "post",
      source_id: item.id,
      badge_label: "EDITORIAL • CULTURA ELECTRÓNICA",
      media_type: "image",
      media_url:
        item.cover_image ||
        "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600",
      title: item.title,
      subtitle: cleanExcerpt,
      primary_button_text: "Leer Artículo",
      primary_button_url: `/blog/${item.slug}`,
      secondary_button_text: "Ver Más Noticias",
      secondary_button_url: "/blog",
      meta: {
        show_countdown: false,
      },
    };
  }

  if (sourceType === "ad") {
    const campaignName =
      item.ad_campaigns?.name ||
      item.ad_campaigns?.client_name ||
      item.title ||
      "Campaña Oficial";
    return {
      source_type: "ad",
      source_id: item.id,
      badge_label: "PRESENTADO POR • PARTNER OFICIAL",
      media_type: "image",
      media_url:
        item.image_url ||
        "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600",
      title: campaignName,
      subtitle: "Conoce más sobre esta activación especial en Bassfactory.",
      primary_button_text: "Explorar Ahora",
      primary_button_url: item.target_url || "/events",
      secondary_button_text: "",
      secondary_button_url: "",
      meta: {
        sponsor_name: item.ad_campaigns?.client_name || campaignName,
        show_countdown: false,
      },
    };
  }

  return {};
}

export default function HeroForm({
  initialData,
  catalog,
}: {
  initialData: any;
  catalog: CatalogProps;
}) {
  const parsed = parseHeroConfig(initialData, catalog);
  const [slides, setSlides] = useState<HeroSlide[]>(parsed.slides);
  const [autoplayMs, setAutoplayMs] = useState<number>(parsed.autoplayMs);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [newTagText, setNewTagText] = useState("");
  const [newTagUrl, setNewTagUrl] = useState("");

  const currentSlide = slides[selectedIdx] || slides[0];

  const updateCurrentSlide = (patch: Partial<HeroSlide>) => {
    setSlides((prev) =>
      prev.map((slide, idx) =>
        idx === selectedIdx ? { ...slide, ...patch } : slide
      )
    );
  };

  const updateCurrentMeta = (
    metaPatch: Partial<NonNullable<HeroSlide["meta"]>>
  ) => {
    setSlides((prev) =>
      prev.map((slide, idx) =>
        idx === selectedIdx
          ? { ...slide, meta: { ...(slide.meta || {}), ...metaPatch } }
          : slide
      )
    );
  };

  // Creates a new slide of the chosen type and immediately auto-populates it with the 1st available catalog item
  const handleAddSlide = (presetType: HeroSourceType = "custom") => {
    const typeInfo =
      SOURCE_TYPES.find((t) => t.id === presetType) || SOURCE_TYPES[4];

    let firstCatalogItem: any = null;
    if (presetType === "event") firstCatalogItem = catalog.events?.[0] || null;
    else if (presetType === "merch") firstCatalogItem = catalog.merch?.[0] || null;
    else if (presetType === "post") firstCatalogItem = catalog.posts?.[0] || null;
    else if (presetType === "ad") firstCatalogItem = catalog.ads?.[0] || null;

    const autoFilled = firstCatalogItem
      ? buildSlideFieldsFromItem(presetType, firstCatalogItem)
      : {};

    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      active: true,
      source_type: presetType,
      source_id: firstCatalogItem?.id || null,
      badge_label: typeInfo.badgeDefault,
      media_type: "image",
      media_url:
        "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1600&auto=format&fit=crop",
      title: "MÚSICA<br/>Cultura<br/>Movimiento",
      subtitle:
        "Personaliza libremente los textos, imágenes y enlaces de este slide.",
      primary_button_text: "Ver Eventos",
      primary_button_url: "/events",
      secondary_button_text: "Suscribete",
      secondary_button_url: "/register",
      tags: [],
      meta: {
        show_countdown: presetType === "event",
      },
      ...autoFilled,
    };

    const nextSlides = [...slides, newSlide];
    setSlides(nextSlides);
    setSelectedIdx(nextSlides.length - 1);
    toast.success(
      firstCatalogItem
        ? `Slide #${nextSlides.length} (${typeInfo.label}) creado y autocompletado con "${
            firstCatalogItem.title || firstCatalogItem.ad_campaigns?.name || "ítem"
          }"`
        : `Slide #${nextSlides.length} (${typeInfo.label}) agregado`
    );
  };

  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 1) {
      toast.error("Debes mantener al menos 1 slide en el banner principal.");
      return;
    }
    const nextSlides = slides.filter((_, i) => i !== idx);
    setSlides(nextSlides);
    setSelectedIdx(Math.max(0, Math.min(selectedIdx, nextSlides.length - 1)));
    toast.info("Slide eliminado");
  };

  const handleMoveSlide = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const copy = [...slides];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSlides(copy);
    setSelectedIdx(targetIdx);
  };

  // Smart 1-Click Auto-Fill when picking an Event, Merch, Post, or Ad from the dropdown
  const handleSelectCatalogItem = (itemId: string) => {
    if (!itemId) {
      updateCurrentSlide({ source_id: null });
      return;
    }

    const st = currentSlide.source_type;
    let item: any = null;
    if (st === "event") item = catalog.events.find((e) => e.id === itemId);
    else if (st === "merch") item = catalog.merch.find((m) => m.id === itemId);
    else if (st === "post") item = catalog.posts.find((p) => p.id === itemId);
    else if (st === "ad") item = catalog.ads.find((a) => a.id === itemId);

    if (!item) return;

    const fields = buildSlideFieldsFromItem(st, item);
    updateCurrentSlide(fields);
    toast.success(
      `Imagen y textos cargados desde "${
        item.title || item.ad_campaigns?.name || "catálogo"
      }"`
    );
  };

  const handleChangeSlideType = (newType: HeroSourceType) => {
    let firstItem: any = null;
    if (newType === "event") firstItem = catalog.events?.[0] || null;
    else if (newType === "merch") firstItem = catalog.merch?.[0] || null;
    else if (newType === "post") firstItem = catalog.posts?.[0] || null;
    else if (newType === "ad") firstItem = catalog.ads?.[0] || null;

    if (firstItem) {
      updateCurrentSlide(buildSlideFieldsFromItem(newType, firstItem));
    } else {
      const typeInfo =
        SOURCE_TYPES.find((t) => t.id === newType) || SOURCE_TYPES[4];
      updateCurrentSlide({
        source_type: newType,
        source_id: null,
        badge_label: typeInfo.badgeDefault,
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const isVid = ["mp4", "webm", "mov"].includes(ext);
      const fileName = `hero-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("blog_images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: pubData } = supabase.storage
        .from("blog_images")
        .getPublicUrl(fileName);

      if (pubData?.publicUrl) {
        updateCurrentSlide({
          media_type: isVid ? "video" : "image",
          media_url: pubData.publicUrl,
        });
        toast.success(
          `${isVid ? "Video" : "Imagen"} subido y asignado al Slide #${
            selectedIdx + 1
          }`
        );
      }
    } catch (err: any) {
      console.error("Hero upload error:", err);
      toast.error(
        "No se pudo subir el archivo directo. También puedes pegar la URL manualmente."
      );
    } finally {
      setUploadingMedia(false);
      e.target.value = "";
    }
  };

  const handleAddTag = () => {
    if (!newTagText.trim()) return;
    const nextTags = [
      ...(currentSlide.tags || []),
      { text: newTagText.trim(), url: newTagUrl.trim() },
    ];
    updateCurrentSlide({ tags: nextTags });
    setNewTagText("");
    setNewTagUrl("");
  };

  const handleRemoveTag = (tagIndex: number) => {
    const nextTags = (currentSlide.tags || []).filter((_, i) => i !== tagIndex);
    updateCurrentSlide({ tags: nextTags });
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveHeroSlidesAction({
        autoplayMs,
        slides,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          `¡Slider Principal guardado con ${
            slides.filter((s) => s.active).length
          } slide(s) activos!`
        );
      }
    } catch (err) {
      toast.error("Error inesperado al guardar el slider.");
    } finally {
      setSaving(false);
    }
  };

  const currentTypeInfo =
    SOURCE_TYPES.find((t) => t.id === currentSlide?.source_type) ||
    SOURCE_TYPES[4];

  return (
    <form
      onSubmit={handleSaveAll}
      style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
    >
      {/* BARRA SUPERIOR GLOBAL DEL SLIDER */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Layers size={19} style={{ color: "#D90416" }} />
            <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
              {slides.length}{" "}
              {slides.length === 1
                ? "Slide configurado"
                : "Slides en el Carrusel"}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                background: "rgba(34, 197, 94, 0.14)",
                color: "#4ade80",
                fontWeight: 700,
              }}
            >
              {slides.filter((s) => s.active).length} Activos
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} style={{ opacity: 0.7 }} />
            <label
              style={{ fontSize: "0.84rem", opacity: 0.85, fontWeight: 600 }}
            >
              Rotación automática:
            </label>
            <select
              value={autoplayMs}
              onChange={(e) => setAutoplayMs(Number(e.target.value))}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "0.5rem",
                fontSize: "0.84rem",
                backgroundColor: "#09090b",
                border: "1px solid rgba(255,255,255,0.14)",
                color: "#fff",
              }}
            >
              <option value={5000}>Cada 5 segundos (Dinámico)</option>
              <option value={6500}>Cada 6.5 segundos (Recomendado)</option>
              <option value={8000}>Cada 8 segundos (Cine)</option>
              <option value={10000}>Cada 10 segundos (Pausado)</option>
              <option value={0}>Manual (Sin auto-rotación)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.55rem",
            padding: "0.75rem 1.5rem",
            fontWeight: 800,
            fontSize: "0.9rem",
            boxShadow: "0 8px 25px rgba(217, 4, 22, 0.35)",
          }}
        >
          <Save size={18} />
          {saving ? "Publicando en vivo..." : "Guardar y Publicar Slider"}
        </button>
      </div>

      {/* 1. SECUENCIA DE SLIDES DEL HOME */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "1rem",
          padding: "1.35rem 1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.85rem",
            marginBottom: "1.1rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
              1. Secuencia de Slides del Home
            </h3>
            <p
              style={{
                margin: "0.2rem 0 0",
                fontSize: "0.82rem",
                opacity: 0.65,
              }}
            >
              Al agregar un slide de Evento, Merch, Post o Pauta se carga automáticamente su imagen y textos.
            </p>
          </div>

          {/* Botones de creación rápida por tipo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                opacity: 0.7,
                marginRight: "0.25rem",
                fontWeight: 600,
              }}
            >
              + Agregar Slide de:
            </span>
            {SOURCE_TYPES.map((st) => {
              const Icon = st.icon;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => handleAddSlide(st.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 0.75rem",
                    borderRadius: "0.55rem",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Icon size={14} style={{ color: "#D90416" }} />
                  <span>{st.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tarjetas de los Slides */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {slides.map((slide, idx) => {
            const isSelected = idx === selectedIdx;
            const stInfo =
              SOURCE_TYPES.find((t) => t.id === slide.source_type) ||
              SOURCE_TYPES[4];
            const Icon = stInfo.icon;

            return (
              <div
                key={slide.id}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  position: "relative",
                  cursor: "pointer",
                  borderRadius: "0.85rem",
                  padding: "0.9rem",
                  background: isSelected
                    ? "linear-gradient(145deg, rgba(217, 4, 22, 0.16), rgba(15, 15, 18, 0.95))"
                    : "rgba(0, 0, 0, 0.45)",
                  border: isSelected
                    ? "2px solid #D90416"
                    : "1px solid rgba(255, 255, 255, 0.09)",
                  opacity: slide.active ? 1 : 0.55,
                  transition: "all 0.18s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "0.65rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.4rem",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.75)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Icon size={13} style={{ color: "#D90416" }} />
                    Slide #{idx + 1} • {stInfo.label.split(" ")[0]}
                  </span>

                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "999px",
                      fontWeight: 700,
                      background: slide.active
                        ? "rgba(34, 197, 94, 0.18)"
                        : "rgba(255, 255, 255, 0.1)",
                      color: slide.active ? "#4ade80" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {slide.active ? "ACTIVO" : "OCULTO"}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: "0.92rem",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {stripHtmlClean(slide.title) || "Sin título"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.55)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: "0.15rem",
                    }}
                  >
                    {slide.badge_label || "Sin etiqueta"} •{" "}
                    {slide.media_type === "video" ? "🎥 Video" : "🖼️ Imagen"}
                  </div>
                </div>

                {/* Controles rápidos del slide */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: "flex", gap: "0.25rem" }}>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, -1)}
                      disabled={idx === 0}
                      title="Mover antes"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "none",
                        color: idx === 0 ? "rgba(255,255,255,0.2)" : "#fff",
                        borderRadius: "0.35rem",
                        padding: "0.3rem 0.45rem",
                        cursor: idx === 0 ? "default" : "pointer",
                      }}
                    >
                      <ArrowUp
                        size={13}
                        style={{ transform: "rotate(-90deg)" }}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, 1)}
                      disabled={idx === slides.length - 1}
                      title="Mover después"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "none",
                        color:
                          idx === slides.length - 1
                            ? "rgba(255,255,255,0.2)"
                            : "#fff",
                        borderRadius: "0.35rem",
                        padding: "0.3rem 0.45rem",
                        cursor:
                          idx === slides.length - 1 ? "default" : "pointer",
                      }}
                    >
                      <ArrowDown
                        size={13}
                        style={{ transform: "rotate(-90deg)" }}
                      />
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setSlides((prev) =>
                          prev.map((s, i) =>
                            i === idx ? { ...s, active: !s.active } : s
                          )
                        )
                      }
                      title={slide.active ? "Ocultar slide" : "Activar slide"}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "none",
                        color: "#fff",
                        borderRadius: "0.35rem",
                        padding: "0.3rem 0.5rem",
                        cursor: "pointer",
                        fontSize: "0.72rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      {slide.active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(idx)}
                      title="Eliminar slide"
                      style={{
                        background: "rgba(239, 68, 68, 0.14)",
                        border: "none",
                        color: "#f87171",
                        borderRadius: "0.35rem",
                        padding: "0.3rem 0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PANEL DE EDICIÓN DEL SLIDE SELECCIONADO + VISTA PREVIA */}
      {currentSlide && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* COLUMNA IZQUIERDA: CONFIGURADOR DIRECTO DEL SLIDE */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* A. Selector directo según el tipo del Slide (Sin redundancia) */}
            <section
              style={{
                backgroundColor: "var(--color-surface)",
                padding: "1.5rem",
                borderRadius: "1rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom:
                    currentSlide.source_type === "custom" ? "0.25rem" : "1rem",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                    2. Contenido del Slide #{selectedIdx + 1} (
                    {currentTypeInfo.label})
                  </h3>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      opacity: 0.65,
                      margin: "0.2rem 0 0",
                    }}
                  >
                    {currentSlide.source_type === "custom"
                      ? "Slide libre: configura abajo el video/imagen y textos personalizados."
                      : "Al elegir un ítem de la lista se cargan su imagen, textos y botones automáticamente."}
                  </p>
                </div>

                {/* Selector compacto por si desea cambiar la categoría de este slide */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{ fontSize: "0.74rem", opacity: 0.6 }}>
                    Categoría:
                  </span>
                  <select
                    value={currentSlide.source_type}
                    onChange={(e) =>
                      handleChangeSlideType(e.target.value as HeroSourceType)
                    }
                    style={{
                      padding: "0.35rem 0.6rem",
                      fontSize: "0.78rem",
                      borderRadius: "0.45rem",
                      backgroundColor: "#09090b",
                      border: "1px solid rgba(255,255,255,0.14)",
                      color: "#fff",
                    }}
                  >
                    {SOURCE_TYPES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector Directo de Evento */}
              {currentSlide.source_type === "event" && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(217, 4, 22, 0.08)",
                    border: "1px solid rgba(217, 4, 22, 0.3)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      marginBottom: "0.45rem",
                      color: "#fff",
                    }}
                  >
                    🎟️ Evento Publicado ({catalog.events.length} disponibles):
                  </label>
                  <select
                    value={currentSlide.source_id || ""}
                    onChange={(e) => handleSelectCatalogItem(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#09090b" }}
                  >
                    <option value="">
                      -- Selecciona un evento para cargar su flyer y datos --
                    </option>
                    {catalog.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} (
                        {ev.start_date
                          ? new Date(ev.start_date).toLocaleDateString("es-CO")
                          : "Sin fecha"}{" "}
                        • {ev.location_name || ev.location || "Colombia"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector Directo de Merch */}
              {currentSlide.source_type === "merch" && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(217, 4, 22, 0.08)",
                    border: "1px solid rgba(217, 4, 22, 0.3)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      marginBottom: "0.45rem",
                      color: "#fff",
                    }}
                  >
                    👕 Prenda de Merch ({catalog.merch.length} disponibles):
                  </label>
                  <select
                    value={currentSlide.source_id || ""}
                    onChange={(e) => handleSelectCatalogItem(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#09090b" }}
                  >
                    <option value="">
                      -- Selecciona una prenda para cargar su foto y precio --
                    </option>
                    {catalog.merch.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} - $
                        {Number(
                          m.base_price ?? m.price_cop ?? 0
                        ).toLocaleString("es-CO")}{" "}
                        COP
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector Directo de Post */}
              {currentSlide.source_type === "post" && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(217, 4, 22, 0.08)",
                    border: "1px solid rgba(217, 4, 22, 0.3)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      marginBottom: "0.45rem",
                      color: "#fff",
                    }}
                  >
                    📰 Artículo / Post del Blog ({catalog.posts.length}{" "}
                    disponibles):
                  </label>
                  <select
                    value={currentSlide.source_id || ""}
                    onChange={(e) => handleSelectCatalogItem(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#09090b" }}
                  >
                    <option value="">
                      -- Selecciona un post para cargar su portada y extracto --
                    </option>
                    {catalog.posts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector Directo de Pauta / Ad */}
              {currentSlide.source_type === "ad" && (
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(217, 4, 22, 0.08)",
                    border: "1px solid rgba(217, 4, 22, 0.3)",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      marginBottom: "0.45rem",
                      color: "#fff",
                    }}
                  >
                    📢 Pauta / Campaña Activa ({catalog.ads.length} disponibles):
                  </label>
                  <select
                    value={currentSlide.source_id || ""}
                    onChange={(e) => handleSelectCatalogItem(e.target.value)}
                    style={{ width: "100%", backgroundColor: "#09090b" }}
                  >
                    <option value="">
                      -- Selecciona una pauta o personaliza abajo --
                    </option>
                    {catalog.ads.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.ad_campaigns?.name ||
                          a.ad_campaigns?.client_name ||
                          a.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </section>

            {/* B. Fondo Multimedia (Imagen o Video + Subida Directa) */}
            <section
              style={{
                backgroundColor: "var(--color-surface)",
                padding: "1.5rem",
                borderRadius: "1rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 style={{ marginBottom: "1rem", fontSize: "1.05rem" }}>
                3. Imagen o Video del Slide #{selectedIdx + 1} (Opcional modificar)
              </h3>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 1rem",
                    borderRadius: "0.55rem",
                    background:
                      currentSlide.media_type === "image"
                        ? "rgba(217, 4, 22, 0.16)"
                        : "rgba(0,0,0,0.35)",
                    border:
                      currentSlide.media_type === "image"
                        ? "1px solid #D90416"
                        : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                  }}
                >
                  <input
                    type="radio"
                    checked={currentSlide.media_type === "image"}
                    onChange={() => updateCurrentSlide({ media_type: "image" })}
                  />
                  <ImageIcon size={16} /> Imagen Alta Resolución
                </label>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 1rem",
                    borderRadius: "0.55rem",
                    background:
                      currentSlide.media_type === "video"
                        ? "rgba(217, 4, 22, 0.16)"
                        : "rgba(0,0,0,0.35)",
                    border:
                      currentSlide.media_type === "video"
                        ? "1px solid #D90416"
                        : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                  }}
                >
                  <input
                    type="radio"
                    checked={currentSlide.media_type === "video"}
                    onChange={() => updateCurrentSlide({ media_type: "video" })}
                  />
                  <Video size={16} /> Video (MP4 / YouTube / Vimeo)
                </label>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.4rem",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                    }}
                  >
                    URL de{" "}
                    {currentSlide.media_type === "video"
                      ? "Video (.mp4, YouTube o Vimeo)"
                      : "Imagen"}
                    :
                  </label>
                  <input
                    type="url"
                    value={currentSlide.media_url}
                    onChange={(e) =>
                      updateCurrentSlide({ media_url: e.target.value })
                    }
                    placeholder="https://..."
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.55rem 1rem",
                      borderRadius: "0.55rem",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: uploadingMedia ? "wait" : "pointer",
                    }}
                  >
                    <Upload size={15} style={{ color: "#D90416" }} />
                    <span>
                      {uploadingMedia
                        ? "Subiendo archivo..."
                        : "Subir Imagen o Video MP4 desde tu equipo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={handleFileUpload}
                      disabled={uploadingMedia}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* C. Textos, Badge de Categoría y Widgets de Activación */}
            <section
              style={{
                backgroundColor: "var(--color-surface)",
                padding: "1.5rem",
                borderRadius: "1rem",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "1.1rem",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                4. Textos y Activación en Vivo (Opcional modificar)
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.85rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.35rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Etiqueta Superior (Badge)
                  </label>
                  <input
                    type="text"
                    value={currentSlide.badge_label || ""}
                    onChange={(e) =>
                      updateCurrentSlide({ badge_label: e.target.value })
                    }
                    placeholder="Ej: PRÓXIMO EVENTO / MERCH DROP"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "0.35rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    Ubicación / Precio / Sponsor (Opcional)
                  </label>
                  <input
                    type="text"
                    value={
                      currentSlide.meta?.price_label ||
                      currentSlide.meta?.location ||
                      currentSlide.meta?.sponsor_name ||
                      ""
                    }
                    onChange={(e) =>
                      updateCurrentMeta({
                        location: e.target.value,
                        price_label:
                          currentSlide.source_type === "merch"
                            ? e.target.value
                            : undefined,
                      })
                    }
                    placeholder="Ej: Medellín, CO o $120.000 COP"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Contador Regresivo de Evento */}
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "0.7rem",
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(currentSlide.meta?.show_countdown)}
                    onChange={(e) =>
                      updateCurrentMeta({ show_countdown: e.target.checked })
                    }
                  />
                  <span>
                    🔥 Mostrar Cuenta Regresiva en Vivo (Días : Horas : Min :
                    Seg) en el Banner
                  </span>
                </label>

                {currentSlide.meta?.show_countdown && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.76rem",
                        opacity: 0.75,
                        marginBottom: "0.25rem",
                      }}
                    >
                      Fecha y Hora Objetivo del Contador:
                    </label>
                    <input
                      type="datetime-local"
                      value={
                        currentSlide.meta?.event_date
                          ? new Date(currentSlide.meta.event_date)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        updateCurrentMeta({
                          event_date: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.35rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  Título Principal (admite &lt;br/&gt; para salto de línea)
                </label>
                <textarea
                  rows={2}
                  value={currentSlide.title}
                  onChange={(e) =>
                    updateCurrentSlide({ title: e.target.value })
                  }
                  style={{ width: "100%", fontFamily: "monospace" }}
                  placeholder="MÚSICA<br/>Cultura<br/>Movimiento"
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.35rem",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  Subtítulo / Descripción Corta
                </label>
                <input
                  type="text"
                  value={currentSlide.subtitle || ""}
                  onChange={(e) =>
                    updateCurrentSlide({ subtitle: e.target.value })
                  }
                  style={{ width: "100%" }}
                  placeholder="El ecosistema definitivo de la cultura electrónica..."
                />
              </div>
            </section>

            {/* D. Botones de Acción (Principal y Secundario) */}
            <section
              style={{
                backgroundColor: "var(--color-surface)",
                padding: "1.5rem",
                borderRadius: "1rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3 style={{ marginBottom: "1rem", fontSize: "1.05rem" }}>
                5. Botones de Acción (Lado a Lado en Desktop y Móvil)
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(217, 4, 22, 0.3)",
                  }}
                >
                  <h4
                    style={{
                      marginBottom: "0.75rem",
                      fontSize: "0.88rem",
                      color: "#D90416",
                    }}
                  >
                    Botón Principal (Rojo)
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Texto
                      </label>
                      <input
                        type="text"
                        value={currentSlide.primary_button_text || ""}
                        onChange={(e) =>
                          updateCurrentSlide({
                            primary_button_text: e.target.value,
                          })
                        }
                        placeholder="Ej: Comprar Tickets"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Enlace (URL)
                      </label>
                      <input
                        type="text"
                        value={currentSlide.primary_button_url || ""}
                        onChange={(e) =>
                          updateCurrentSlide({
                            primary_button_url: e.target.value,
                          })
                        }
                        placeholder="Ej: /events"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    background: "rgba(0,0,0,0.35)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <h4 style={{ marginBottom: "0.75rem", fontSize: "0.88rem" }}>
                    Botón Secundario (Cristal - Opcional)
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Texto
                      </label>
                      <input
                        type="text"
                        value={currentSlide.secondary_button_text || ""}
                        onChange={(e) =>
                          updateCurrentSlide({
                            secondary_button_text: e.target.value,
                          })
                        }
                        placeholder="Ej: Suscribete"
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.76rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Enlace (URL)
                      </label>
                      <input
                        type="text"
                        value={currentSlide.secondary_button_url || ""}
                        onChange={(e) =>
                          updateCurrentSlide({
                            secondary_button_url: e.target.value,
                          })
                        }
                        placeholder="Ej: /register"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Etiquetas / Tags adicionales */}
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1.1rem",
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                  }}
                >
                  Pills / Etiquetas Adicionales (Opcional)
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginBottom: "0.75rem",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Texto (Ej: TECHNO / FASE 1)"
                    value={newTagText}
                    onChange={(e) => setNewTagText(e.target.value)}
                    style={{ flex: 1, minWidth: "150px" }}
                  />
                  <input
                    type="text"
                    placeholder="Link opcional (Ej: /events)"
                    value={newTagUrl}
                    onChange={(e) => setNewTagUrl(e.target.value)}
                    style={{ flex: 1, minWidth: "150px" }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn"
                    style={{
                      backgroundColor: "var(--color-surface-hover)",
                      padding: "0.55rem 0.95rem",
                    }}
                  >
                    <Plus size={16} /> Agregar
                  </button>
                </div>

                {currentSlide.tags && currentSlide.tags.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.45rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {currentSlide.tags.map((t, i) => (
                      <span
                        key={i}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.3rem 0.7rem",
                          borderRadius: "999px",
                          background: "rgba(217, 4, 22, 0.18)",
                          border: "1px solid rgba(217, 4, 22, 0.4)",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {t.text}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(i)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            display: "flex",
                          }}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA EN VIVO DEL SLIDE */}
          <div style={{ position: "sticky", top: "1.5rem" }}>
            <div
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "1rem",
                padding: "1.25rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.85rem",
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  Vista Previa en Vivo • Slide #{selectedIdx + 1}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "#4ade80",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={14} /> Responsive Mobile & Desktop
                </span>
              </div>

              {/* Simulador Visual del Hero */}
              <div
                style={{
                  position: "relative",
                  height: "420px",
                  borderRadius: "0.85rem",
                  overflow: "hidden",
                  backgroundColor: "#050505",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: "1.5rem",
                }}
              >
                {currentSlide.media_type === "video" &&
                !currentSlide.media_url.includes("youtube") &&
                !currentSlide.media_url.includes("vimeo") ? (
                  <video
                    src={currentSlide.media_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.65,
                    }}
                  />
                ) : (
                  <img
                    src={
                      currentSlide.media_url ||
                      "https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=1200"
                    }
                    alt="Preview"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.65,
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(5,5,5,0.2) 0%, rgba(5,5,5,0.88) 85%, #050505 100%)",
                  }}
                />

                <div style={{ position: "relative", zIndex: 2 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.45rem",
                      flexWrap: "wrap",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {currentSlide.badge_label && (
                      <span
                        style={{
                          padding: "0.28rem 0.75rem",
                          borderRadius: "999px",
                          background: "#D90416",
                          color: "#fff",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {currentSlide.badge_label}
                      </span>
                    )}
                    {(currentSlide.meta?.price_label ||
                      currentSlide.meta?.location) && (
                      <span
                        style={{
                          padding: "0.28rem 0.75rem",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#fff",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          backdropFilter: "blur(8px)",
                        }}
                      >
                        {currentSlide.meta?.price_label ||
                          currentSlide.meta?.location}
                      </span>
                    )}
                  </div>

                  <h2
                    style={{
                      fontSize: "1.65rem",
                      fontWeight: 900,
                      lineHeight: 1.05,
                      color: "#fff",
                      margin: "0 0 0.5rem",
                      textTransform: "uppercase",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: (currentSlide.title || "TÍTULO DEL SLIDE").replace(
                        /<\/?(h1|h2|h3|h4|p|div|span)[^>]*>/gi,
                        ""
                      ),
                    }}
                  />

                  {currentSlide.subtitle && (
                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "rgba(255,255,255,0.78)",
                        margin: "0 0 1rem",
                        maxWidth: "460px",
                      }}
                    >
                      {currentSlide.subtitle}
                    </p>
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "0.65rem",
                      flexWrap: "wrap",
                    }}
                  >
                    {currentSlide.primary_button_text && (
                      <span
                        style={{
                          padding: "0.6rem 1.15rem",
                          borderRadius: "0.55rem",
                          background: "#D90416",
                          color: "#fff",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                        }}
                      >
                        {currentSlide.primary_button_text}
                      </span>
                    )}
                    {currentSlide.secondary_button_text && (
                      <span
                        style={{
                          padding: "0.6rem 1.15rem",
                          borderRadius: "0.55rem",
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.25)",
                          color: "#fff",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                        }}
                      >
                        {currentSlide.secondary_button_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
