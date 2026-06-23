import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Plus, ShoppingCart, Tag, ListOrdered, Edit, Package } from "lucide-react";
import Image from "next/image";

export default async function MerchAdminPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("merch_products")
    .select(`
      *,
      merch_categories(name),
      merch_product_images(image_url)
    `)
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
            <ShoppingCart size={32} />
            Inventario de Merch
          </h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Administra los productos de tu tienda B2C.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin/merch/categories" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
            <Tag size={18} /> Categorías
          </Link>
          <Link href="/admin/merch/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
            <ListOrdered size={18} /> Órdenes
          </Link>
          <Link href="/admin/merch/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
            <Plus size={18} /> Nuevo Producto
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {products?.map((product: any) => {
          const primaryImage = product.merch_product_images?.find((img: any) => img.is_primary)?.image_url || product.merch_product_images?.[0]?.image_url;
          return (
            <div key={product.id} style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{ height: '200px', backgroundColor: 'rgba(0,0,0,0.5)', position: 'relative' }}>
                {primaryImage ? (
                  <Image src={primaryImage} alt={product.title} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                    <Package size={48} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', backgroundColor: product.status === 'published' ? '#22c55e' : '#ef4444', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                  {product.status === 'published' ? 'Público' : 'Oculto'}
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {product.merch_categories?.name || 'Sin Categoría'}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{product.title}</h3>
                <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.875rem' }}>
                  Precio base: ${parseFloat(product.base_price).toLocaleString('es-CO')}
                </p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                  <Link href={`/admin/merch/${product.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontSize: '0.875rem' }}>
                    <Edit size={16} /> Editar Producto
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        {products?.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay productos aún</h3>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Empieza a añadir artículos a tu tienda de merch.</p>
            <Link href="/admin/merch/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
              <Plus size={18} /> Crear el primer producto
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
