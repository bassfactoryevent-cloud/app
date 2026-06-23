import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { addAdToCampaign, deleteAd, updateCampaign } from "../actions";
import Image from "next/image";

export default async function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("ad_campaigns")
    .select(`*, ads(*, ad_placements(name))`)
    .eq("id", params.id)
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
        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Ajustes</h2>
          <form action={updateCampaign.bind(null, campaign.id)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nombre</label>
              <input type="text" name="name" defaultValue={campaign.name} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cliente</label>
              <input type="text" name="client_name" defaultValue={campaign.client_name || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fecha Inicio</label>
              <input type="date" name="start_date" defaultValue={campaign.start_date.split('T')[0]} required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fecha Fin</label>
              <input type="date" name="end_date" defaultValue={campaign.end_date ? campaign.end_date.split('T')[0] : ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <input type="checkbox" name="is_active" defaultChecked={campaign.is_active} id="active-check" />
              <label htmlFor="active-check" style={{ fontSize: '0.875rem' }}>Campaña Activa</label>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Guardar Cambios</button>
          </form>
        </div>

        {/* Banners */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Añadir Banner</h2>
            <form action={addAdToCampaign.bind(null, campaign.id)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ubicación (Placement) *</label>
                <select name="placement_name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'black', color: 'white' }}>
                  <option value="home_hero">Home Hero Banner</option>
                  <option value="events_sidebar">Events Sidebar</option>
                  <option value="merch_top">Merch Top Banner</option>
                  <option value="djs_banner">DJs Page Banner</option>
                </select>
                <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.25rem' }}>El lugar donde aparecerá el anuncio en la web.</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL de la Imagen *</label>
                <input type="url" name="image_url" required placeholder="https://..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL de Destino (Link al hacer clic)</label>
                <input type="url" name="target_url" placeholder="https://..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Añadir Banner
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Banners Activos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              {campaign.ads.map((ad: any) => (
                <div key={ad.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div style={{ position: 'relative', width: '120px', height: '60px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem', overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={ad.image_url} alt="Banner" fill style={{ objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Posición: {ad.ad_placements?.name}</p>
                    <a href={ad.target_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--color-magenta)', textDecoration: 'none' }}>
                      {ad.target_url || 'Sin enlace'}
                    </a>
                  </div>
                  <form action={async () => {
                    "use server";
                    await deleteAd(ad.id, campaign.id);
                  }}>
                    <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={20} />
                    </button>
                  </form>
                </div>
              ))}
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
