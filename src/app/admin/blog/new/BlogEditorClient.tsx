"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Save, Image as ImageIcon, Loader2 } from "lucide-react";
import TiptapEditor from "../../components/TiptapEditor";

export default function BlogEditorClient({ 
  categories, 
  genres,
  tags,
  action 
}: { 
  categories: any[], 
  genres: any[],
  tags: any[],
  action: (formData: FormData) => void 
}) {
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const handleFileUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `blog_images/${fileName}`;

    const { data, error } = await supabase.storage
      .from("blog-media")
      .upload(filePath, file);

    if (error) {
      alert("Error subiendo imagen: " + error.message);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-media")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingCover(true);
    try {
      const url = await handleFileUpload(e.target.files[0]);
      setCoverImageUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingCover(false);
    }
  };

  return (
    <form action={action} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      
      {/* Columna Izquierda: Contenido Principal */}
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="title" style={{ fontWeight: 600 }}>Título del Artículo</label>
          <input 
            type="text" id="title" name="title" required 
            placeholder="Ej. El resurgir del Techno en Bogotá"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1.25rem', fontWeight: 600 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="slug" style={{ fontWeight: 600 }}>URL Slug</label>
          <input 
            type="text" id="slug" name="slug" required 
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
            id="excerpt" name="excerpt" rows={3}
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
                type="text" id="meta_title" name="meta_title"
                placeholder="Título para Google (Max 60 caracteres)"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="meta_description" style={{ fontWeight: 500, fontSize: '0.875rem' }}>Meta Descripción</label>
              <textarea 
                id="meta_description" name="meta_description" rows={2}
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
            <input type="checkbox" id="is_published" name="is_published" style={{ width: '1.2rem', height: '1.2rem' }} defaultChecked />
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
            {coverImageUrl ? (
              <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid rgba(128,128,128,0.2)' }}>
                <img src={coverImageUrl} alt="Portada" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            ) : null}
            
            <label style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)', width: '100%', textAlign: 'center' }}>
              {isUploadingCover ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
              {isUploadingCover ? "Subiendo..." : coverImageUrl ? "Cambiar Imagen" : "Subir Portada"}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverImageChange} disabled={isUploadingCover} />
            </label>
            <input type="hidden" name="cover_image" value={coverImageUrl} />
          </div>
        </div>

        {/* Caja de Categoría */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Categoría Principal</h3>
          
          <select 
            id="category_id" name="category_id" required
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
          >
            <option value="" disabled selected>Selecciona una categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Caja de Géneros */}
        <div style={{ backgroundColor: 'var(--color-bg)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.2)', paddingBottom: '0.5rem' }}>Géneros Musicales</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
            {genres.map(g => (
              <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" name="genres[]" value={g.id} />
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
                <input type="checkbox" name="tags[]" value={t.id} />
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
