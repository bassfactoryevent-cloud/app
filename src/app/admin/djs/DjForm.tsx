"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { createDj } from "./actions";

export default function DjForm() {
  const [type, setType] = useState<"colectivo" | "invitado">("colectivo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form 
      action={async (formData) => {
        setIsSubmitting(true);
        try {
          await createDj(formData);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSubmitting(false);
        }
      }} 
      style={{ flex: '1 1 300px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 700 }}>Añadir Artista</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* TIPO DE ARTISTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-magenta)' }}>¿Qué tipo de DJ deseas crear?</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.5rem 1rem', backgroundColor: type === 'colectivo' ? 'rgba(255,255,255,0.1)' : 'transparent', border: type === 'colectivo' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
              <input type="radio" name="type" value="colectivo" checked={type === "colectivo"} onChange={() => setType("colectivo")} style={{ display: 'none' }} />
              Del Colectivo (EPK)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', padding: '0.5rem 1rem', backgroundColor: type === 'invitado' ? 'rgba(255,255,255,0.1)' : 'transparent', border: type === 'invitado' ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
              <input type="radio" name="type" value="invitado" checked={type === "invitado"} onChange={() => setType("invitado")} style={{ display: 'none' }} />
              Invitado Externo
            </label>
          </div>
        </div>

        {/* NOMBRE (SIEMPRE VISIBLE) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Nombre del DJ</label>
          <input 
            type="text" id="name" name="name" required 
            placeholder="Ej. Charlotte de Witte"
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
          />
        </div>

        {/* CAMPOS SOLO PARA INVITADOS */}
        {type === "invitado" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="collective_name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Colectivo / Agencia</label>
              <input 
                type="text" id="collective_name" name="collective_name"
                placeholder="Ej. Awakenings, Drumcode..."
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ImageUpload name="photo_url" bucket="djs" label="Foto del DJ (Recomendado)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="soundcloud_url" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Soundcloud URL (Opcional)</label>
              <input 
                type="url" id="soundcloud_url" name="soundcloud_url"
                placeholder="https://soundcloud.com/..."
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>
          </div>
        )}

        {/* MENSAJE EXPLICATIVO PARA COLECTIVO */}
        {type === "colectivo" && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(255,255,255,0.1)', fontSize: '0.875rem', opacity: 0.8, animation: 'fadeIn 0.3s ease' }}>
            Los DJs del colectivo requieren mucha más información para armar su Presskit (EPK). Al hacer clic en continuar, irás a la página de edición completa para subir su biografía, fotos, redes sociales y más.
          </div>
        )}

        <button 
          type="submit"
          disabled={isSubmitting}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.875rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', marginTop: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}
        >
          <PlusCircle size={18} /> 
          {isSubmitting ? 'Procesando...' : (type === 'colectivo' ? 'Guardar y Continuar al EPK' : 'Guardar DJ Invitado')}
        </button>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </form>
  );
}
