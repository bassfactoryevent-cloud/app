"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Ticket, Minus, Plus, ShoppingCart, Loader2, CheckCircle2, Mail, X, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { createClient } from "@/utils/supabase/client";
import { registerFreeEvent, FreeRegistrationResult } from "./actions";

type TicketTier = {
  id: string;
  name: string;
  price: number;
  quantity_available: number;
  sales_start?: string;
  sales_end?: string;
};

type SuccessModalData = Extract<FreeRegistrationResult, { success: true }>;

export default function EventCheckout({ eventId, eventName, eventImage, isFree, ticketTiers }: { eventId: string, eventName?: string, eventImage?: string, isFree: boolean, ticketTiers: TicketTier[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem, openDrawer } = useCartStore();

  // Free registration state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalData, setModalData] = useState<SuccessModalData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isFree) return;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        if (user.email) setEmail((prev) => prev || user.email!);
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (metaName) setFullName((prev) => prev || metaName);
      }
    }).catch(() => {});
  }, [isFree]);

  const updateQuantity = (tierId: string, change: number, max: number) => {
    const current = quantities[tierId] || 0;
    const next = Math.max(0, Math.min(max, current + change));
    setQuantities({ ...quantities, [tierId]: next });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = ticketTiers.reduce((acc, tier) => acc + (tier.price * (quantities[tier.id] || 0)), 0);

  const handleAddToCart = () => {
    if (totalTickets === 0) return;

    Object.entries(quantities).forEach(([tierId, qty]) => {
      if (qty > 0) {
        const tier = ticketTiers.find(t => t.id === tierId);
        if (tier) {
          addItem({
            itemType: 'ticket',
            event_id: eventId,
            ticket_tier_id: tierId,
            event_name: eventName || 'Evento Bassfactory',
            ticket_tier_name: tier.name,
            image_url: eventImage || null,
            unit_price: tier.price,
            quantity: qty
          });
        }
      }
    });

    setQuantities({});
    openDrawer();
  };

  const handleFreeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const result = await registerFreeEvent({
        eventId,
        fullName,
        email,
      });

      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }

      setModalData(result);
    } catch {
      setErrorMsg("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalData(null);
  };

  const now = new Date();

  return (
    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Ticket /> {isFree ? 'Registro Gratuito' : 'Comprar Boletas'}
      </h2>

      {!isFree ? (
        <>
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
          <button 
            type="button" 
            onClick={handleAddToCart}
            disabled={totalTickets === 0} 
            style={{ width: '100%', padding: '1rem', borderRadius: '0.5rem', backgroundColor: totalTickets === 0 ? 'rgba(255,255,255,0.1)' : 'var(--color-magenta)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1.1rem', cursor: totalTickets === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
          >
            <ShoppingCart size={20} /> Añadir al Carrito - ${totalPrice.toLocaleString('es-CO')}
          </button>
        </>
      ) : (
        <form onSubmit={handleFreeRegistration}>
          <p style={{ opacity: 0.75, marginBottom: '1.5rem', lineHeight: 1.5, fontSize: '0.95rem' }}>
            Este evento es de entrada libre (<strong style={{ color: '#ffffff' }}>1 cortesía por persona</strong>). Completa tus datos para recibir tu entrada oficial en PDF con código QR. Si vas con amigos, cada uno debe registrarse con su propio correo.
          </p>

          {errorMsg && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.8 }}>Nombre Completo</label>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                disabled={submitting}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.8 }}>Correo Electrónico (Donde enviaremos tu boleta)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={submitting}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--color-magenta)',
              color: 'white',
              border: 'none',
              fontWeight: 800,
              fontSize: '1.1rem',
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.8 : 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Generando Entrada...
              </>
            ) : (
              <>
                <Ticket size={20} /> Generar Entrada
              </>
            )}
          </button>
        </form>
      )}

      {/* Pop-up Modal de Confirmación */}
      {mounted && modalData && createPortal(
        <div
          onClick={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#111115',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '1.25rem',
              padding: '2rem',
              color: '#ffffff',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)'
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Cerrar"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                color: '#10b981'
              }}>
                <CheckCircle2 size={34} />
              </div>

              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                {modalData.ticketIds.length > 1 ? '¡Entradas Generadas!' : '¡Entrada Generada!'}
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#a1a1aa', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Tu registro gratuito para <strong style={{ color: '#ffffff' }}>{modalData.eventTitle}</strong> ha sido confirmado.
              </p>

              <div style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.75rem',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                fontSize: '0.875rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#a1a1aa' }}>Asistente</span>
                  <span style={{ fontWeight: 700, textAlign: 'right' }}>{modalData.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#a1a1aa' }}>Correo</span>
                  <span style={{ fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>{modalData.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <span style={{ color: '#a1a1aa' }}>Código(s)</span>
                  <span style={{ fontWeight: 800, color: 'var(--color-magenta)', fontFamily: 'monospace' }}>
                    {modalData.ticketCodes.join(', ')}
                  </span>
                </div>
              </div>

              <div style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.85rem 1rem',
                borderRadius: '0.65rem',
                backgroundColor: modalData.emailSent ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.1)',
                border: modalData.emailSent ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.825rem',
                color: modalData.emailSent ? '#a7f3d0' : '#fde68a',
                textAlign: 'left',
                lineHeight: 1.45,
                marginBottom: '1.5rem'
              }}>
                <Mail size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  {modalData.emailSent
                    ? 'Enviamos tu boleta en PDF con código QR a tu correo electrónico. Si no la ves en unos minutos, revisa tu carpeta de Spam o Promociones.'
                    : 'Tus entradas quedaron registradas, pero no pudimos confirmar el envío del correo. Puedes verlas directamente en "Mis Entradas" iniciando sesión con este correo.'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar
                </button>
                <Link
                  href="/account/tickets"
                  style={{
                    flex: 1,
                    padding: '0.85rem 1rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--color-magenta)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Ticket size={17} /> Mis Entradas
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
