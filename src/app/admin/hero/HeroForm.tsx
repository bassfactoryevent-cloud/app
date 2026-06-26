"use client";

import { useState } from "react";
import { updateHeroSettings } from "./actions";
import { Save, Image as ImageIcon, Video, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function HeroForm({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState(initialData?.media_type || "image");
  const [tags, setTags] = useState<{text: string, url: string}[]>(initialData?.tags || []);
  
  const [newTagText, setNewTagText] = useState("");
  const [newTagUrl, setNewTagUrl] = useState("");

  const handleAddTag = () => {
    if (!newTagText.trim()) return;
    setTags([...tags, { text: newTagText, url: newTagUrl }]);
    setNewTagText("");
    setNewTagUrl("");
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append("tags", JSON.stringify(tags));

    const result = await updateHeroSettings(formData);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Banner actualizado correctamente");
    }
    
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
      
      {/* 1. Tipo de Media */}
      <section style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Fondo del Banner
        </h3>
        
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="media_type" value="image" checked={mediaType === "image"} onChange={() => setMediaType("image")} />
            <ImageIcon size={18} /> Imagen
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="media_type" value="video" checked={mediaType === "video"} onChange={() => setMediaType("video")} />
            <Video size={18} /> Video
          </label>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
            URL del {mediaType === "video" ? "Video (MP4 recomendado)" : "Archivo de Imagen"}
          </label>
          <input 
            type="url" 
            name="media_url" 
            defaultValue={initialData?.media_url} 
            required 
            placeholder={`Ej: https://.../fondo.${mediaType === "video" ? "mp4" : "jpg"}`}
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginTop: '0.5rem' }}>
            Pega aquí el enlace directo al archivo. Si el video es externo, asegúrate de que termine en .mp4.
          </p>
        </div>
      </section>

      {/* 2. Textos Principales */}
      <section style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Textos</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Título Principal</label>
            <textarea 
              name="title" 
              defaultValue={initialData?.title} 
              rows={4}
              style={{ width: '100%', fontFamily: 'monospace' }}
              placeholder="Puedes usar HTML como <br/> para saltos de línea"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Párrafo o Subtítulo</label>
            <input 
              type="text" 
              name="subtitle" 
              defaultValue={initialData?.subtitle || ""} 
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </section>

      {/* 3. Botones */}
      <section style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Botones de Acción</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Primary */}
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Botón Principal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Texto del Botón</label>
                <input type="text" name="primary_button_text" defaultValue={initialData?.primary_button_text || ""} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>URL o Ruta</label>
                <input type="text" name="primary_button_url" defaultValue={initialData?.primary_button_url || ""} style={{ width: '100%' }} placeholder="/events" />
              </div>
            </div>
          </div>

          {/* Secondary */}
          <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ marginBottom: '1rem' }}>Botón Secundario (Opcional)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Texto del Botón</label>
                <input type="text" name="secondary_button_text" defaultValue={initialData?.secondary_button_text || ""} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>URL o Ruta</label>
                <input type="text" name="secondary_button_url" defaultValue={initialData?.secondary_button_url || ""} style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Etiquetas (Tags) */}
      <section style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Etiquetas (Tags) Flotantes</h3>
        <p style={{ opacity: 0.7, marginBottom: '1rem', fontSize: '0.875rem' }}>
          Agrega etiquetas opcionales que aparecerán encima del título (Ej: "#Techno", "Comprar Entradas").
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {tags.map((tag, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.5rem 0.25rem 1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: '100px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{tag.text}</span>
              <button type="button" onClick={() => handleRemoveTag(idx)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Texto del Tag</label>
            <input type="text" value={newTagText} onChange={e => setNewTagText(e.target.value)} style={{ width: '100%' }} placeholder="Ej: #Techno" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Link (Opcional)</label>
            <input type="text" value={newTagUrl} onChange={e => setNewTagUrl(e.target.value)} style={{ width: '100%' }} placeholder="/link" />
          </div>
          <button type="button" onClick={handleAddTag} style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Agregar
          </button>
        </div>
      </section>

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '1rem 2rem', backgroundColor: 'var(--color-magenta)', 
            color: 'white', border: 'none', borderRadius: 'var(--radius-md)', 
            fontWeight: 600, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          <Save size={20} /> {loading ? "Guardando..." : "Guardar Configuración"}
        </button>
      </div>

    </form>
  );
}
