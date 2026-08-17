import { createClient } from "@/utils/supabase/server";
import { Music, Edit, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import DjForm from "./DjForm";
import DeleteDjButton from "./DeleteDjButton";

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
        <DjForm />

        {/* Lista */}
        <div style={{ flex: '2 1 400px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Artista</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
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
                      <div>
                        <span style={{ fontWeight: 500, display: 'block' }}>{dj.name}</span>
                        <span style={{ fontSize: '0.75rem', color: dj.type === 'colectivo' ? 'var(--color-magenta)' : 'var(--color-text-secondary)' }}>
                          {dj.type === 'colectivo' ? 'Colectivo' : `Invitado (${dj.collective_name || 'Sin colectivo'})`}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                        {dj.soundcloud_url && (
                          <a href={dj.soundcloud_url} target="_blank" rel="noreferrer" title="Soundcloud" style={{ color: 'inherit', opacity: 0.6, padding: '0.25rem' }}>
                            <Music size={18} />
                          </a>
                        )}
                        {dj.type === 'colectivo' && dj.slug && (
                          <a href={`/djs/${dj.slug}`} target="_blank" rel="noreferrer" title="Ver EPK Público" style={{ color: 'var(--color-magenta)', opacity: 0.8, padding: '0.25rem' }}>
                            <ExternalLink size={18} />
                          </a>
                        )}
                        <Link href={`/admin/djs/${dj.id}`} title="Editar Perfil" style={{ color: 'inherit', opacity: 0.8, padding: '0.25rem' }}>
                          <Edit size={18} />
                        </Link>
                        <DeleteDjButton djId={dj.id} djName={dj.name} />
                      </div>
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
