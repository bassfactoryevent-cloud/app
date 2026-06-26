import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

export const metadata = {
  title: "Tienda Oficial - Bassfactory",
  description: "Compra merch oficial, ropa, accesorios y vinilos de Bassfactory.",
};

export default async function MerchStorefront() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("merch_products")
    .select(`
      *,
      merch_categories(name),
      merch_product_images(image_url, is_primary, sort_order)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Ordenamos imágenes
  products?.forEach(p => {
    if (p.merch_product_images) {
      p.merch_product_images.sort((a: any, b: any) => a.sort_order - b.sort_order);
    }
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Merch <span style={{ color: 'var(--color-magenta)' }}>Oficial</span>
        </h1>
        <p style={{ opacity: 0.7, fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          Lleva la cultura de Bassfactory contigo. Descubre nuestra colección de ropa, accesorios y música.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .merch-card-inner:hover {
          transform: translateY(-5px);
          border-color: rgba(255,255,255,0.2) !important;
        }
      `}} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
        {products?.map((product: any) => {
          const primaryImage = product.merch_product_images?.find((img: any) => img.is_primary)?.image_url || product.merch_product_images?.[0]?.image_url;

          return (
            <Link key={product.id} href={`/merch/${product.slug}`} className="merch-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'pointer' }} className="merch-card-inner">
                <div style={{ height: '300px', backgroundColor: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                  {primaryImage ? (
                    <Image src={primaryImage} alt={product.title} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                      <Package size={64} />
                    </div>
                  )}
                  {product.status === 'out_of_stock' && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: 'rgba(0,0,0,0.8)', color: '#ef4444', padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 700, border: '1px solid #ef4444' }}>
                      Agotado
                    </div>
                  )}
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {product.merch_categories?.name || 'Colección'}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.2 }}>{product.title}</h3>
                  <p style={{ fontWeight: 800, fontSize: '1.25rem' }}>
                    ${parseFloat(product.base_price).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}

        {(!products || products.length === 0) && (
          <div style={{ gridColumn: '1 / -1', padding: '6rem 2rem', textAlign: 'center', opacity: 0.5 }}>
            <Package size={64} style={{ margin: '0 auto 1.5rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Próximamente</h3>
            <p>Estamos preparando la nueva colección. Vuelve pronto.</p>
          </div>
        )}
      </div>
    </div>
  );
}
