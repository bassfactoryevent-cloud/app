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

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
            <Megaphone size={32} />
            Pautas Publicitarias
          </h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Gestiona las campañas y banners del sitio web.</p>
        </div>
        <Link href="/admin/ads/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} />
          Nueva Campaña
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {campaigns?.map((camp: any) => (
          <div key={camp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{camp.name}</h3>
                <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: camp.is_active ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)', color: camp.is_active ? '#4ade80' : 'white' }}>
                  {camp.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={14} /> {camp.client_name || 'Agencia Interna'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={14} /> {new Date(camp.start_date).toLocaleDateString()} {camp.end_date && `- ${new Date(camp.end_date).toLocaleDateString()}`}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 800 }}>{camp.ads[0]?.count || 0}</span>
                <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Banners</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link href={`/admin/ads/${camp.id}`} style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}>
                  Gestionar
                </Link>
                <form action={async () => {
                  "use server";
                  await deleteCampaign(camp.id);
                }}>
                  <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}

        {(!campaigns || campaigns.length === 0) && (
          <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
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
