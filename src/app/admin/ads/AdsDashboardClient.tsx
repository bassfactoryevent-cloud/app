"use client";

import { useState } from "react";
import { Megaphone, PlusCircle, Building2, Calendar as CalendarIcon, GripVertical, X } from "lucide-react";
import Link from "next/link";
import { deleteCampaign, addAdToCampaign } from "./actions";

const ALL_PLACEMENTS = [
  { id: 'home_horizontal', label: 'Home - Horizontal' },
  { id: 'home_sidebar', label: 'Home - Sidebar' },
  { id: 'blog_horizontal', label: 'Blog - Artículo (Abajo)' },
  { id: 'blog_in_content', label: 'Blog - Banner Medio (En el texto)' },
  { id: 'event_horizontal', label: 'Eventos - Horizontal' },
  { id: 'events_sidebar', label: 'Eventos - Sidebar' },
  { id: 'djs_banner', label: 'DJs - Banner' },
];

export default function AdsDashboardClient({ campaigns, validActiveAds }: { campaigns: any[], validActiveAds: any[] }) {
  const [draggedCampaign, setDraggedCampaign] = useState<any | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, campaign: any) => {
    setDraggedCampaign(campaign);
    e.dataTransfer.setData("campaignId", campaign.id);
    // Needed for Firefox
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedCampaign(null);
    setDragOverId(null);
  };

  const handleDragOver = (e: React.DragEvent, placementId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (dragOverId !== placementId) {
      setDragOverId(placementId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, placementId: string) => {
    e.preventDefault();
    if (dragOverId === placementId) {
      setDragOverId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, placementId: string) => {
    e.preventDefault();
    setDragOverId(null);
    if (draggedCampaign) {
      setDropTarget(placementId);
      setModalOpen(true);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!draggedCampaign || !dropTarget) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("placement_name", dropTarget);

    try {
      await addAdToCampaign(draggedCampaign.id, formData);
      setModalOpen(false);
      // Wait a bit to let server action revalidate
    } catch (error) {
      console.error(error);
      alert("Error al asignar banner");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
            <Megaphone size={32} />
            Pautas Publicitarias
          </h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Gestiona las campañas. Arrastra una campaña hacia el mapa para asignar banners.</p>
        </div>
        <Link href="/admin/ads/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} />
          Nueva Campaña
        </Link>
      </div>

      {/* OVERVIEW MAP (Dropzones) */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Mapa de Ubicaciones (Zonas de Aterrizaje)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {ALL_PLACEMENTS.map(placement => {
            const occupant = validActiveAds.find((ad: any) => {
              const pName = Array.isArray(ad?.ad_placements) ? ad.ad_placements[0]?.name : ad?.ad_placements?.name;
              return pName === placement.id;
            });
            const isOccupied = !!occupant;
            const isDragOver = dragOverId === placement.id;
            
            return (
              <div 
                key={placement.id} 
                onDragOver={(e) => handleDragOver(e, placement.id)}
                onDragLeave={(e) => handleDragLeave(e, placement.id)}
                onDrop={(e) => handleDrop(e, placement.id)}
                style={{ 
                  backgroundColor: isDragOver ? 'rgba(255, 0, 255, 0.05)' : 'rgba(255,255,255,0.02)', 
                  border: isDragOver ? '2px dashed var(--color-magenta)' : '2px dashed rgba(255,255,255,0.1)', 
                  borderRadius: '0.75rem', 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{placement.label}</span>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
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
                  <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>Disponible (Arrastra aquí)</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* LISTA DE CAMPAÑAS (Draggables) */}
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Lista de Campañas (Fichas)</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {campaigns?.map((camp: any) => {
          let isExpired = false;
          if (camp.end_date) {
            isExpired = new Date() > new Date(camp.end_date);
          }
          const isDragging = draggedCampaign?.id === camp.id;

          return (
            <div 
              key={camp.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, camp)}
              onDragEnd={handleDragEnd}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                backgroundColor: 'var(--color-surface)', 
                borderRadius: '1rem', 
                border: '1px solid var(--color-border)', 
                padding: '1.5rem', 
                transition: 'all 0.2s', 
                backdropFilter: 'blur(10px)',
                cursor: 'grab',
                opacity: isDragging ? 0.4 : (isExpired ? 0.6 : 1),
                transform: isDragging ? 'scale(0.98)' : 'scale(1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ cursor: 'grab', color: 'var(--color-text-secondary)' }}>
                  <GripVertical size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textDecoration: isExpired ? 'line-through' : 'none' }}>{camp.name}</h3>
                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', backgroundColor: isExpired ? 'rgba(255,0,0,0.1)' : (camp.is_active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)'), color: isExpired ? '#ef4444' : (camp.is_active ? '#4ade80' : 'rgba(255,255,255,0.5)'), border: isExpired ? '1px solid rgba(255,0,0,0.2)' : (camp.is_active ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.1)') }}>
                      {isExpired ? 'Vencida' : (camp.is_active ? 'Activa' : 'Inactiva')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Building2 size={14} /> {camp.client_name || 'Agencia Interna'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CalendarIcon size={14} /> {camp.start_date ? new Date(camp.start_date).toLocaleDateString() : 'N/A'} {camp.end_date && `- ${new Date(camp.end_date).toLocaleDateString()}`}</span>
                  </div>
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
                  <form action={deleteCampaign.bind(null, camp.id)}>
                    <button type="submit" style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}

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

      {/* MODAL ASIGNAR BANNER */}
      {modalOpen && draggedCampaign && dropTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setModalOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Asignar Banner</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem' }}>
              Campaña: <strong>{draggedCampaign.name}</strong> <br/>
              Ubicación: <strong>{ALL_PLACEMENTS.find(p => p.id === dropTarget)?.label}</strong>
            </p>

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL del Recurso (Imagen o Video MP4/WEBM) *</label>
                <input type="url" name="image_url" required placeholder="https://..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>URL de Destino (Link al hacer clic)</label>
                <input type="url" name="target_url" placeholder="https://..." style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ marginTop: '1rem', opacity: isSubmitting ? 0.5 : 1 }}>
                {isSubmitting ? 'Guardando...' : 'Asignar Banner'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
