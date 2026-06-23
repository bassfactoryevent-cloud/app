import { createClient } from "@/utils/supabase/server";
import { createGenre } from "../actions";
import { Save, Music } from "lucide-react";

export default async function AdminGenres() {
  const supabase = await createClient();
  const { data: genres, error } = await supabase
    .from("genres")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Music size={28} /> Géneros Musicales</h1>
        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Administra los géneros musicales para clasificar los artículos del blog.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Formulario para Crear Género */}
        <form action={createGenre} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Nuevo Género</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Nombre del Género</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                required 
                placeholder="Ej. Techno"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="slug" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Slug (URL)</label>
              <input 
                type="text" 
                id="slug" 
                name="slug" 
                required 
                placeholder="techno"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <button 
              type="submit"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}
            >
              <Save size={18} /> Crear Género
            </button>
          </div>
        </form>

        {/* Lista de Géneros */}
        <div style={{ flex: 1, backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Género</th>
                <th style={{ padding: '1rem' }}>Slug</th>
              </tr>
            </thead>
            <tbody>
              {error && <tr><td colSpan={2} style={{ padding: '1rem', color: 'red' }}>Error cargando géneros.</td></tr>}
              {!genres || genres.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay géneros.</td>
                </tr>
              ) : (
                genres.map((cat) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{cat.name}</td>
                    <td style={{ padding: '1rem', opacity: 0.7 }}>{cat.slug}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
