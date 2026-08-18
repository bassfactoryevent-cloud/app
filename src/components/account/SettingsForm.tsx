"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/admin/ImageUpload";
import { createClient } from "@/utils/supabase/client";

export default function SettingsForm({ user, profile }: { user: any; profile: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const full_name = formData.get("full_name") as string;
    const avatar_url = formData.get("avatar_url") as string;

    try {
      const { error } = await supabase.from("profiles").update({
        full_name,
        avatar_url
      }).eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil actualizado correctamente");
      
      // Emit event so layout.tsx can refresh avatar
      window.dispatchEvent(new Event("profile_updated"));
      
      // Refresh server state
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al guardar el perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <ImageUpload 
          bucket="events" 
          name="avatar_url"
          defaultImage={profile?.avatar_url || ""}
          label="Foto de Perfil (Opcional)"
        />
      </div>
      
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

      <button type="submit" disabled={isLoading} style={{ padding: '1rem 2rem', backgroundColor: 'var(--color-magenta)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s', marginTop: '1rem', opacity: isLoading ? 0.7 : 1 }}>
        {isLoading ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
}
