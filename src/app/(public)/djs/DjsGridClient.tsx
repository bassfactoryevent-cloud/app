"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Music, Search, X, ArrowRight } from "lucide-react";
import styles from "./Djs.module.css";

interface DjsGridClientProps {
  djs: any[];
}

export default function DjsGridClient({ djs }: DjsGridClientProps) {
  const [search, setSearch] = useState("");

  const filteredDjs = useMemo(() => {
    if (!search.trim()) return djs;
    const q = search.toLowerCase().trim();
    return djs.filter(
      (dj) =>
        (dj.name || "").toLowerCase().includes(q) ||
        (dj.bio_short || "").toLowerCase().includes(q)
    );
  }, [djs, search]);

  return (
    <div>
      {djs.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", fontWeight: 600 }}>
            {filteredDjs.length} {filteredDjs.length === 1 ? "artista" : "artistas"}
          </span>

          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar artista..."
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
      )}

      {filteredDjs.length === 0 ? (
        <div className={styles.emptyState}>
          <Music
            size={34}
            style={{ margin: "0 auto 0.65rem", color: "var(--color-magenta)", opacity: 0.6 }}
          />
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
            {djs.length === 0 ? "Próximamente" : "No se encontraron artistas"}
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>
            {djs.length === 0
              ? "Estamos actualizando nuestro roster."
              : "Prueba con otro nombre."}
          </p>
        </div>
      ) : (
        <div className={styles.djsGrid}>
          {filteredDjs.map((dj: any) => {
            const targetHref = `/djs/${dj.slug || dj.id}`;
            return (
              <Link key={dj.id} href={targetHref} className={styles.djCard}>
                <div className={styles.imageWrapper}>
                  {dj.photo_url ? (
                    <Image
                      src={dj.photo_url}
                      alt={dj.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
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
