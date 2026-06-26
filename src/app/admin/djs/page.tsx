import { createClient } from "@/utils/supabase/server";
import { createDj, deleteDj } from "../events/actions";
import { Music, PlusCircle, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/admin/ImageUpload";

export default async function AdminDjs() {
  const supabase = await createClient();
  const { data: djs, error } = await supabase
    .from("djs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Music size={28} /> Directorio de DJs</h1>
        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Administra los artistas para armar el Line Up de tus eventos.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Formulario */}
        <form action={createDj} style={{ flex: '1 1 300px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Añadir Artista</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Nombre del DJ</label>
              <input 
                type="text" id="name" name="name" required 
                placeholder="Ej. Charlotte de Witte"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ImageUpload name="photo_url" bucket="djs" label="URL de Foto (Opcional)" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="soundcloud_url" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Soundcloud URL (Opcional)</label>
              <input 
                type="url" id="soundcloud_url" name="soundcloud_url"
                placeholder="https://soundcloud.com/..."
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <button 
              type="submit"
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}
            >
              <PlusCircle size={18} /> Guardar DJ
            </button>
          </div>
        </form>

        {/* Lista */}
        <div style={{ flex: '2 1 400px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Artista</th>
                <th style={{ padding: '1rem' }}>Enlaces</th>
              </tr>
            </thead>
            <tbody>
              {error && <tr><td colSpan={2} style={{ padding: '1rem', color: 'red' }}>Error: {error.message}</td></tr>}
              {!djs || djs.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay DJs registrados.</td>
                </tr>
              ) : (
                djs.map((dj) => (
                  <tr key={dj.id} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {dj.photo_url ? <img src={dj.photo_url} alt={dj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={16} opacity={0.5} />}
                      </div>
                      <span style={{ fontWeight: 500 }}>{dj.name}</span>
                    </td>
                    <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      {dj.soundcloud_url ? <a href={dj.soundcloud_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-magenta)' }}>Soundcloud</a> : '-'}
                      <Link href={`/admin/djs/${dj.id}`} style={{ color: 'inherit', opacity: 0.7, marginLeft: '1rem' }}>
                        <Edit size={18} />
                      </Link>
                    </td>
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
