"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Music, Ticket, Briefcase, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import TiptapEditor from "../../components/TiptapEditor";
import Link from "next/link";

type TicketData = { id?: string, name: string, price: number, quantity: number, sales_start: string, sales_end: string };

export default function EventFormClient({ djs, sponsors, initialData }: { djs: any[], sponsors: any[], initialData?: any }) {
  const router = useRouter();
  
  const [description, setDescription] = useState(initialData?.description || "");
  const [isFree, setIsFree] = useState(initialData?.is_free || false);
  
  const defaultTickets = initialData?.ticket_tiers?.map((t: any) => ({
    id: t.id,
    name: t.name,
    price: parseFloat(t.price),
    quantity: t.quantity_available,
    sales_start: t.sales_start ? new Date(t.sales_start).toISOString().slice(0, 16) : "",
    sales_end: t.sales_end ? new Date(t.sales_end).toISOString().slice(0, 16) : "",
  })) || [];

  const [tickets, setTickets] = useState<TicketData[]>(defaultTickets);
  const [selectedDjs, setSelectedDjs] = useState<string[]>(initialData?.djs || []);
  const [selectedSponsors, setSelectedSponsors] = useState<string[]>(initialData?.sponsors || []);

  const addTicket = () => setTickets([...tickets, { name: "Nueva Etapa", price: 50000, quantity: 100, sales_start: "", sales_end: "" }]);
  const updateTicket = (index: number, field: string, value: string | number) => {
    const newTickets = [...tickets];
    newTickets[index] = { ...newTickets[index], [field]: value };
    setTickets(newTickets);
  };
  const removeTicket = (index: number) => setTickets(tickets.filter((_, i) => i !== index));

  const toggleDj = (id: string) => {
    if (selectedDjs.includes(id)) setSelectedDjs(selectedDjs.filter(x => x !== id));
    else setSelectedDjs([...selectedDjs, id]);
  };

  const toggleSponsor = (id: string) => {
    if (selectedSponsors.includes(id)) setSelectedSponsors(selectedSponsors.filter(x => x !== id));
    else setSelectedSponsors([...selectedSponsors, id]);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().slice(0, 16);
  };

  return (
    <form action="/api/admin/events" method="POST" onSubmit={async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      formData.set("description", description);
      formData.set("tickets_json", JSON.stringify(tickets));
      formData.set("djs_json", JSON.stringify(selectedDjs));
      formData.set("sponsors_json", JSON.stringify(selectedSponsors));
      if (initialData?.id) {
        formData.set("event_id", initialData.id);
      }

      const { createEvent } = await import("../actions");
      try {
        await createEvent(formData);
      } catch (err) {
        console.error(err);
        alert("Error guardando evento");
      }
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <Link href="/admin/events" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-magenta)', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Volver a eventos
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={28} /> {initialData ? 'Editar Evento' : 'Crear Nuevo Evento'}</h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Configura toda la información, boletas y line up del evento.</p>
        </div>
        <button type="submit" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'var(--color-magenta)', color: 'white',
          padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)',
          border: 'none', fontWeight: 600, cursor: 'pointer'
        }}>
          <Save size={18} /> {initialData ? 'Guardar Cambios' : 'Publicar Evento'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Columna Principal */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Info Básica */}
          <div style={{ backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>Información Básica</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Título del Evento *</label>
                <input type="text" name="title" defaultValue={initialData?.title} required placeholder="Ej. Bassfactory 5th Anniversary" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>URL Slug *</label>
                <input type="text" name="slug" defaultValue={initialData?.slug} required placeholder="ej-bassfactory-5-aniversario" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Inicio</label>
                  <input type="datetime-local" name="start_date" defaultValue={formatDateForInput(initialData?.start_date)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Fin</label>
                  <input type="datetime-local" name="end_date" defaultValue={formatDateForInput(initialData?.end_date)} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Lugar / Club</label>
                  <input type="text" name="location_name" defaultValue={initialData?.location_name} placeholder="Ej. Kaputt Club" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Dirección</label>
                  <input type="text" name="location_address" defaultValue={initialData?.location_address} placeholder="Ej. Calle 73 # 10-83" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>URL de Portada (Flyer)</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="url" name="cover_image" defaultValue={initialData?.cover_image} placeholder="https://..." style={{ flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div style={{ backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>Descripción del Evento</h2>
            <TiptapEditor content={description} onChange={setDescription} />
          </div>

          {/* Ticketing */}
          <div style={{ backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Boletería (Ticketing) y Etapas</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" name="is_free" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
                Evento Gratuito
              </label>
            </div>
            
            {!isFree && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {tickets.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: 'rgba(128,128,128,0.05)', padding: '1.5rem', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Categoría (Ej. Lanzamiento)</label>
                          <input type="text" value={t.name} onChange={e => updateTicket(idx, 'name', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Precio ($)</label>
                          <input type="number" value={t.price} onChange={e => updateTicket(idx, 'price', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Aforo</label>
                          <input type="number" value={t.quantity} onChange={e => updateTicket(idx, 'quantity', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                        </div>
                        <button type="button" onClick={() => removeTicket(idx)} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', backgroundColor: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Inicio de Ventas</label>
                          <input type="datetime-local" value={t.sales_start} onChange={e => updateTicket(idx, 'sales_start', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', opacity: 0.7 }}>Fin de Ventas</label>
                          <input type="datetime-local" value={t.sales_end} onChange={e => updateTicket(idx, 'sales_end', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addTicket} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 'var(--radius-md)', color: 'inherit', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <Plus size={16} /> Añadir Nueva Etapa de Boleta
                </button>
              </>
            )}
            {isFree && (
              <p style={{ opacity: 0.7 }}>El evento es gratuito. No se cobrará en la pasarela de pagos, pero los usuarios se registrarán para obtener su QR de acceso gratuito.</p>
            )}
          </div>
        </div>

        {/* Columna Lateral */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ backgroundColor: 'var(--color-white)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}><Music size={20} /> Line Up (DJs)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
              {djs.length === 0 ? <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>No hay DJs. Créalos en la pestaña DJs.</p> : djs.map(dj => (
                <label key={dj.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(128,128,128,0.05)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedDjs.includes(dj.id)} onChange={() => toggleDj(dj.id)} />
                  {dj.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-white)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(128,128,128,0.1)', paddingBottom: '0.5rem' }}><Briefcase size={20} /> Patrocinadores</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
              {sponsors.length === 0 ? <p style={{ opacity: 0.5, fontSize: '0.875rem' }}>No hay marcas. Créalas en Patrocinadores.</p> : sponsors.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: 'rgba(128,128,128,0.05)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedSponsors.includes(s.id)} onChange={() => toggleSponsor(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-white)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(128,128,128,0.2)' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Estado de Publicación</label>
            <select name="status" defaultValue={initialData?.status || "draft"} style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'inherit' }}>
              <option value="draft">Borrador (Oculto)</option>
              <option value="published">Publicado (En Vivo)</option>
            </select>
          </div>

        </div>
      </div>
    </form>
  );
}

