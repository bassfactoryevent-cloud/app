"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { 
  Calendar, MapPin, Send, X, Lock, ShieldCheck, Download, 
  CheckCircle2, Eye, Sparkles, ExternalLink, QrCode as QrIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initiateTransfer, cancelTransfer } from "./actions";
import { toast } from "sonner";
import QRCode from "qrcode";

export default function TicketCard({ ticket, eventDate }: { ticket: any; eventDate: string }) {
  const tier = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0] : ticket.ticket_tiers;
  const event = Array.isArray(tier?.events) ? tier.events[0] : tier?.events;
  const coverImage = event?.cover_image || event?.image_url;

  const [isHovered, setIsHovered] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDigitalPass, setShowDigitalPass] = useState(false);
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

  // Fecha de activación programada (24 horas antes)
  const activationDateStr = eventStartDate 
    ? new Date(eventStartDate.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      })
    : "1 día antes del evento";

  useEffect(() => {
    if (isEnabled && ticket.qr_hash) {
      QRCode.toDataURL(ticket.qr_hash, {
        margin: 1,
        width: 200,
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
        setShowTransferModal(false);
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

  const shortTicketId = ticket.id.slice(0, 8).toUpperCase();
  const shortOrderId = ticket.order_id ? ticket.order_id.slice(0, 8).toUpperCase() : shortTicketId;

  return (
    <>
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
          minHeight: '260px',
          borderRadius: '1.25rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(15, 15, 20, 0.9)',
          boxShadow: isHovered ? '0 20px 45px rgba(229, 9, 20, 0.25)' : '0 10px 30px rgba(0,0,0,0.5)',
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
          <div 
            onClick={() => setShowDigitalPass(true)}
            style={{ width: '240px', minHeight: '230px', position: 'relative', flexShrink: 0, cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(15,15,20,0.95))', zIndex: 1 }} />
            <Image src={coverImage} alt={event?.title || "Evento"} fill style={{ objectFit: 'cover' }} sizes="240px" />
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', zIndex: 2, display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', color: 'white', fontWeight: 600 }}>
              <Eye size={13} style={{ color: 'var(--color-magenta)' }} /> Ver Pase
            </div>
          </div>
        ) : (
          <div style={{ width: '180px', minHeight: '230px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            <ShieldCheck size={48} />
          </div>
        )}

        {/* Middle: Details & Actions */}
        <div style={{ padding: '1.75rem', flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
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
                padding: '0.2rem 0.65rem',
                borderRadius: '999px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-accent, #00f0ff)', boxShadow: '0 0 8px var(--color-accent, #00f0ff)' }} />
                {tier?.name || 'Localidad General'}
              </span>

              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.07)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                Boleta #{shortTicketId}
              </span>

              {ticket.order_id && (
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.07)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  Orden #{shortOrderId}
                </span>
              )}

              {ticket.status === 'valid' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 700, color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  <CheckCircle2 size={13} /> Pago Confirmado • Boleta Válida
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e50914', backgroundColor: 'rgba(229, 9, 20, 0.15)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  {ticket.status.toUpperCase()}
                </span>
              )}
            </div>

            <h2 
              onClick={() => setShowDigitalPass(true)}
              style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.65rem', fontFamily: 'Outfit, sans-serif', color: 'white', lineHeight: 1.2, cursor: 'pointer' }}
            >
              {event?.title || 'Evento Bassfactory'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} style={{ color: 'var(--color-magenta)' }} /> {eventDate}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} style={{ color: 'var(--color-magenta)' }} /> {event?.location_name || 'Ubicación por confirmar'} {event?.location_address ? `• ${event.location_address}` : ''}
              </div>
            </div>

            {/* Aviso de Activación 24 Horas */}
            {!isEnabled && (
              <div style={{ 
                marginTop: '0.85rem', 
                backgroundColor: 'rgba(245, 158, 11, 0.08)', 
                border: '1px solid rgba(245, 158, 11, 0.25)', 
                borderRadius: '0.5rem', 
                padding: '0.6rem 0.85rem',
                fontSize: '0.78rem',
                color: '#fde68a',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <ShieldCheck size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Activación Programada:</strong> El código QR oficial para el escaneo en taquilla se activará automáticamente el <strong>{activationDateStr}</strong> a las 00:00h en tu cuenta y en tu correo.
                </span>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
            <div>
              {pendingTransfer ? (
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>En transferencia: </span>
                  <span style={{ opacity: 0.85 }}>{pendingTransfer.to_email}</span>
                </div>
              ) : ticket.assigned_name ? (
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ opacity: 0.6 }}>Asistente Oficial: </span>
                  <strong style={{ color: 'white' }}>{ticket.assigned_name}</strong>
                </div>
              ) : (
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Asistente Oficial: <strong>Tú (Titular)</strong></div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              {/* Botón Ver Boleta Digital */}
              <button
                onClick={() => setShowDigitalPass(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.55rem 0.95rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
              >
                <Eye size={15} /> Ver Boleta Digital
              </button>

              {/* Botón Descargar Boleta PDF */}
              {ticket.status === 'valid' && (
                <a 
                  href={`/api/tickets/${ticket.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`Boleta-${(event?.title || 'Bassfactory').replace(/[^a-zA-Z0-9]/g, '-')}-${shortTicketId}.pdf`}
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
                  <Download size={15} /> Descargar PDF
                </a>
              )}

              {/* Botón Transferir */}
              {ticket.status === 'valid' && !pendingTransfer && (
                <button 
                  onClick={() => setShowTransferModal(true)}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    padding: '0.55rem 0.85rem', 
                    backgroundColor: 'transparent', 
                    border: '1px solid rgba(255,255,255,0.15)', 
                    color: 'rgba(255,255,255,0.85)', 
                    borderRadius: '0.5rem', 
                    cursor: 'pointer', 
                    fontSize: '0.825rem', 
                    fontWeight: 600, 
                    transition: 'all 0.2s' 
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                  }}
                >
                  <Send size={14} /> Transferir
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
                    padding: '0.55rem 0.85rem', 
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
                  <X size={14} /> Cancelar Transferencia
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
                  #{ticket.qr_hash ? ticket.qr_hash.substring(0, 10).toUpperCase() : shortTicketId}
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
                  ENTRADA ASEGURADA
                </div>
                <div style={{ fontSize: '0.72rem', color: '#f59e0b', marginTop: '0.35rem', fontWeight: 600, lineHeight: 1.3 }}>
                  El código QR oficial se activará 1 día antes del evento
                </div>
                <div style={{ fontSize: '0.65rem', opacity: 0.45, fontFamily: 'monospace', marginTop: '0.5rem' }}>
                  ID: #{shortTicketId}
                </div>
              </div>
            )
          ) : (
            <div style={{ color: '#E50914', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.05em' }}>
              {ticket.status.toUpperCase()}
            </div>
          )}
        </div>
      </motion.div>

      {/* MODAL 1: Vista Interactiva "Boleta Digital" (Pase de Acceso Oficial) */}
      <AnimatePresence>
        {showDigitalPass && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.88)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(8px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ 
                backgroundColor: '#0d0d12', 
                border: '1px solid rgba(255,255,255,0.18)', 
                borderRadius: '1.5rem', 
                width: '100%', 
                maxWidth: '480px', 
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(229, 9, 20, 0.2)'
              }}
            >
              {/* Header con botón cerrar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white' }}>
                    Pase Oficial de Acceso
                  </span>
                </div>
                <button 
                  onClick={() => setShowDigitalPass(false)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido del Pase */}
              <div style={{ padding: '1.5rem' }}>
                {coverImage && (
                  <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
                    <Image src={coverImage} alt={event?.title || "Evento"} fill style={{ objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,18,0.9) 0%, transparent 70%)' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
                      <span style={{ backgroundColor: 'var(--color-magenta)', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {tier?.name || 'General'}
                      </span>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: '6px 0 0 0', lineHeight: 1.2 }}>
                        {event?.title}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Grid de Información del Evento */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Fecha y Hora</span>
                      <strong style={{ color: 'white' }}>{eventDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Lugar</span>
                      <strong style={{ color: 'white' }}>{event?.location_name || 'Bogotá'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Asistente</span>
                      <strong style={{ color: 'white' }}>{ticket.assigned_name || 'Titular de Cuenta'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Identificador</span>
                      <strong style={{ color: 'var(--color-accent, #00f0ff)', fontFamily: 'monospace' }}>#{shortTicketId}</strong>
                    </div>
                  </div>
                </div>

                {/* Sección de Activación del QR */}
                <div style={{ textAlign: 'center', padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
                  {isEnabled ? (
                    <div>
                      <div style={{ width: '170px', height: '170px', backgroundColor: 'white', padding: '10px', borderRadius: '0.75rem', margin: '0 auto 0.75rem' }}>
                        {generatedQr ? (
                          <img src={generatedQr} alt="QR Code Oficial" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ color: 'black', fontSize: '0.8rem', fontWeight: 700, paddingTop: '60px' }}>Generando QR...</div>
                        )}
                      </div>
                      <div style={{ color: '#00F0FF', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                        QR ACTIVO PARA TAQUILLA
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                        Presenta este código en la entrada o descárgalo en PDF.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(229, 9, 20, 0.15)', border: '1px solid rgba(229, 9, 20, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', color: 'var(--color-magenta)' }}>
                        <ShieldCheck size={36} />
                      </div>
                      <h4 style={{ color: '#22c55e', fontSize: '1rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
                        Entrada Confirmada y Asegurada
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
                        Por protocolos de seguridad y prevención de clonación en taquilla, <strong>tu código QR oficial se habilitará automáticamente el {activationDateStr} a las 00:00h</strong>.
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones del Modal */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <a 
                    href={`/api/tickets/${ticket.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Boleta-${(event?.title || 'Bassfactory').replace(/[^a-zA-Z0-9]/g, '-')}-${shortTicketId}.pdf`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem',
                      backgroundColor: 'var(--color-magenta, #E50914)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={16} /> Descargar Boleta PDF
                  </a>

                  <button 
                    onClick={() => {
                      setShowDigitalPass(false);
                      setShowTransferModal(true);
                    }}
                    style={{
                      padding: '0.85rem 1.25rem',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Transferir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Transferencia de Boleta */}
      <AnimatePresence>
        {showTransferModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ backgroundColor: 'var(--color-surface, #141419)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '420px', position: 'relative' }}
            >
              <button 
                onClick={() => setShowTransferModal(false)}
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
    </>
  );
}
