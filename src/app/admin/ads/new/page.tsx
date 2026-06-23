import { Megaphone } from "lucide-react";
import Link from "next/link";
import { createCampaign } from "../actions";

export default function NewCampaignPage() {
  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/ads" style={{ color: 'var(--color-magenta)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: '1rem', display: 'inline-block' }}>
          &larr; Volver a Campañas
        </Link>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem' }}>
          <Megaphone size={32} />
          Nueva Campaña
        </h1>
      </div>

      <form action={createCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nombre de la Campaña *</label>
          <input 
            type="text" 
            name="name" 
            required 
            placeholder="Ej. Lanzamiento Festival 2026"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }} 
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cliente / Agencia</label>
          <input 
            type="text" 
            name="client_name" 
            placeholder="Dejar en blanco si es pauta interna"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fecha de Inicio *</label>
            <input 
              type="date" 
              name="start_date" 
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fecha de Fin (Opcional)</label>
            <input 
              type="date" 
              name="end_date" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }} 
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
          Crear Campaña
        </button>

      </form>
    </div>
  );
}
