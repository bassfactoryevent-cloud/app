import { createClient } from "@/utils/supabase/server";
import { Megaphone, PlusCircle, Building2, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { deleteCampaign } from "./actions";

export default async function AdminAdsPage() {
  const supabase = await createClient();

  const { data: campaigns } = await supabase
    .from("ad_campaigns")
    .select(`
      *,
      ads (count)
    `)
    .order("created_at", { ascending: false });

  // Fetch active ads for the placements overview
  const { data: activeAds } = await supabase
    .from("ads")
    .select(`
      id,
      ad_placements!inner(name),
      ad_campaigns!inner(name, is_active, end_date)
    `)
    .eq("is_active", true)
    .eq("ad_campaigns.is_active", true);

  // Filter out expired campaigns for the overview
  const validActiveAds: any[] = (activeAds || []).filter((ad: any) => {
    // Handle both object and array responses from Supabase joins
    const campaign = Array.isArray(ad?.ad_campaigns) ? ad.ad_campaigns[0] : ad?.ad_campaigns;
    if (campaign && campaign.end_date) {
      if (new Date() > new Date(campaign.end_date)) {
        return false;
      }
    }
    return true;
  });

  const ALL_PLACEMENTS = [
    { id: 'home_horizontal', label: 'Home - Horizontal' },
    { id: 'home_sidebar', label: 'Home - Sidebar' },
    { id: 'blog_horizontal', label: 'Blog - Artículo' },
    { id: 'event_horizontal', label: 'Eventos - Horizontal' },
    { id: 'events_sidebar', label: 'Eventos - Sidebar' },
    { id: 'djs_banner', label: 'DJs - Banner' },
  ];

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
            <Megaphone size={32} />
            Pautas Publicitarias
          </h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Gestiona las campañas y la distribución de banners en el sitio.</p>
        </div>
        <Link href="/admin/ads/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} />
          Nueva Campaña
        </Link>
      </div>

      {/* OVERVIEW MAP */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Mapa de Ubicaciones</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {ALL_PLACEMENTS.map(placement => {
            const occupant = validActiveAds.find((ad: any) => {
              const pName = Array.isArray(ad?.ad_placements) ? ad.ad_placements[0]?.name : ad?.ad_placements?.name;
              return pName === placement.id;
            });
            const isOccupied = !!occupant;
            return (
              <div key={placement.id} style={{ 
                backgroundColor: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '0.75rem', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{placement.label}</span>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    backgroundColor: isOccupied ? 'var(--color-magenta)' : '#4ade80',
                    boxShadow: isOccupied ? '0 0 8px var(--color-magenta)' : '0 0 8px #4ade80'
                  }} />
                </div>
                {isOccupied ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Ocupado por: <br/>
                    <strong style={{ color: 'white' }}>
                      {Array.isArray(occupant?.ad_campaigns) ? occupant.ad_campaigns[0]?.name : occupant?.ad_campaigns?.name}
                    </strong>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>Disponible</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Lista de Campañas</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {campaigns?.map((camp: any) => (
          <div key={camp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)', padding: '1.5rem', transition: 'border-color 0.2s', backdropFilter: 'blur(10px)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{camp.name}</h3>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: camp.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', color: camp.is_active ? '#4ade80' : 'rgba(255,255,255,0.5)', border: camp.is_active ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.1)' }}>
                  {camp.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={14} /> {camp.client_name || 'Agencia Interna'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={14} /> {camp.start_date ? new Date(camp.start_date).toLocaleDateString() : 'N/A'} {camp.end_date && `- ${new Date(camp.end_date).toLocaleDateString()}`}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.5rem 1rem', borderRadius: '0.5rem' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800 }}>
                  {Array.isArray(camp?.ads) ? (camp.ads[0]?.count || 0) : (camp?.ads?.count || 0)}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Banners</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/ads/${camp.id}`} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                  Gestionar
                </Link>
                <form action={async () => {
                  "use server";
                  await deleteCampaign(camp.id);
                }}>
                  <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor='rgba(239,68,68,0.2)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor='rgba(239,68,68,0.1)'}>
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}

        {(!campaigns || campaigns.length === 0) && (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'var(--color-surface)', borderRadius: '1rem', border: '1px dashed var(--color-border)' }}>
            <Megaphone size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No hay campañas</h3>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Comienza creando tu primera campaña publicitaria.</p>
            <Link href="/admin/ads/new" className="btn btn-primary">
              Crear Campaña
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
