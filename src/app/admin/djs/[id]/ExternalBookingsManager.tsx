"use client";

import { useState } from "react";
import { Plus, Trash2, Calendar } from "lucide-react";

export default function ExternalBookingsManager({ defaultBookings = [], internalBookings = [] }: { defaultBookings: any[], internalBookings: any[] }) {
  const [bookings, setBookings] = useState(defaultBookings);

  const addBooking = () => {
    setBookings([...bookings, { date: "", title: "", location: "", ticket_url: "" }]);
  };

  const removeBooking = (index: number) => {
    setBookings(bookings.filter((_, i) => i !== index));
  };

  const updateBooking = (index: number, field: string, value: string) => {
    const newBookings = [...bookings];
    newBookings[index][field] = value;
    setBookings(newBookings);
  };

  return (
    <section style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={20} /> Bookings Externos & Tour Dates
      </h2>
      
      <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Agrega eventos en los que el DJ participa fuera de la programación oficial de Bassfactory.
      </p>

      {/* Hidden input to submit the JSON back to the server action */}
      <input type="hidden" name="external_bookings" value={JSON.stringify(bookings)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {bookings.map((booking, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr 2fr auto', gap: '1rem', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(128,128,128,0.2)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Fecha y Hora</label>
              <input 
                type="datetime-local" 
                value={booking.date} 
                onChange={(e) => updateBooking(index, 'date', e.target.value)}
                required
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.3)', backgroundColor: 'transparent', color: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Nombre del Evento</label>
              <input 
                type="text" 
                placeholder="Ej. Awakenings Festival"
                value={booking.title} 
                onChange={(e) => updateBooking(index, 'title', e.target.value)}
                required
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.3)', backgroundColor: 'transparent', color: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Locación / Ciudad</label>
              <input 
                type="text" 
                placeholder="Amsterdam, NL"
                value={booking.location} 
                onChange={(e) => updateBooking(index, 'location', e.target.value)}
                required
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.3)', backgroundColor: 'transparent', color: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Ticket URL (Opcional)</label>
              <input 
                type="url" 
                placeholder="https://..."
                value={booking.ticket_url} 
                onChange={(e) => updateBooking(index, 'ticket_url', e.target.value)}
                style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(128,128,128,0.3)', backgroundColor: 'transparent', color: 'inherit', fontSize: '0.875rem' }}
              />
            </div>

            <button 
              type="button" 
              onClick={() => removeBooking(index)}
              style={{ marginTop: '1.25rem', padding: '0.5rem', backgroundColor: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
              title="Eliminar evento externo"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        <button 
          type="button" 
          onClick={addBooking}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}
        >
          <Plus size={16} /> Añadir Fecha Externa
        </button>
      </div>

      {internalBookings && internalBookings.length > 0 && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', opacity: 0.7 }}>Eventos Internos (Solo Lectura)</h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginBottom: '1rem' }}>Estos eventos se gestionan automáticamente cuando agregas al DJ al Line Up de un evento de Bassfactory.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {internalBookings.map((evt, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1.5fr', gap: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(128,128,128,0.2)', fontSize: '0.875rem', opacity: 0.8 }}>
                <div>{new Date(evt.date).toLocaleString('es-CO')}</div>
                <div style={{ fontWeight: 600 }}>{evt.title}</div>
                <div>{evt.location}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
