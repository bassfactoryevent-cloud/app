import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Plus, ShoppingCart, Tag, ListOrdered } from "lucide-react";
import MerchAdminList from "./MerchAdminList";

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

  const { data: categories } = await supabase
    .from("merch_categories")
    .select("*")
    .order("name", { ascending: true });

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

      <MerchAdminList products={products || []} categories={categories || []} />
    </div>
  );
}
