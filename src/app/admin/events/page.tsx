import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Calendar, Plus, MapPin, Ticket } from "lucide-react";
import { deleteEvent } from "./actions";

export default async function AdminEvents() {
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("*, ticket_tiers(id), orders(id)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={28} /> Eventos y Boletería</h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Administra tus eventos, aforos, ventas y códigos QR.</p>
        </div>
        <Link href="/admin/events/new" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'var(--color-magenta)', color: 'white',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
          textDecoration: 'none', fontWeight: 600
        }}>
          <Plus size={18} /> Crear Evento
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        {!events || events.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', gridColumn: '1 / -1' }}>
            <Calendar size={48} opacity={0.2} style={{ marginBottom: '1rem' }} />
            <h3>No hay eventos creados</h3>
            <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Empieza a planificar tu próximo show y vender boletas.</p>
            <Link href="/admin/events/new" style={{ color: 'var(--color-magenta)' }}>Crear mi primer evento</Link>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid rgba(128,128,128,0.2)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '160px', backgroundColor: 'rgba(0,0,0,0.1)', position: 'relative' }}>
                {event.cover_image ? (
                  <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                    <Calendar size={48} />
                  </div>
                )}
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: event.status === 'published' ? '#10b981' : 'rgba(0,0,0,0.6)', color: 'white' }}>
                  {event.status.toUpperCase()}
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{event.title}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.7, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> 
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Fecha por definir'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} /> 
                    {event.location_name || 'Locación secreta'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-magenta)' }}>
                    <Ticket size={16} /> 
                    {event.is_free ? 'Entrada Libre' : `${event.ticket_tiers?.length || 0} Tipos de Boleta`}
                  </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(128,128,128,0.1)', paddingTop: '1rem' }}>
                  <Link href={`/admin/events/${event.id}`} style={{ flex: 1, textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(128,128,128,0.1)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit', fontSize: '0.875rem' }}>
                    Editar
                  </Link>
                  <Link href={`/admin/events/${event.id}/scanner`} style={{ flex: 1, textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--color-magenta)', color: 'white', borderRadius: 'var(--radius-md)', textDecoration: 'none', fontSize: '0.875rem' }}>
                    Escáner QR
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
