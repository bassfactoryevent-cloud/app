"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { Calendar, MapPin, Send, X, Lock, ShieldCheck, Download, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initiateTransfer, cancelTransfer } from "./actions";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function TicketCard({ ticket, eventDate }: { ticket: any; eventDate: string }) {
  const tier = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0] : ticket.ticket_tiers;
  const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
  const coverImage = event?.cover_image || event?.image_url;

  const [isHovered, setIsHovered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [generatedQr, setGeneratedQr] = useState<string | null>(null);

  // Transferencia pendiente si existe
  const pendingTransfers = Array.isArray(ticket.ticket_transfers) 
    ? ticket.ticket_transfers.filter((t: any) => t.status === 'pending')
    : ticket.ticket_transfers?.status === 'pending' ? [ticket.ticket_transfers] : [];
  
  const pendingTransfer = pendingTransfers[0];

  // Regla de activación de QR: 24 horas antes del evento o si ya fue despachado
  const eventStartDate = event?.start_date ? new Date(event.start_date) : null;
  const isWithin24Hours = eventStartDate 
    ? (eventStartDate.getTime() - Date.now()) <= 24 * 60 * 60 * 1000 
    : false;
  const isEnabled = isWithin24Hours || ticket.qr_dispatched;

  useEffect(() => {
    if (isEnabled && ticket.qr_hash) {
      QRCode.toDataURL(ticket.qr_hash, {
        margin: 1,
        width: 140,
        color: { dark: "#000000", light: "#ffffff" }
      })
      .then(setGeneratedQr)
      .catch((err) => console.error("Error generating QR preview:", err));
    }
  }, [isEnabled, ticket.qr_hash]);

  const handleAssign = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    startTransition(async () => {
      try {
        await initiateTransfer(ticket.id, name, email);
        toast.success("Transferencia iniciada. Se envió un correo a tu amigo.");
        setShowModal(false);
      } catch (err: any) {
        toast.error(err.message || "Hubo un error iniciando la transferencia.");
      }
    });
  };

  const handleCancelTransfer = () => {
    if (!pendingTransfer) return;
    startTransition(async () => {
      try {
        await cancelTransfer(pendingTransfer.id);
        toast.success("Transferencia cancelada.");
      } catch (err: any) {
        toast.error(err.message || "Error al cancelar.");
      }
    });
  };

  return (
    <motion.div 
      className="glass-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap',
        overflow: 'hidden', 
        position: 'relative',
        minHeight: '250px',
        borderRadius: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(15, 15, 20, 0.85)',
        boxShadow: isHovered ? '0 20px 45px rgba(229, 9, 20, 0.2)' : '0 10px 30px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Holographic Glow Effect */}
      {isHovered && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.06) 25%, transparent 30%)', zIndex: 10, pointerEvents: 'none', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }} />
      )}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Left side: Cover Image */}
      {coverImage ? (
        <div style={{ width: '230px', minHeight: '220px', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(15,15,20,0.95))', zIndex: 1 }} />
          <Image src={coverImage} alt={event?.title || "Evento"} fill style={{ objectFit: 'cover' }} sizes="230px" />
        </div>
      ) : (
        <div style={{ width: '180px', minHeight: '220px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
          <ShieldCheck size={48} />
        </div>
      )}

      {/* Middle: Details & Actions */}
      <div style={{ padding: '1.75rem', flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        <div>
          {/* Metadata Badges Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.75rem', 
              fontWeight: 800, 
              color: 'var(--color-accent, #00f0ff)', 
              backgroundColor: 'rgba(0, 240, 255, 0.1)', 
              border: '1px solid rgba(0, 240, 255, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-accent, #00f0ff)', boxShadow: '0 0 8px var(--color-accent, #00f0ff)' }} />
              {tier?.name || 'Localidad General'}
            </span>

            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
              Boleta #{ticket.id.slice(0, 8).toUpperCase()}
            </span>

            {ticket.order_id && (
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                Orden #{ticket.order_id.slice(0, 8).toUpperCase()}
              </span>
            )}

            {ticket.status === 'valid' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                <CheckCircle2 size={12} /> Confirmada
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e50914', backgroundColor: 'rgba(229, 9, 20, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                {ticket.status.toUpperCase()}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.75rem', fontFamily: 'Outfit, sans-serif', color: 'white', lineHeight: 1.2 }}>
            {event?.title || 'Evento Bassfactory'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} style={{ color: 'var(--color-magenta)' }} /> {eventDate}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} style={{ color: 'var(--color-magenta)' }} /> {event?.location_name || 'Ubicación por confirmar'} {event?.location_address ? `(${event.location_address})` : ''}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            {pendingTransfer ? (
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>En transferencia: </span>
                <span style={{ opacity: 0.85 }}>{pendingTransfer.to_email}</span>
              </div>
            ) : ticket.assigned_name ? (
              <div style={{ fontSize: '0.8rem' }}>
                <span style={{ opacity: 0.6 }}>Asistente: </span>
                <strong style={{ color: 'white' }}>{ticket.assigned_name}</strong>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Asistente: <strong>Tú (Titular)</strong></div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Botón de Descargar Boleta PDF */}
            {ticket.status === 'valid' && (
              <a 
                href={`/api/tickets/${ticket.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                download={`Boleta-${(event?.title || 'Bassfactory').replace(/[^a-zA-Z0-9]/g, '-')}-${ticket.id.slice(0, 8).toUpperCase()}.pdf`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 1rem',
                  backgroundColor: 'var(--color-magenta, #E50914)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.35)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f40612';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-magenta, #E50914)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <Download size={15} /> Descargar Boleta PDF
              </a>
            )}

            {/* Botón de Transferir */}
            {ticket.status === 'valid' && !pendingTransfer && (
              <button 
                onClick={() => setShowModal(true)}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.55rem 0.9rem', 
                  backgroundColor: 'rgba(255,255,255,0.06)', 
                  border: '1px solid rgba(255,255,255,0.15)', 
                  color: 'white', 
                  borderRadius: '0.5rem', 
                  cursor: 'pointer', 
                  fontSize: '0.825rem', 
                  fontWeight: 600, 
                  transition: 'all 0.2s' 
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
              >
                <Send size={15} /> Transferir
              </button>
            )}

            {pendingTransfer && (
              <button 
                onClick={handleCancelTransfer}
                disabled={isPending}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.55rem 0.9rem', 
                  backgroundColor: 'transparent', 
                  border: '1px solid #ef4444', 
                  color: '#ef4444', 
                  borderRadius: '0.5rem', 
                  cursor: isPending ? 'not-allowed' : 'pointer', 
                  fontSize: '0.825rem', 
                  fontWeight: 600, 
                  opacity: isPending ? 0.5 : 1 
                }}
              >
                <X size={15} /> Cancelar Transferencia
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right side: QR Code Stub / Antifraud Activation */}
      <div style={{ 
        width: '230px', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        borderLeft: '2px dashed rgba(255,255,255,0.12)', 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        position: 'relative',
        flexShrink: 0
      }}>
        {/* Semi-circles for the ticket tear-off effect */}
        <div style={{ position: 'absolute', top: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-bg, #000)' }} />
        <div style={{ position: 'absolute', bottom: '-10px', left: '-10px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-bg, #000)' }} />

        {pendingTransfer ? (
          <div style={{ textAlign: 'center', opacity: 0.6 }}>
            <Lock size={40} style={{ margin: '0 auto 0.75rem', color: '#f59e0b' }} />
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>EN TRANSFERENCIA</div>
            <div style={{ fontSize: '0.65rem', marginTop: '0.4rem' }}>QR en pausa hasta ser aceptada</div>
          </div>
        ) : ticket.status === 'valid' ? (
          isEnabled ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '130px', 
                height: '130px', 
                backgroundColor: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 0.5rem', 
                borderRadius: '0.5rem', 
                padding: '6px' 
              }}>
                {generatedQr ? (
                  <img src={generatedQr} alt="QR Code" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <div style={{ fontSize: '0.7rem', color: '#000', fontWeight: 700 }}>Generando...</div>
                )}
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                #{ticket.qr_hash ? ticket.qr_hash.substring(0, 10).toUpperCase() : ticket.id.slice(0, 8).toUpperCase()}
              </div>
              <div style={{ marginTop: '0.25rem', color: '#00F0FF', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                QR ACTIVO PARA ACCESO
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.25rem' }}>
              <div style={{ 
                width: '58px', 
                height: '58px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(229, 9, 20, 0.12)', 
                border: '1px solid rgba(229, 9, 20, 0.35)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 0.6rem',
                color: 'var(--color-magenta, #E50914)'
              }}>
                <ShieldCheck size={32} />
              </div>
              <div style={{ color: '#22c55e', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.04em' }}>
                ENTRADA CONFIRMADA
              </div>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.35rem', fontWeight: 600, lineHeight: 1.3 }}>
                El código QR de acceso se activará 1 día antes del evento
              </div>
              <div style={{ fontSize: '0.65rem', opacity: 0.45, fontFamily: 'monospace', marginTop: '0.5rem' }}>
                ID: #{ticket.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          )
        ) : (
          <div style={{ color: '#E50914', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em' }}>
            {ticket.status.toUpperCase()}
          </div>
        )}
      </div>

      {/* Modal de Transferencia */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ backgroundColor: 'var(--color-surface, #141419)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '420px', position: 'relative' }}
            >
              <button 
                onClick={() => setShowModal(false)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6 }}
              >
                <X size={20} />
              </button>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>Transferir Boleta</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Esta acción enviará un enlace de aceptación a tu amigo por correo. Si acepta, <strong>perderás la propiedad</strong> de la boleta y se generará un nuevo QR para él.
              </p>

              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Nombre de tu amigo</label>
                  <input type="text" name="name" required defaultValue={ticket.assigned_name || ''} placeholder="Ej. Carlos Mendoza" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.4rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Correo electrónico de tu amigo</label>
                  <input type="email" name="email" required defaultValue={ticket.assigned_email || ''} placeholder="amigo@email.com" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }} />
                </div>

                <button 
                  type="submit"
                  disabled={isPending}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', backgroundColor: 'var(--color-magenta, #E50914)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? 'Enviando...' : 'Enviar Transferencia'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
