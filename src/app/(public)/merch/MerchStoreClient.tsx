"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Package, Search, X, ArrowRight } from "lucide-react";
import styles from "./Merch.module.css";

interface MerchStoreClientProps {
  products: any[];
}

export default function MerchStoreClient({ products }: MerchStoreClientProps) {
  const searchParams = useSearchParams();
  const initialCat = searchParams?.get("category") || "all";
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const cat = p.merch_categories?.name;
      if (cat) {
        map.set(cat, (map.get(cat) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let base = products;
    if (selectedCategory !== "all") {
      base = base.filter((p) => p.merch_categories?.name === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      base = base.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.merch_categories?.name || "").toLowerCase().includes(q)
      );
    }
    return base;
  }, [products, selectedCategory, search]);

  return (
    <div>
      {/* Filter & Search Bar */}
      {(categories.length > 0 || products.length > 0) && (
        <div className={styles.filterBar}>
          <div className={styles.filterPills}>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`${styles.filterPill} ${
                selectedCategory === "all" ? styles.filterPillActive : ""
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`${styles.filterPill} ${
                  selectedCategory === cat.name ? styles.filterPillActive : ""
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          <div className={styles.searchWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
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

      {/* Grid */}
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package
            size={34}
            style={{ margin: "0 auto 0.65rem", color: "var(--color-magenta)", opacity: 0.6 }}
          />
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
            {products.length === 0
              ? "Próximamente"
              : "No hay productos con este filtro"}
          </div>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.8rem",
              margin: "0.25rem 0 0.85rem",
            }}
          >
            {products.length === 0
              ? "Estamos preparando la nueva colección."
              : "Prueba limpiando la búsqueda o cambiando de categoría."}
          </p>
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
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
              Ver todo
            </button>
          )}
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {filteredProducts.map((product: any) => {
            const primaryImage =
              product.merch_product_images?.find((img: any) => img.is_primary)
                ?.image_url || product.merch_product_images?.[0]?.image_url;

            return (
              <Link
                key={product.id}
                href={`/merch/${product.slug}`}
                className={styles.productCard}
              >
                <div className={styles.imageWrapper}>
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, 220px"
                      className={styles.productImage}
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
                      <Package size={36} />
                    </div>
                  )}
                  {product.status === "out_of_stock" && (
                    <div className={styles.outOfStockBadge}>Agotado</div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.categoryTag}>
                    {product.merch_categories?.name || "Colección"}
                  </div>
                  <h3 className={styles.productTitle}>{product.title}</h3>
                  <div className={styles.cardFooter}>
                    <span className={styles.priceTag}>
                      ${parseFloat(product.base_price || 0).toLocaleString("es-CO")}
                    </span>
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
