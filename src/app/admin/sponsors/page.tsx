import { createClient } from "@/utils/supabase/server";
import { createSponsor, deleteSponsor, updateSponsor } from "../events/actions";
import { Briefcase, PlusCircle, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import SubmitButton from "@/components/admin/SubmitButton";
import ImageUpload from "@/components/admin/ImageUpload";

export default async function AdminSponsors({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const supabase = await createClient();
  const { data: sponsors, error } = await supabase
    .from("sponsors")
    .select("*")
    .order("created_at", { ascending: false });

  const resolvedSearchParams = await searchParams;
  const editingSponsor = resolvedSearchParams.edit ? sponsors?.find(s => s.id === resolvedSearchParams.edit) : null;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Briefcase size={28} /> Patrocinadores (Sponsors)</h1>
        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Administra las marcas que apoyan tus eventos.</p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Formulario */}
        <ActionForm action={editingSponsor ? updateSponsor.bind(null, editingSponsor.id) : createSponsor} successMessage={editingSponsor ? "¡Patrocinador actualizado!" : "¡Patrocinador añadido!"} style={{ flex: '1 1 300px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>{editingSponsor ? "Editar Patrocinador" : "Añadir Patrocinador"}</h2>
            {editingSponsor && (
              <Link href="/admin/sponsors" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', textDecoration: 'underline' }}>
                Cancelar
              </Link>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="name" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Nombre de la Marca</label>
              <input 
                type="text" id="name" name="name" required defaultValue={editingSponsor?.name || ""}
                placeholder="Ej. Red Bull"
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="logo_url" style={{ fontWeight: 600, fontSize: '0.875rem' }}>URL del Logo (O súbelo)</label>
              <ImageUpload name="logo_url" bucket="sponsors" defaultImage={editingSponsor?.logo_url} label="Subir logo" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="website_url" style={{ fontWeight: 600, fontSize: '0.875rem' }}>Sitio Web (Opcional)</label>
              <input 
                type="url" id="website_url" name="website_url" defaultValue={editingSponsor?.website_url || ""}
                placeholder="https://..."
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>

            <SubmitButton style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}>
              <PlusCircle size={18} /> {editingSponsor ? "Guardar Cambios" : "Guardar Marca"}
            </SubmitButton>
          </div>
        </ActionForm>

        {/* Lista */}
        <div style={{ flex: '2 1 400px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'rgba(128,128,128,0.05)', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
              <tr>
                <th style={{ padding: '1rem' }}>Marca</th>
                <th style={{ padding: '1rem' }}>Sitio Web</th>
                <th style={{ padding: '1rem', width: '80px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {error && <tr><td colSpan={2} style={{ padding: '1rem', color: 'red' }}>Error: {error.message}</td></tr>}
              {!sponsors || sponsors.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>No hay patrocinadores registrados.</td>
                </tr>
              ) : (
                sponsors.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '60px', height: '40px', backgroundColor: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '0.25rem' }}>
                        <img src={s.logo_url} alt={s.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <span style={{ fontWeight: 500 }}>{s.name}</span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {s.website_url ? <a href={s.website_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-magenta)' }}>Visitar</a> : '-'}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link href={`/admin/sponsors?edit=${s.id}`} style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#fbbf24', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Pencil size={18} />
                        </Link>
                        <ActionForm action={deleteSponsor.bind(null, s.id)} successMessage="¡Patrocinador eliminado!">
                          <SubmitButton pendingText="" className="" style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={20} />
                          </SubmitButton>
                        </ActionForm>
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
