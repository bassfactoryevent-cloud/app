"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Music, Search, X, ArrowRight } from "lucide-react";
import styles from "./Djs.module.css";

interface DjsGridClientProps {
  djs: any[];
}

function parseGenres(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((g) => String(g).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
  }
  return [];
}

const DEFAULT_GENRE_FILTERS = ["Techno", "Hard Techno", "House", "Minimal"];

export default function DjsGridClient({ djs }: DjsGridClientProps) {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  // Collect genres from DB or fallback to core electronic genres
  const genreOptions = useMemo(() => {
    const set = new Set<string>();
    for (const dj of djs) {
      for (const g of parseGenres(dj.genres)) {
        set.add(g);
      }
    }
    if (set.size > 0) return Array.from(set).slice(0, 8);
    return DEFAULT_GENRE_FILTERS;
  }, [djs]);

  const filteredDjs = useMemo(() => {
    let base = djs;
    if (selectedGenre !== "all") {
      const gLower = selectedGenre.toLowerCase();
      base = base.filter((dj) => {
        const djGenres = parseGenres(dj.genres).map((g) => g.toLowerCase());
        const bio = `${dj.bio_short || ""} ${dj.bio_full || ""}`.toLowerCase();
        return djGenres.some((g) => g.includes(gLower)) || bio.includes(gLower);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      base = base.filter(
        (dj) =>
          (dj.name || "").toLowerCase().includes(q) ||
          (dj.bio_short || "").toLowerCase().includes(q) ||
          parseGenres(dj.genres).some((g) => g.toLowerCase().includes(q))
      );
    }
    return base;
  }, [djs, selectedGenre, search]);

  return (
    <div>
      {/* Compact Header + Search */}
      <header className={styles.heroSection}>
        <div>
          <h1 className={styles.heroTitle}>Artistas &amp; DJs</h1>
          <p className={styles.heroSubtitle}>
            Roster oficial, presskits y booking de Bassfactory.
          </p>
        </div>

        {djs.length > 0 && (
          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar artista o género..."
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
        )}
      </header>

      {/* Genre Filter Pills */}
      {djs.length > 0 && (
        <div className={styles.filterPills}>
          <button
            type="button"
            onClick={() => setSelectedGenre("all")}
            className={`${styles.filterPill} ${
              selectedGenre === "all" ? styles.filterPillActive : ""
            }`}
          >
            Todos ({djs.length})
          </button>
          {genreOptions.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`${styles.filterPill} ${
                selectedGenre === genre ? styles.filterPillActive : ""
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {filteredDjs.length === 0 ? (
        <div className={styles.emptyState}>
          <Music
            size={34}
            style={{ margin: "0 auto 0.65rem", color: "var(--color-magenta)", opacity: 0.6 }}
          />
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
            {djs.length === 0 ? "Próximamente" : "No hay artistas con este filtro"}
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem", margin: "0.25rem 0 0.85rem" }}>
            {djs.length === 0
              ? "Estamos actualizando nuestro roster."
              : "Prueba otro género o limpia la búsqueda."}
          </p>
          {djs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedGenre("all");
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
              Ver todos
            </button>
          )}
        </div>
      ) : (
        <div className={styles.djsGrid}>
          {filteredDjs.map((dj: any) => {
            const targetHref = `/djs/${dj.slug || dj.id}`;
            const djGenres = parseGenres(dj.genres).slice(0, 2);
            return (
              <Link key={dj.id} href={targetHref} className={styles.djCard}>
                <div className={styles.imageWrapper}>
                  {dj.photo_url ? (
                    <Image
                      src={dj.photo_url}
                      alt={dj.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className={styles.djImage}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        height: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.25,
                      }}
                    >
                      <Music size={36} />
                    </div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.djName}>{dj.name}</h3>
                  {djGenres.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "0.35rem" }}>
                      {djGenres.map((g) => (
                        <span key={g} className={styles.genreTag}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {dj.bio_short && <p className={styles.djBio}>{dj.bio_short}</p>}

                  <div className={styles.cardFooter}>
                    <span className={styles.rosterBadge}>Presskit</span>
                    <span className={styles.ctaBadge}>
                      Ver <ArrowRight size={12} />
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
