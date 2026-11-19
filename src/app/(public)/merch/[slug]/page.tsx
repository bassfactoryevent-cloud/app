import { createClient } from "@/utils/supabase/server";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";
import AddToCartClient from "./AddToCartClient";
import ProductGalleryClient from "./ProductGalleryClient";

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

  const { data: product } = await supabase
    .from("merch_products")
    .select(`
      *,
      merch_categories(name, slug),
      merch_product_images(image_url, sort_order, is_primary),
      merch_product_variants(id, name, stock_quantity, price_override)
    `)
    .eq("slug", (await params).slug)
    .single();

  if (!product) {
    notFound();
  }

  const images =
    product.merch_product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const primaryImage =
    images.find((i: any) => i.is_primary)?.image_url || images[0]?.image_url || null;
  const variants = product.merch_product_variants || [];

  return (
    <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>
      {/* Breadcrumbs */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.4rem",
          marginBottom: "1.25rem",
          fontSize: "0.78rem",
          color: "var(--color-text-secondary)",
        }}
      >
        <Link
          href="/merch"
          style={{
            color: "inherit",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={13} /> Merch
        </Link>
        <ChevronRight size={13} />
        {product.merch_categories && (
          <>
            <span>{product.merch_categories.name}</span>
            <ChevronRight size={13} />
          </>
        )}
        <span style={{ color: "white", fontWeight: 600 }}>{product.title}</span>
      </div>

      {/* Main 2-column Product Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        <ProductGalleryClient
          title={product.title}
          images={images}
          primaryImage={primaryImage}
        />

        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "12px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.85rem",
          }}
        >
          {product.merch_categories && (
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--color-magenta)",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {product.merch_categories.name}
            </span>
          )}

          <h1
            style={{
              fontSize: "clamp(1.35rem, 2.5vw, 1.85rem)",
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
                marginTop: "0.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "var(--color-text-secondary)",
                  marginBottom: "0.4rem",
                }}
              >
                Detalles
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.82)",
                  lineHeight: 1.55,
                  fontSize: "0.86rem",
                }}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
