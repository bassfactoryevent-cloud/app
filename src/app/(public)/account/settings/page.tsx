import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  async function updateProfile(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return;

    const full_name = formData.get("full_name") as string;
    
    await supabaseServer.from("profiles").update({ full_name }).eq("id", user.id);
    revalidatePath("/account/settings");
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ajustes de Perfil</h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Actualiza tu información personal.</p>

      <div style={{ maxWidth: '600px', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <form action={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, opacity: 0.7 }}>Correo Electrónico (No modificable)</label>
            <input
              type="email"
              id="email"
              value={user.email}
              disabled
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white', opacity: 0.5, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <label htmlFor="full_name" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Nombre Completo</label>
            <input
              type="text"
              name="full_name"
              id="full_name"
              defaultValue={profile?.full_name || ''}
              required
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
            />
          </div>

          <button type="submit" style={{ padding: '1rem 2rem', backgroundColor: 'var(--color-magenta)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '1rem' }}>
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}
