import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddToCartClient from "./AddToCartClient";
import ProductGalleryClient from "./ProductGalleryClient";
import HorizontalScroll from "@/components/ui/HorizontalScroll";
import styles from "@/app/(public)/page.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("merch_products")
    .select("title")
    .eq("slug", (await params).slug)
    .single();

  if (!product) return { title: "Producto no encontrado | Bassfactory" };
  return { title: `${product.title} | Bassfactory Merch` };
}

export default async function MerchProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const supabase = await createClient();
  const slug = (await params).slug;

  const [productRes, relatedRes] = await Promise.all([
    supabase
      .from("merch_products")
      .select(`
        *,
        merch_categories(name, slug),
        merch_product_images(image_url, sort_order, is_primary),
        merch_product_variants(id, name, stock_quantity, price_override)
      `)
      .eq("slug", slug)
      .single(),
    supabase
      .from("merch_products")
      .select(`
        id,
        title,
        slug,
        base_price,
        merch_product_images(image_url, is_primary, sort_order)
      `)
      .eq("status", "published")
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const product = productRes.data;
  if (!product) {
    notFound();
  }

  const images =
    product.merch_product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const primaryImage =
    images.find((i: any) => i.is_primary)?.image_url || images[0]?.image_url || null;
  const variants = product.merch_product_variants || [];
  const relatedProducts = relatedRes.data || [];

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "1.25rem 1rem 3.5rem" }}>
      {/* Clean Top Bar (replaces broken breadcrumb!) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          marginBottom: "1.25rem",
        }}
      >
        <Link
          href="/merch"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "0.4rem 0.8rem",
            borderRadius: "8px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "white",
            fontSize: "0.76rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Volver a Merch
        </Link>

        {product.merch_categories?.name && (
          <Link
            href={`/merch?category=${encodeURIComponent(product.merch_categories.name)}`}
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--color-magenta)",
              backgroundColor: "rgba(229, 9, 20, 0.1)",
              border: "1px solid rgba(229, 9, 20, 0.25)",
              padding: "0.3rem 0.75rem",
              borderRadius: "999px",
              textDecoration: "none",
            }}
          >
            {product.merch_categories.name}
          </Link>
        )}
      </div>

      {/* Main 2-column Product Stage (No heavy wrapper box!) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "2rem",
          alignItems: "start",
          marginBottom: relatedProducts.length > 0 ? "2.5rem" : 0,
        }}
      >
        <ProductGalleryClient
          title={product.title}
          images={images}
          primaryImage={primaryImage}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.95rem",
            paddingTop: "0.25rem",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(1.4rem, 2.5vw, 1.9rem)",
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.15,
              color: "white",
            }}
          >
            {product.title}
          </h1>

          <AddToCartClient
            product={product}
            variants={variants}
            primaryImage={primaryImage}
          />

          {product.description && (
            <div
              style={{
                marginTop: "0.35rem",
                paddingTop: "0.95rem",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.4rem",
                }}
              >
                Descripción
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.55,
                  fontSize: "0.86rem",
                }}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Related Products Slider (Home Scale) */}
      {relatedProducts.length > 0 && (
        <div style={{ paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <HorizontalScroll title="Más de Merch" viewAllLink="/merch" canvasIcon="prism">
            {relatedProducts.map((item: any) => {
              const img =
                item.merch_product_images?.find((i: any) => i.is_primary)?.image_url ||
                item.merch_product_images?.[0]?.image_url ||
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400";
              return (
                <Link key={item.id} href={`/merch/${item.slug}`} className={styles.card}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={item.title} className={styles.cardImage} />
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardSubtitle} style={{ flex: 1 }}>
                    ${Number(item.base_price || 0).toLocaleString("es-CO")}
                  </p>
                  <span className={styles.cardButton}>Ver</span>
                </Link>
              );
            })}
          </HorizontalScroll>
        </div>
      )}
    </div>
  );
}
