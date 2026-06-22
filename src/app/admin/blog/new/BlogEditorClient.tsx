"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/utils/supabase/client";
import { Save, Image as ImageIcon, Loader2 } from "lucide-react";
// Importar CSS requerido por react-md-editor
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamic import para evitar errores de SSR con MDEditor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function BlogEditorClient({ 
  categories, 
  action 
}: { 
  categories: any[], 
  action: (formData: FormData) => void 
}) {
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [inlineImageUrl, setInlineImageUrl] = useState("");

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

  const onInlineImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingInline(true);
    try {
      const url = await handleFileUpload(e.target.files[0]);
      setInlineImageUrl(`![Imagen](${url})`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingInline(false);
    }
  };

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="title" style={{ fontWeight: 600 }}>Título del Artículo</label>
        <input 
          type="text" id="title" name="title" required 
          placeholder="Ej. El resurgir del Techno en Bogotá"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <label htmlFor="slug" style={{ fontWeight: 600 }}>URL Slug</label>
          <input 
            type="text" id="slug" name="slug" required 
            placeholder="ej-el-resurgir-del-techno"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <label htmlFor="category_id" style={{ fontWeight: 600 }}>Categoría</label>
          <select 
            id="category_id" name="category_id" required
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
          >
            <option value="" disabled selected>Selecciona una categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontWeight: 600 }}>Imagen de Portada</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            {isUploadingCover ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
            {isUploadingCover ? "Subiendo..." : "Subir Portada"}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onCoverImageChange} disabled={isUploadingCover} />
          </label>
          {coverImageUrl && <span style={{ color: '#00A050', fontSize: '0.875rem' }}>✓ Portada subida exitosamente</span>}
        </div>
        <input type="hidden" name="cover_image" value={coverImageUrl} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <label style={{ fontWeight: 600 }}>Contenido (Editor Markdown)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ opacity: 0.7 }}>¿Necesitas una imagen en el texto?</span>
            <label style={{ cursor: 'pointer', color: 'var(--color-magenta)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {isUploadingInline ? <Loader2 className="animate-spin" size={14} /> : "Sube una aquí"}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onInlineImageChange} disabled={isUploadingInline} />
            </label>
          </div>
        </div>
        
        {inlineImageUrl && (
          <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Copia y pega esto en el editor: <code style={{ color: 'var(--color-magenta)', userSelect: 'all' }}>{inlineImageUrl}</code></span>
            <button type="button" onClick={() => setInlineImageUrl("")} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}>✕</button>
          </div>
        )}

        <div data-color-mode="dark">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || "")}
            height={400}
            style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}
          />
        </div>
        <input type="hidden" name="content" value={content} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
        <input type="checkbox" id="is_published" name="is_published" style={{ width: '1.2rem', height: '1.2rem' }} defaultChecked />
        <label htmlFor="is_published" style={{ fontWeight: 500 }}>Publicar inmediatamente</label>
      </div>

      <button 
        type="submit"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.8rem 1rem', borderRadius: 'var(--radius-md)', border: 'none', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}
      >
        <Save size={20} />
        Guardar Artículo
      </button>
    </form>
  );
}
