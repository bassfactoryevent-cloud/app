import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Package, ArrowLeft } from "lucide-react";
import AddToCartClient from "./AddToCartClient";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const { data: product } = await supabase.from("merch_products").select("title, description").eq("slug", params.slug).single();
  
  if (!product) return { title: "Producto no encontrado - Bassfactory" };
  return { title: `${product.title} - Bassfactory Merch` };
}

export default async function MerchProductPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("merch_products")
    .select(`
      *,
      merch_categories(name, slug),
      merch_product_images(image_url, sort_order, is_primary),
      merch_product_variants(id, name, stock_quantity, price_override)
    `)
    .eq("slug", params.slug)
    .single();

  if (!product) {
    notFound();
  }

  // Ordenar imágenes y variantes
  const images = product.merch_product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
  const primaryImage = images.find((i: any) => i.is_primary)?.image_url || images[0]?.image_url || null;
  const variants = product.merch_product_variants || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.875rem', opacity: 0.7 }}>
        <Link href="/merch" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <ArrowLeft size={14} /> Volver a la Tienda
        </Link>
        <span><ChevronRight size={14} /></span>
        {product.merch_categories && (
          <>
            <span>{product.merch_categories.name}</span>
            <span><ChevronRight size={14} /></span>
          </>
        )}
        <span style={{ color: 'var(--color-magenta)' }}>{product.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Imágenes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            {primaryImage ? (
              <Image src={primaryImage} alt={product.title} fill style={{ objectFit: 'cover' }} priority />
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                <Package size={64} />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {images.map((img: any, idx: number) => (
                <div key={idx} style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0, borderRadius: '0.5rem', overflow: 'hidden', border: img.image_url === primaryImage ? '2px solid var(--color-magenta)' : '2px solid transparent', cursor: 'pointer', transition: 'border-color 0.2s' }}>
                  <Image src={img.image_url} alt={`${product.title} thumbnail ${idx}`} fill style={{ objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna Derecha: Info y Add to Cart */}
        <div>
          {product.merch_categories && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-magenta)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {product.merch_categories.name}
            </div>
          )}
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.1 }}>{product.title}</h1>
          
          <AddToCartClient product={product} variants={variants} primaryImage={primaryImage} />

          <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Descripción</h3>
            <div 
              style={{ opacity: 0.8, lineHeight: 1.6, fontSize: '1.1rem' }}
              dangerouslySetInnerHTML={{ __html: product.description || '<p>No hay descripción disponible.</p>' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
