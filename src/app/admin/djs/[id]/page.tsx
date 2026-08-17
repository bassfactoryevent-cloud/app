import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, User, Music, Globe, FileText } from "lucide-react";
import { updateDjEPK } from "../actions";
import ImageUpload from "@/components/admin/ImageUpload";

export default async function EditDjPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();

  const { data: dj } = await supabase
    .from("djs")
    .select("*")
    .eq("id", (await params).id)
    .single();

  if (!dj) {
    notFound();
  }

  const isColectivo = dj.type === 'colectivo';

  return (
    <div style={{ maxWidth: '900px', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link 
          href="/admin/djs"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Editar {isColectivo ? 'Presskit (EPK)' : 'Artista Invitado'}</h1>
          <p style={{ opacity: 0.7, marginTop: '0.25rem' }}>{dj.name} {isColectivo ? '' : `(${dj.collective_name || 'Sin Colectivo'})`}</p>
        </div>
      </div>

      <form action={updateDjEPK.bind(null, dj.id)} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SECCIÓN BÁSICA */}
        <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={20} /> Perfil Básico</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="name" style={{ fontWeight: 600 }}>Nombre del DJ</label>
              <input type="text" id="name" name="name" required defaultValue={dj.name}
                style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
              />
            </div>
            {isColectivo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="slug" style={{ fontWeight: 600 }}>Slug (URL) ej: charlotte-de-witte</label>
                <input type="text" id="slug" name="slug" defaultValue={dj.slug || ""}
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ImageUpload name="photo_url" bucket="djs" defaultImage={dj.photo_url} label="Foto Principal (Perfil)" />
            </div>
            {isColectivo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ImageUpload name="cover_image" bucket="djs" defaultImage={dj.cover_image} label="Imagen de Portada (Header Gigante)" />
              </div>
            )}
          </div>
        </section>

        {isColectivo && (
          <>
            {/* SECCIÓN BIOGRAFÍA */}
            <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={20} /> Presskit & Contacto</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="bio_short" style={{ fontWeight: 600 }}>Eslogan / Biografía Corta (Max 1-2 líneas)</label>
                  <input type="text" id="bio_short" name="bio_short" defaultValue={dj.bio_short || ""}
                    placeholder="Resumen en una frase..."
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="bio_full" style={{ fontWeight: 600 }}>Biografía Completa</label>
                  <textarea id="bio_full" name="bio_full" defaultValue={dj.bio_full || ""} rows={6}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit', resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="contact_email" style={{ fontWeight: 600 }}>Email Booking</label>
                    <input type="email" id="contact_email" name="contact_email" defaultValue={dj.contact_email || ""}
                      style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="contact_phone" style={{ fontWeight: 600 }}>Teléfono / WhatsApp</label>
                    <input type="text" id="contact_phone" name="contact_phone" defaultValue={dj.contact_phone || ""}
                      style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="tech_rider_url" style={{ fontWeight: 600 }}>URL del Tech Rider (PDF Drive/Dropbox)</label>
                  <input type="url" id="tech_rider_url" name="tech_rider_url" defaultValue={dj.tech_rider_url || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN MÚSICA */}
            <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Music size={20} /> Plataformas de Música</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="soundcloud_url" style={{ fontWeight: 600 }}>Soundcloud URL</label>
                  <input type="url" id="soundcloud_url" name="soundcloud_url" defaultValue={dj.soundcloud_url || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="music_spotify" style={{ fontWeight: 600 }}>Spotify URL</label>
                  <input type="url" id="music_spotify" name="music_spotify" defaultValue={dj.music_spotify || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="music_beatport" style={{ fontWeight: 600 }}>Beatport URL</label>
                  <input type="url" id="music_beatport" name="music_beatport" defaultValue={dj.music_beatport || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="music_apple" style={{ fontWeight: 600 }}>Apple Music URL</label>
                  <input type="url" id="music_apple" name="music_apple" defaultValue={dj.music_apple || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="music_youtube" style={{ fontWeight: 600 }}>YouTube URL</label>
                  <input type="url" id="music_youtube" name="music_youtube" defaultValue={dj.music_youtube || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
              </div>
            </section>

            {/* SECCIÓN REDES */}
            <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={20} /> Redes Sociales</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="social_instagram" style={{ fontWeight: 600 }}>Instagram URL</label>
                  <input type="url" id="social_instagram" name="social_instagram" defaultValue={dj.social_instagram || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="social_tiktok" style={{ fontWeight: 600 }}>TikTok URL</label>
                  <input type="url" id="social_tiktok" name="social_tiktok" defaultValue={dj.social_tiktok || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="social_facebook" style={{ fontWeight: 600 }}>Facebook URL</label>
                  <input type="url" id="social_facebook" name="social_facebook" defaultValue={dj.social_facebook || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="social_x" style={{ fontWeight: 600 }}>X (Twitter) URL</label>
                  <input type="url" id="social_x" name="social_x" defaultValue={dj.social_x || ""}
                    style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                  />
                </div>
              </div>
            </section>
          </>
        )}
        
        {/* If Not Colectivo, just basic Soundcloud */}
        {!isColectivo && (
          <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Music size={20} /> Datos Adicionales</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="soundcloud_url" style={{ fontWeight: 600 }}>Soundcloud URL (Opcional)</label>
                <input type="url" id="soundcloud_url" name="soundcloud_url" defaultValue={dj.soundcloud_url || ""}
                  style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}
                />
              </div>
            </div>
          </section>
        )}

        <div style={{ position: 'sticky', bottom: '2rem', backgroundColor: 'var(--color-background)', padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'flex-end', zIndex: 10 }}>
          <button 
            type="submit"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', padding: '1rem 2rem', borderRadius: 'var(--radius-md)', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '1.1rem' }}
          >
            <Save size={20} /> Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  );
}
