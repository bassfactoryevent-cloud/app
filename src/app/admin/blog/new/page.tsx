import { createBlogPost } from "../actions";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NewBlogPost() {
  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin/blog" style={{ color: 'inherit', opacity: 0.7 }}>
          <ArrowLeft size={24} />
        </Link>
        <h1>Crear Nuevo Artículo</h1>
      </div>

      <form action={createBlogPost} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--color-bg)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="title" style={{ fontWeight: 600 }}>Título del Artículo</label>
          <input 
            type="text" 
            id="title" 
            name="title" 
            required 
            placeholder="Ej. El resurgir del Techno en Bogotá"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="slug" style={{ fontWeight: 600 }}>URL Slug (Identificador)</label>
          <input 
            type="text" 
            id="slug" 
            name="slug" 
            required 
            placeholder="ej-el-resurgir-del-techno"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
          />
          <small style={{ opacity: 0.6 }}>Esta será la URL del artículo: bassfactory.com/blog/tu-slug</small>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="cover_image" style={{ fontWeight: 600 }}>URL de la Imagen de Portada</label>
          <input 
            type="url" 
            id="cover_image" 
            name="cover_image" 
            placeholder="https://..."
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="content" style={{ fontWeight: 600 }}>Contenido (Soporta Markdown Básico)</label>
          <textarea 
            id="content" 
            name="content" 
            required 
            rows={12}
            placeholder="Escribe el contenido de tu artículo aquí..."
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'inherit', fontSize: '1rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" id="is_published" name="is_published" style={{ width: '1.2rem', height: '1.2rem' }} />
          <label htmlFor="is_published" style={{ fontWeight: 500 }}>Publicar inmediatamente</label>
        </div>

        <button 
          type="submit"
          style={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: 'var(--color-magenta)', 
            color: 'white', 
            padding: '0.8rem 1rem', 
            borderRadius: 'var(--radius-md)',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          <Save size={20} />
          Guardar Artículo
        </button>
      </form>
    </div>
  );
}
