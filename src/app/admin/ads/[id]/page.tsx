import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Megaphone, Plus, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { addAdToCampaign, deleteAd, updateCampaign, updateAd } from "../actions";
import Image from "next/image";

export default async function CampaignDetailsPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ editBanner?: string }> }) {
  const supabase = await createClient();
  const { id } = await params;
  const { editBanner } = await searchParams;

  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select(`*, ads(*, ad_placements(name))`)
    .eq("id", id)
    .single();

  if (!campaign) notFound();

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/ads" style={{ color: 'var(--color-magenta)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem', display: 'inline-block' }}>
          &larr; Volver a Campañas
        </Link>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
          <Megaphone size={32} />
          {campaign.name}
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Detalles de Campaña */}
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Ajustes</h2>
          <form action={updateCampaign.bind(null, campaign.id)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nombre</label>
              <input type="text" name="name" defaultValue={campaign.name} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cliente</label>
              <input type="text" name="client_name" defaultValue={campaign.client_name || ''} style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fecha Inicio</label>
              <input type="date" name="start_date" defaultValue={campaign.start_date.split('T')[0]} required style={{ width: '100%', colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fecha Fin</label>
              <input type="date" name="end_date" defaultValue={campaign.end_date ? campaign.end_date.split('T')[0] : ''} style={{ width: '100%', colorScheme: 'dark' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" name="is_active" defaultChecked={campaign.is_active} id="active-check" />
              <label htmlFor="active-check" style={{ fontSize: '0.875rem' }}>Campaña Activa</label>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', alignSelf: 'flex-start' }}>Guardar Cambios</button>
          </form>
        </div>

        {/* Banners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {(() => {
            const editingAd = editBanner ? campaign.ads.find((ad: any) => ad.id === editBanner) : null;
            return (
              <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem' }}>{editingAd ? 'Editar Banner' : 'Añadir Banner'}</h2>
                  {editingAd && (
                    <Link href={`/admin/ads/${campaign.id}`} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>
                      Cancelar Edición
                    </Link>
                  )}
                </div>
                <form action={editingAd ? updateAd.bind(null, editingAd.id, campaign.id) : addAdToCampaign.bind(null, campaign.id)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ubicación (Placement) *</label>
                    <select name="placement_name" defaultValue={editingAd?.ad_placements?.name || "home_horizontal"} required style={{ width: '100%' }}>
                      <option value="home_horizontal">Home - Banner Inferior (Horizontal)</option>
                      <option value="home_horizontal_thin">Home - Banner Inferior Delgado (Bajo Eventos)</option>
                      <option value="home_sidebar">Home - Sidebar Derecho (Vertical)</option>
                      <option value="blog_horizontal">Blog - Banner en Artículo (Abajo)</option>
                      <option value="blog_in_content">Blog - Banner Medio (En el texto)</option>
                      <option value="event_horizontal">Eventos - Banner en Evento (Horizontal)</option>
                      <option value="events_sidebar">Eventos - Sidebar (Vertical)</option>
                      <option value="djs_banner">DJs - Banner Principal (Horizontal)</option>
                    </select>
                    <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.25rem' }}>El lugar donde aparecerá el anuncio en la web.</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL del Recurso (Imagen o Video MP4/WEBM) *</label>
                    <input type="url" name="image_url" defaultValue={editingAd?.image_url || ""} required placeholder="https://..." style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL de Destino (Link al hacer clic)</label>
                    <input type="url" name="target_url" defaultValue={editingAd?.target_url || ""} placeholder="https://..." style={{ width: '100%' }} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                    {editingAd ? 'Guardar Cambios' : <><Plus size={16} /> Añadir Banner</>}
                  </button>
                </form>
              </div>
            );
          })()}

          <div style={{ backgroundColor: 'var(--color-surface)', padding: '2rem', borderRadius: '1rem', border: '1px solid var(--color-border)', backdropFilter: 'blur(10px)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Banners Activos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {campaign.ads.map((ad: any) => {
                const isVideo = ad.image_url.toLowerCase().endsWith('.mp4') || ad.image_url.toLowerCase().endsWith('.webm');
                return (
                  <div key={ad.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', border: editBanner === ad.id ? '1px solid var(--color-magenta)' : '1px solid transparent' }}>
                    <div style={{ position: 'relative', width: '120px', height: '60px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      {isVideo ? (
                        <video src={ad.image_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Image src={ad.image_url} alt="Banner" fill style={{ objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Posición: {ad.ad_placements?.name}</p>
                      <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', textDecoration: 'none', wordBreak: 'break-all' }}>
                        {ad.target_url || 'Sin enlace'}
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/admin/ads/${campaign.id}?editBanner=${ad.id}`} style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#fbbf24', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Pencil size={18} />
                      </Link>
                      <form action={deleteAd.bind(null, ad.id, campaign.id)}>
                        <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={20} />
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
              {campaign.ads.length === 0 && (
                <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem 0' }}>No hay banners en esta campaña.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
