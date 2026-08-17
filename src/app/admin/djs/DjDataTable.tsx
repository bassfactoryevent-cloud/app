"use client";

import { useState, useMemo } from "react";
import { Music, Search, Filter, Plus, X, ExternalLink, Edit } from "lucide-react";
import Link from "next/link";
import DeleteDjButton from "./DeleteDjButton";
import DjForm from "./DjForm";

export default function DjDataTable({ initialDjs }: { initialDjs: any[] }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "colectivo" | "invitado">("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredDjs = useMemo(() => {
    return initialDjs.filter(dj => {
      const matchesSearch = dj.name.toLowerCase().includes(search.toLowerCase()) || 
                            (dj.collective_name && dj.collective_name.toLowerCase().includes(search.toLowerCase()));
      const matchesType = filterType === "all" || dj.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [initialDjs, search, filterType]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* HEADER CONTROLS */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          {/* SEARCH */}
          <div style={{ position: 'relative', flex: '1 1 250px', maxWidth: '400px' }}>
            <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
              <Search size={18} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por nombre o colectivo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
            />
          </div>

          {/* FILTER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <button 
              onClick={() => setFilterType('all')}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: filterType === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterType === 'all' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('colectivo')}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: filterType === 'colectivo' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterType === 'colectivo' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            >
              Colectivo
            </button>
            <button 
              onClick={() => setFilterType('invitado')}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: filterType === 'invitado' ? 'rgba(255,255,255,0.1)' : 'transparent', color: filterType === 'invitado' ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}
            >
              Invitados
            </button>
          </div>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', backgroundColor: showAddForm ? 'rgba(255,255,255,0.1)' : 'var(--color-magenta)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
        >
          {showAddForm ? <><X size={18} /> Cancelar</> : <><Plus size={18} /> Añadir DJ</>}
        </button>
      </div>

      {/* INLINE ADD FORM */}
      {showAddForm && (
        <div style={{ animation: 'fadeInDown 0.3s ease', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', padding: '2rem' }}>
          <DjForm />
        </div>
      )}

      {/* TABLE */}
      <div style={{ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
            <tr>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Artista</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>Categoría / Tipo</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textAlign: 'center' }}>Enlaces</th>
              <th style={{ padding: '1rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredDjs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Search size={48} opacity={0.5} />
                    <p>No se encontraron artistas que coincidan con la búsqueda.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredDjs.map((dj) => (
                <tr key={dj.id} style={{ borderBottom: '1px solid rgba(128,128,128,0.1)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.2)', border: '2px solid rgba(255,255,255,0.05)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {dj.photo_url ? <img src={dj.photo_url} alt={dj.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music size={20} opacity={0.5} />}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', fontSize: '1.05rem' }}>{dj.name}</span>
                        {dj.slug && <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>/{dj.slug}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {dj.type === 'colectivo' ? (
                      <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem', backgroundColor: 'rgba(233, 30, 99, 0.1)', color: 'var(--color-magenta)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(233, 30, 99, 0.2)' }}>
                        DJ Residente (EPK)
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ display: 'inline-block', width: 'fit-content', padding: '0.25rem 0.75rem', borderRadius: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                          Invitado Externo
                        </span>
                        {dj.collective_name && <span style={{ fontSize: '0.8rem', opacity: 0.7, paddingLeft: '0.25rem' }}>{dj.collective_name}</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      {dj.soundcloud_url && (
                        <a href={dj.soundcloud_url} target="_blank" rel="noreferrer" title="Soundcloud" style={{ color: 'inherit', opacity: 0.6, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}>
                          <Music size={18} />
                        </a>
                      )}
                      {dj.type === 'colectivo' && dj.slug && (
                        <a href={`/djs/${dj.slug}`} target="_blank" rel="noreferrer" title="Ver EPK Público" style={{ color: 'var(--color-magenta)', opacity: 0.8, transition: 'opacity 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}>
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/djs/${dj.id}`} title="Editar Perfil" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255,255,255,0.05)', color: 'white', transition: 'background-color 0.2s' }}>
                        <Edit size={16} />
                      </Link>
                      <DeleteDjButton djId={dj.id} djName={dj.name} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
