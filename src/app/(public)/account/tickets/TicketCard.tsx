"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Calendar, MapPin, QrCode, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { assignTicket } from "./actions";
import { toast } from "sonner";

export default function TicketCard({ ticket, eventDate }: { ticket: any; eventDate: string }) {
  const event = ticket.ticket_tiers.events;
  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    startTransition(async () => {
      try {
        await assignTicket(ticket.id, name, email);
        toast.success("Boleta enviada exitosamente por correo.");
        setShowModal(false);
      } catch (err: any) {
        toast.error(err.message || "Hubo un error asignando la boleta.");
      }
    });
  };

  return (
    <motion.div 
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.01 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        overflow: 'hidden', 
        position: 'relative',
        height: '240px',
        boxShadow: isHovered ? '0 20px 40px rgba(0,0,0,0.5)' : 'none',
        transition: 'box-shadow 0.3s ease',
        cursor: 'pointer'
      }}
    >
      {/* Holographic Glow Effect */}
      {isHovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, transparent 30%)', zIndex: 10, pointerEvents: 'none', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }} />
      )}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Left side: Image */}
      {event.image_url && (
        <div style={{ width: '240px', height: '100%', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, var(--glass-bg))', zIndex: 1 }} />
          <Image src={event.image_url} alt={event.title} fill style={{ objectFit: 'cover' }} />
        </div>
      )}

      {/* Middle: Details */}
      <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 2 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-accent)', boxShadow: '0 0 10px var(--color-accent)' }} />
          {ticket.ticket_tiers.name}
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'Outfit, sans-serif' }}>{event.title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Calendar size={18} /> {eventDate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <MapPin size={18} /> {event.location_name}
          </div>
        </div>

        {/* Asignación Actual / Botón de Enviar */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {ticket.assigned_name ? (
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ opacity: 0.6 }}>A nombre de: </span>
              <strong style={{ color: 'white' }}>{ticket.assigned_name}</strong>
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>Sin asignar (Tuya)</div>
          )}

          {ticket.status === 'valid' && (
            <button 
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
            >
              <Send size={16} /> Enviar a amigo
            </button>
          )}
        </div>
      </div>

      {/* Right side: QR Code (Tear-off stub) */}
      <div style={{ width: '220px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '2px dashed rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.3)', position: 'relative' }}>
        {/* Semi-circles for the tear-off effect */}
        <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-bg)' }} />
        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-bg)' }} />

        {ticket.status === 'valid' ? (
          <>
            <div style={{ width: '130px', height: '130px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', borderRadius: '0.5rem', padding: '10px' }}>
              <QrCode size={110} color="black" />
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.5, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              #{ticket.qr_hash.substring(0, 10).toUpperCase()}
            </div>
            <div style={{ marginTop: '0.5rem', color: '#00F0FF', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.1em' }}>VÁLIDO</div>
          </>
        ) : (
          <div style={{ color: '#E50914', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.1em' }}>{ticket.status.toUpperCase()}</div>
        )}
      </div>

      {/* Modal de Asignación */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(5px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}
            >
              <button 
                onClick={() => setShowModal(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.5 }}
              >
                <X size={20} />
              </button>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Enviar Boleta</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Asigna esta boleta a un amigo. Le enviaremos el código QR inmediatamente por correo electrónico.
              </p>

              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre de tu amigo</label>
                  <input type="text" name="name" required defaultValue={ticket.assigned_name || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Correo electrónico</label>
                  <input type="email" name="email" required defaultValue={ticket.assigned_email || ''} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }} />
                </div>

                <button 
                  type="submit"
                  disabled={isPending}
                  style={{ width: '100%', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--color-magenta)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Enviando...' : 'Enviar Boleta'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
