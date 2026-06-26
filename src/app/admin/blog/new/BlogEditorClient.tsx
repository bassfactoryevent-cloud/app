"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Save, Image as ImageIcon, Loader2 } from "lucide-react";
import TiptapEditor from "../../components/TiptapEditor";
import ImageUpload from "@/components/admin/ImageUpload";

export default function BlogEditorClient({ 
  categories, 
  genres,
  tags,
  initialData,
  action 
}: { 
  categories: any[], 
  genres: any[],
  tags: any[],
  initialData?: any,
  action: (formData: FormData) => void 
}) {
  const supabase = createClient();
  const [content, setContent] = useState(initialData?.content || "");
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.cover_image || "");
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      const { optimizeImage } = await import("@/utils/imageOptimizer");
      const compressedFile = await optimizeImage(file);

      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `blog_images/${fileName}`;

      const { data, error } = await supabase.storage
        .from("blog-media")
        .upload(filePath, compressedFile);

      if (error) {
        alert("Error subiendo imagen: " + error.message);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("blog-media")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return (
    <form action={action} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      
      {/* Columna Izquierda: Contenido Principal */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="title" style={{ fontWeight: 600 }}>Título del Artículo</label>
          <input 
            type="text" id="title" name="title" required defaultValue={initialData?.title}
            placeholder="Ej. El resurgir del Techno en Bogotá"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1.25rem', fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="slug" style={{ fontWeight: 600 }}>URL Slug</label>
          <input 
            type="text" id="slug" name="slug" required defaultValue={initialData?.slug}
            placeholder="ej-el-resurgir-del-techno"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontWeight: 600 }}>Contenido del Artículo (Visual)</label>
          <TiptapEditor 
            content={content} 
            onChange={setContent} 
            onImageUpload={handleFileUpload}
          />
          <input type="hidden" name="content" value={content} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="excerpt" style={{ fontWeight: 600 }}>Resumen Corto (Excerpt)</label>
          <textarea 
            id="excerpt" name="excerpt" rows={3} defaultValue={initialData?.excerpt}
            placeholder="Un resumen atractivo para la tarjeta del blog..."
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem', resize: 'vertical' }}
          />
        </div>

        {/* SEO Settings */}
        <div style={{ marginTop: '1rem', padding: '1.5rem', backgroundColor: 'rgba(128,128,128,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.1)' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Optimización para Buscadores (SEO)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="meta_title" style={{ fontWeight: 500, fontSize: '0.875rem' }}>Meta Título</label>
              <input 
                type="text" id="meta_title" name="meta_title" defaultValue={initialData?.meta_title}
                placeholder="Título para Google (Max 60 caracteres)"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="meta_description" style={{ fontWeight: 500, fontSize: '0.875rem' }}>Meta Descripción</label>
              <textarea 
                id="meta_description" name="meta_description" rows={2} defaultValue={initialData?.meta_description}
                placeholder="Descripción para Google (Max 160 caracteres)"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit', resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Columna Derecha: Sidebar (Taxonomías y Publicación) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Caja de Publicación */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Publicación</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input type="checkbox" id="is_published" name="is_published" style={{ width: '1.2rem', height: '1.2rem' }} defaultChecked={initialData ? initialData.is_published : true} />
            <label htmlFor="is_published" style={{ fontWeight: 500 }}>Publicar Inmediatamente</label>
          </div>

          <button 
            type="submit"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={20} />
            Guardar Artículo
          </button>
        </div>

        {/* Caja de Portada */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Imagen Destacada</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ImageUpload 
              name="cover_image"
              bucket="blog-media" 
              defaultImage={coverImageUrl} 
              label="Sube la imagen principal" 
              onUploadSuccess={(url) => setCoverImageUrl(url)} 
            />
          </div>
        </div>

        {/* Caja de Categoría */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Categoría Principal</h3>
          
          <select 
            id="category_id" name="category_id" required defaultValue={initialData?.category_id || ""}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
          >
            <option value="" disabled>Selecciona una categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Caja de Géneros */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Géneros Musicales</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
            {genres.map(g => (
              <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" name="genres[]" value={g.id} defaultChecked={initialData?.genres?.includes(g.id)} />
                {g.name}
              </label>
            ))}
            {genres.length === 0 && <span style={{ opacity: 0.5, fontSize: '0.875rem' }}>No hay géneros creados.</span>}
          </div>
        </div>

        {/* Caja de Etiquetas */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Etiquetas (Tags)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
            {tags.map(t => (
              <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" name="tags[]" value={t.id} defaultChecked={initialData?.tags?.includes(t.id)} />
                {t.name}
              </label>
            ))}
            {tags.length === 0 && <span style={{ opacity: 0.5, fontSize: '0.875rem' }}>No hay etiquetas creadas.</span>}
          </div>
        </div>

      </div>
    </form>
  );
}
