"use client";

import { useState } from "react";
import { Ticket, Minus, Plus, CreditCard } from "lucide-react";

type TicketTier = {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  sales_start?: string;
  sales_end?: string;
};

export default function EventCheckout({ eventId, isFree, ticketTiers }: { eventId: string, isFree: boolean, ticketTiers: TicketTier[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const updateQuantity = (tierId: string, change: number, max: number) => {
    const current = quantities[tierId] || 0;
    const next = Math.max(0, Math.min(max, current + change));
    setQuantities({ ...quantities, [tierId]: next });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = ticketTiers.reduce((acc, tier) => acc + (tier.price * (quantities[tier.id] || 0)), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalTickets === 0 && !isFree) {
      alert("Selecciona al menos una boleta.");
      return;
    }
    // Aquí iría la integración con la pasarela de pagos.
    // Por ahora redirigimos o mostramos mensaje de éxito.
    alert(`Redirigiendo a pasarela de pagos... Total: $${totalPrice.toLocaleString('es-CO')}`);
  };

  const now = new Date();

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Ticket /> {isFree ? 'Registro Gratuito' : 'Comprar Boletas'}
      </h2>

      <form onSubmit={handleCheckout}>
        {!isFree ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {ticketTiers.map(tier => {
              const start = tier.sales_start ? new Date(tier.sales_start) : null;
              const end = tier.sales_end ? new Date(tier.sales_end) : null;
              
              let isActive = true;
              let statusMsg = "";
              
              if (start && now < start) {
                isActive = false;
                statusMsg = `Inicia el ${start.toLocaleDateString()}`;
              } else if (end && now > end) {
                isActive = false;
                statusMsg = "Venta Finalizada";
              } else if (tier.quantity_available <= 0) {
                isActive = false;
                statusMsg = "Agotado";
              }

              return (
                <div key={tier.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: isActive ? 1 : 0.5 }}>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{tier.name}</h4>
                    <p style={{ opacity: 0.7 }}>${parseFloat(tier.price.toString()).toLocaleString('es-CO')}</p>
                    {!isActive && <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>{statusMsg}</span>}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button type="button" disabled={!isActive} onClick={() => updateQuantity(tier.id, -1, tier.quantity_available)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isActive ? 'pointer' : 'not-allowed' }}>
                      <Minus size={16} />
                    </button>
                    <span style={{ fontWeight: 700, width: '20px', textAlign: 'center' }}>{quantities[tier.id] || 0}</span>
                    <button type="button" disabled={!isActive} onClick={() => updateQuantity(tier.id, 1, tier.quantity_available)} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isActive ? 'pointer' : 'not-allowed' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Este evento es de entrada libre. Completa tus datos para recibir tu código QR de acceso.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.8 }}>Nombre Completo</label>
            <input type="text" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.8 }}>Correo Electrónico (Donde enviaremos tus boletas)</label>
            <input type="email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }} />
          </div>
        </div>

        <button type="submit" disabled={!isFree && totalTickets === 0} style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', backgroundColor: (!isFree && totalTickets === 0) ? 'rgba(255,255,255,0.1)' : 'var(--color-magenta)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: (!isFree && totalTickets === 0) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
          {!isFree ? (
            <>
              <CreditCard size={20} /> Pagar ${totalPrice.toLocaleString('es-CO')}
            </>
          ) : (
            <>
              <Ticket size={20} /> Generar Entradas
            </>
          )}
        </button>
      </form>
    </div>
  );
}
