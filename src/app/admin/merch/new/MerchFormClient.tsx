"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Image as ImageIcon, Tag, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import TiptapEditor from "../../components/TiptapEditor";
import Link from "next/link";

type VariantData = { name: string, quantity: number, price_override: string };

export default function MerchFormClient({ categories, initialData }: { categories: any[], initialData?: any }) {
  const router = useRouter();
  
  const [description, setDescription] = useState(initialData?.description || "");
  
  const defaultVariants = initialData?.merch_product_variants?.map((v: any) => ({
    name: v.name,
    quantity: v.stock_quantity,
    price_override: v.price_override ? v.price_override.toString() : "",
  })) || [];

  const defaultImages = initialData?.merch_product_images?.map((img: any) => img.image_url) || [];

  const [variants, setVariants] = useState<VariantData[]>(defaultVariants);
  const [images, setImages] = useState<string[]>(defaultImages);

  const addVariant = () => setVariants([...variants, { name: "Talla M", quantity: 10, price_override: "" }]);
  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };
  const removeVariant = (index: number) => setVariants(variants.filter((_, i) => i !== index));

  const addImage = () => setImages([...images, ""]);
  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };
  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));

  return (
    <form action="/api/admin/merch" method="POST" onSubmit={async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      formData.set("description", description);
      formData.set("variants_json", JSON.stringify(variants));
      formData.set("images_json", JSON.stringify(images));
      if (initialData?.id) {
        formData.set("product_id", initialData.id);
      }

      const { saveMerchProduct } = await import("../actions");
      try {
        await saveMerchProduct(formData);
      } catch (err) {
        console.error(err);
        alert("Error guardando producto de merch");
      }
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/admin/merch" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-magenta)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Volver a Inventario
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={28} /> {initialData ? 'Editar Producto' : 'Crear Nuevo Producto'}</h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Configura tallas, imágenes y el precio de tu merch.</p>
        </div>
        <button type="submit" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'var(--color-magenta)', color: 'white',
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
          border: 'none', fontWeight: 600, cursor: 'pointer'
        }}>
          <Save size={18} /> {initialData ? 'Guardar Cambios' : 'Publicar Producto'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Columna Principal */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Info Básica */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>Información Básica</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre del Producto *</label>
                <input type="text" name="title" defaultValue={initialData?.title} required placeholder="Ej. Hoodie Bassfactory Classic" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>URL Slug *</label>
                  <input type="text" name="slug" defaultValue={initialData?.slug} required placeholder="hoodie-classic" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Precio Base ($) *</label>
                  <input type="number" name="base_price" defaultValue={initialData?.base_price} required placeholder="Ej. 120000" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>Descripción Detallada</h2>
            <TiptapEditor content={description} onChange={setDescription} />
          </div>

          {/* Variantes / Inventario */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Variedades e Inventario (Tallas/Colores)</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {variants.map((v, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', backgroundColor: 'rgba(128,128,128,0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Nombre Variante (Ej. Talla L)</label>
                    <input type="text" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Stock (Uds)</label>
                    <input type="number" value={v.quantity} onChange={e => updateVariant(idx, 'quantity', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Precio Específico (Opcional)</label>
                    <input type="number" value={v.price_override} onChange={e => updateVariant(idx, 'price_override', e.target.value)} placeholder="Ej. 130000" style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                  </div>
                  <button type="button" onClick={() => removeVariant(idx)} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addVariant} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-md)', color: 'inherit', cursor: 'pointer', fontSize: '0.875rem' }}>
              <Plus size={16} /> Añadir Variante / Talla
            </button>
          </div>

        </div>

        {/* Columna Lateral */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}><Tag size={20} /> Categoría y Estado</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Categoría</label>
                <select name="category_id" defaultValue={initialData?.category_id || ""} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}>
                  <option value="">Sin categoría</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Estado</label>
                <select name="status" defaultValue={initialData?.status || "draft"} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}>
                  <option value="draft">Borrador (Oculto)</option>
                  <option value="published">Publicado (A la venta)</option>
                  <option value="out_of_stock">Agotado Temporalmente</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}><ImageIcon size={20} /> Galería de Imágenes</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1rem' }}>La primera imagen será la principal del producto.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {images.map((img, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="url" value={img} onChange={e => updateImage(idx, e.target.value)} placeholder="https://..." style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                  <button type="button" onClick={() => removeImage(idx)} style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-md)', color: 'inherit', cursor: 'pointer', fontSize: '0.875rem' }}>
              <Plus size={16} /> Añadir Imagen
            </button>
          </div>

        </div>
      </div>
    </form>
  );
}
