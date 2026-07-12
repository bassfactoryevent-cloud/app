import { createClient } from "@/utils/supabase/server";
import { Tag, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createMerchCategory, deleteMerchCategory } from "../actions";

export default async function MerchCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("merch_categories").select("*").order("name");

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/merch" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-magenta)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Volver a Inventario
        </Link>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag size={28} /> Categorías de Merch
        </h1>
        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Crea clasificaciones para tus productos (ej. Ropa, Accesorios, Vinilos).</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Formulario de Creación */}
        <form action={createMerchCategory} style={{ flex: 1, backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>Nueva Categoría</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre *</label>
              <input type="text" name="name" required placeholder="Ej. Camisetas" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Slug *</label>
              <input type="text" name="slug" required placeholder="camisetas" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Descripción (opcional)</label>
              <textarea name="description" rows={3} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit', resize: 'vertical' }}></textarea>
            </div>
            <button type="submit" style={{ padding: '0.75rem', backgroundColor: 'var(--color-magenta)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' }}>
              Crear Categoría
            </button>
          </div>
        </form>

        {/* Lista de Categorías */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {categories?.map((cat: any) => (
            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{cat.name}</h3>
                <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>/{cat.slug}</p>
                {cat.description && <p style={{ opacity: 0.7, fontSize: '0.875rem', marginTop: '0.5rem' }}>{cat.description}</p>}
              </div>
              <form action={deleteMerchCategory.bind(null, cat.id)}>
                <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </form>
            </div>
          ))}
          {categories?.length === 0 && (
            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No has creado ninguna categoría todavía.</p>
          )}
        </div>
      </div>
    </div>
  );
}
