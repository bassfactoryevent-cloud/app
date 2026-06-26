import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { createDj } from "../../events/actions";

export default async function EditDjPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: dj } = await supabase
    .from("djs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!dj) {
    notFound();
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link 
          href="/admin/djs"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Editar Artista</h1>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>Actualiza la información del DJ.</p>
        </div>
      </div>

      <form action={async (formData) => {
          "use server";
          const { updateDj } = await import("../../events/actions");
          formData.append("dj_id", params.id);
          await updateDj(formData);
      }} style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="name" style={{ fontWeight: 600 }}>Nombre del DJ</label>
          <input 
            type="text" id="name" name="name" required defaultValue={dj.name}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="photo_url" style={{ fontWeight: 600 }}>URL de Foto</label>
          <input 
            type="url" id="photo_url" name="photo_url" defaultValue={dj.photo_url || ""}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label htmlFor="soundcloud_url" style={{ fontWeight: 600 }}>Soundcloud URL</label>
          <input 
            type="url" id="soundcloud_url" name="soundcloud_url" defaultValue={dj.soundcloud_url || ""}
            style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
          />
        </div>

        <button 
          type="submit"
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '1rem' }}
        >
          <Save size={18} /> Guardar Cambios
        </button>
      </form>
    </div>
  );
}
