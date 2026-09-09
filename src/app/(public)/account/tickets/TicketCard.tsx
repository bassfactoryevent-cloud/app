"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { 
  Calendar, MapPin, Send, X, Lock, ShieldCheck, Download, 
  CheckCircle2, Eye, Sparkles, QrCode as QrIcon, Users, Clock, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { initiateTransfer, cancelTransfer } from "./actions";
import { toast } from "sonner";
import QRCode from "qrcode";

interface TicketCardProps {
  event: any;
  tickets: any[];
  eventDate: string;
}

export default function TicketCard({ event, tickets, eventDate }: TicketCardProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedTicketForPass, setSelectedTicketForPass] = useState<any | null>(null);
  const [selectedTicketForTransfer, setSelectedTicketForTransfer] = useState<any | null>(null);
  const [generatedQrMap, setGeneratedQrMap] = useState<Record<string, string>>({});

  const coverImage = event?.cover_image || event?.image_url;
  const eventStartDate = event?.start_date ? new Date(event.start_date) : null;
  const isWithin24Hours = eventStartDate 
    ? (eventStartDate.getTime() - Date.now()) <= 24 * 60 * 60 * 1000 
    : false;

  const activationDateStr = eventStartDate 
    ? new Date(eventStartDate.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : "1 día antes del evento";

  // Calcular cantidades e inventario en tiempo real
  const totalCount = tickets.length;

  const getPendingTransfer = (t: any) => {
    if (!t.ticket_transfers) return null;
    const transfers = Array.isArray(t.ticket_transfers) ? t.ticket_transfers : [t.ticket_transfers];
    return transfers.find((tr: any) => tr.status === 'pending') || null;
  };

  const inTransferCount = tickets.filter(t => Boolean(getPendingTransfer(t))).length;
  const inPossessionCount = totalCount - inTransferCount;

  // Generar QRs en memoria si están habilitados
  useEffect(() => {
    tickets.forEach((ticket) => {
      const isEnabled = isWithin24Hours || ticket.qr_dispatched;
      if (isEnabled && ticket.qr_hash && !generatedQrMap[ticket.id]) {
        QRCode.toDataURL(ticket.qr_hash, {
          margin: 1,
          width: 240,
          color: { dark: "#000000", light: "#ffffff" }
        })
        .then((url) => {
          setGeneratedQrMap((prev) => ({ ...prev, [ticket.id]: url }));
        })
        .catch((err) => console.error("Error generating QR:", err));
      }
    });
  }, [tickets, isWithin24Hours, generatedQrMap]);

  const handleInitiateTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTicketForTransfer) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;

    startTransition(async () => {
      try {
        const res = await initiateTransfer(selectedTicketForTransfer.id, name, email);
        if (!res.success) {
          toast.error(res.error || "Hubo un error al iniciar la transferencia.");
          return;
        }
        toast.success(`Transferencia iniciada para ${name}. Se envió la invitación a ${email}.`);
        setSelectedTicketForTransfer(null);
      } catch (err: any) {
        toast.error(err.message || "Hubo un error al iniciar la transferencia.");
      }
    });
  };

  const handleCancelTransfer = (transferId: string, shortId: string) => {
    startTransition(async () => {
      try {
        const res = await cancelTransfer(transferId);
        if (!res.success) {
          toast.error(res.error || "Error al cancelar la transferencia.");
          return;
        }
        toast.success(`Transferencia cancelada. La boleta #${shortId} regresó a tu posesión.`);
      } catch (err: any) {
        toast.error(err.message || "Error al cancelar la transferencia.");
      }
    });
  };

  return (
    <>
      <motion.div 
        className="glass-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden', 
          position: 'relative',
          borderRadius: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: 'rgba(15, 15, 20, 0.95)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)'
        }}
      >
        {/* TOP SECTION: Event Presentation & Inventory Metrics */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.35)'
        }}>
          {/* Poster Image */}
          {coverImage ? (
            <div style={{ width: '280px', minHeight: '230px', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(15,15,20,0.98))', zIndex: 1 }} />
              <Image 
                src={coverImage} 
                alt={event?.title || "Evento"} 
                fill 
                style={{ objectFit: 'cover' }} 
                sizes="280px" 
                priority
              />
            </div>
          ) : (
            <div style={{ width: '220px', minHeight: '230px', backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
              <ShieldCheck size={54} />
            </div>
          )}

          {/* Event Details & Inventory Stats */}
          <div style={{ padding: '1.75rem 2rem', flex: 1, minWidth: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Event Title */}
              <h2 style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 900, marginBottom: '0.65rem', fontFamily: 'Outfit, sans-serif', color: 'white', lineHeight: 1.15 }}>
                {event?.title || 'Evento Bassfactory'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} style={{ color: 'var(--color-magenta)' }} /> {eventDate}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--color-magenta)' }} /> {event?.location_name || 'Ubicación por confirmar'} {event?.location_address ? `• ${event.location_address}` : ''}
                </div>
              </div>

              {/* INVENTORY METRICS BAR */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'white'
                }}>
                  <Users size={14} style={{ color: 'var(--color-accent, #00f0ff)' }} />
                  <span>Total Compradas: <strong>{totalCount}</strong></span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#22c55e'
                }}>
                  <CheckCircle2 size={14} />
                  <span>En tu posesión: <strong>{inPossessionCount}</strong></span>
                </div>

                {inTransferCount > 0 && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#f59e0b'
                  }}>
                    <Clock size={14} />
                    <span>En transferencia: <strong>{inTransferCount}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Antifraud Protocol Notice */}
            <div style={{
              marginTop: '1.25rem',
              backgroundColor: isWithin24Hours ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${isWithin24Hours ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              color: isWithin24Hours ? '#86efac' : '#fde68a',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              {isWithin24Hours ? (
                <ShieldCheck size={18} style={{ color: '#22c55e', flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <Lock size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ lineHeight: 1.45 }}>
                {isWithin24Hours ? (
                  <span>
                    <strong>Acceso Habilitado:</strong> Ya puedes ver tu boleta digital con código QR o descargar el PDF oficial para ingresar en taquilla.
                  </span>
                ) : (
                  <span>
                    <strong>Activación Programada (Antifraude):</strong> Los botones para ver la boleta digital con QR y descargar el PDF oficial se desbloquearán automáticamente el <strong>{activationDateStr}</strong> (24 horas antes del evento). Mientras tanto, puedes transferir cualquiera de tus entradas a tus amigos.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Individual Tickets Breakdown & Direct Actions */}
        <div style={{ padding: '1.75rem 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: 'var(--color-magenta)' }} />
              Desglose de Entradas Adquiridas ({totalCount})
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              Gestiona cada entrada individualmente
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tickets.map((ticket, index) => {
              const tier = Array.isArray(ticket.ticket_tiers) ? ticket.ticket_tiers[0] : ticket.ticket_tiers;
              const pendingTransfer = getPendingTransfer(ticket);
              const isEnabled = isWithin24Hours || ticket.qr_dispatched;
              const shortId = ticket.id.slice(0, 8).toUpperCase();
              const shortOrderId = ticket.order_id ? ticket.order_id.slice(0, 8).toUpperCase() : shortId;

              return (
                <div 
                  key={ticket.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '1rem',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Ticket Meta Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        backgroundColor: 'rgba(0, 240, 255, 0.12)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        color: 'var(--color-accent, #00f0ff)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {tier?.name || 'Localidad General'}
                      </span>

                      <span style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        Entrada #{index + 1} • {shortId}
                      </span>

                      {ticket.order_id && (
                        <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>
                          (Orden #{shortOrderId})
                        </span>
                      )}
                    </div>

                    {/* Status / Holder Row */}
                    <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      {pendingTransfer ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 600 }}>
                          <Clock size={14} />
                          <span>En transferencia para: <strong>{pendingTransfer.to_name || pendingTransfer.to_email}</strong></span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>(Límite 48h)</span>
                        </div>
                      ) : ticket.assigned_name ? (
                        <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                          Asistente Asignado: <strong style={{ color: 'white' }}>{ticket.assigned_name}</strong>
                        </div>
                      ) : (
                        <div style={{ color: 'rgba(255,255,255,0.75)' }}>
                          Asistente: <strong style={{ color: 'white' }}>Tú (Titular de Cuenta)</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ticket Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Botón Ver Boleta Digital */}
                    {isEnabled ? (
                      <button
                        onClick={() => setSelectedTicketForPass(ticket)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.55rem 0.95rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
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
                    ) : (
                      <button
                        disabled
                        title={`El código QR se habilitará el ${activationDateStr}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.55rem 0.95rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          borderRadius: '0.5rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'not-allowed'
                        }}
                      >
                        <Lock size={14} style={{ color: '#f59e0b' }} /> Boleta Digital (Bloqueada)
                      </button>
                    )}

                    {/* Botón Descargar PDF */}
                    {isEnabled ? (
                      <a 
                        href={`/api/tickets/${ticket.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={`Boleta-${(event?.title || 'Bassfactory').replace(/[^a-zA-Z0-9]/g, '-')}-${shortId}.pdf`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
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
                    ) : (
                      <button
                        disabled
                        title={`El PDF oficial se desbloqueará el ${activationDateStr}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '0.55rem 0.95rem',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.4)',
                          borderRadius: '0.5rem',
                          fontSize: '0.825rem',
                          fontWeight: 600,
                          cursor: 'not-allowed'
                        }}
                      >
                        <Lock size={14} style={{ color: '#f59e0b' }} /> PDF (Bloqueado)
                      </button>
                    )}

                    {/* Botón Transferir Entrada */}
                    {!pendingTransfer && ticket.status === 'valid' && (
                      <button 
                        onClick={() => setSelectedTicketForTransfer(ticket)}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '0.55rem 0.9rem', 
                          backgroundColor: 'transparent', 
                          border: '1px solid rgba(255,255,255,0.2)', 
                          color: 'rgba(255,255,255,0.9)', 
                          borderRadius: '0.5rem', 
                          cursor: 'pointer', 
                          fontSize: '0.825rem', 
                          fontWeight: 600, 
                          transition: 'all 0.2s' 
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                        }}
                      >
                        <Send size={14} /> Transferir
                      </button>
                    )}

                    {/* Botón Cancelar Transferencia y Recuperar */}
                    {pendingTransfer && (
                      <button 
                        onClick={() => handleCancelTransfer(pendingTransfer.id, shortId)}
                        disabled={isPending}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          padding: '0.55rem 0.9rem', 
                          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                          border: '1px solid rgba(239, 68, 68, 0.4)', 
                          color: '#ef4444', 
                          borderRadius: '0.5rem', 
                          cursor: isPending ? 'not-allowed' : 'pointer', 
                          fontSize: '0.825rem', 
                          fontWeight: 700, 
                          opacity: isPending ? 0.5 : 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      >
                        <X size={14} /> Cancelar y Recuperar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* MODAL 1: Vista Oficial "Boleta Digital" */}
      <AnimatePresence>
        {selectedTicketForPass && (
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
              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 10px #22c55e' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'white' }}>
                    Pase Oficial de Acceso
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedTicketForPass(null)}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '1.5rem' }}>
                {coverImage && (
                  <div style={{ position: 'relative', width: '100%', height: '150px', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.25rem' }}>
                    <Image src={coverImage} alt={event?.title || "Evento"} fill style={{ objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,18,0.92) 0%, transparent 70%)' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px' }}>
                      <span style={{ backgroundColor: 'var(--color-magenta)', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {selectedTicketForPass.ticket_tiers?.name || 'General'}
                      </span>
                      <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', margin: '6px 0 0 0', lineHeight: 1.2 }}>
                        {event?.title}
                      </h3>
                    </div>
                  </div>
                )}

                {/* Metadata Grid */}
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.825rem' }}>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Fecha</span>
                      <strong style={{ color: 'white' }}>{eventDate}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Lugar</span>
                      <strong style={{ color: 'white' }}>{event?.location_name || 'Bogotá'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Asistente</span>
                      <strong style={{ color: 'white' }}>{selectedTicketForPass.assigned_name || 'Titular de Cuenta'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Identificador</span>
                      <strong style={{ color: 'var(--color-accent, #00f0ff)', fontFamily: 'monospace' }}>
                        #{selectedTicketForPass.id.slice(0, 8).toUpperCase()}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* QR Section */}
                <div style={{ textAlign: 'center', padding: '1.25rem', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
                  <div style={{ width: '170px', height: '170px', backgroundColor: 'white', padding: '10px', borderRadius: '0.75rem', margin: '0 auto 0.75rem' }}>
                    {generatedQrMap[selectedTicketForPass.id] ? (
                      <img src={generatedQrMap[selectedTicketForPass.id]} alt="QR Oficial" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <div style={{ color: 'black', fontSize: '0.8rem', fontWeight: 700, paddingTop: '60px' }}>Generando QR...</div>
                    )}
                  </div>
                  <div style={{ color: '#00F0FF', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                    QR ACTIVO PARA TAQUILLA
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                    Presenta este código en taquilla o descarga el PDF oficial.
                  </p>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <a 
                    href={`/api/tickets/${selectedTicketForPass.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Boleta-${(event?.title || 'Bassfactory').replace(/[^a-zA-Z0-9]/g, '-')}-${selectedTicketForPass.id.slice(0, 8).toUpperCase()}.pdf`}
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
                      const t = selectedTicketForPass;
                      setSelectedTicketForPass(null);
                      setSelectedTicketForTransfer(t);
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

      {/* MODAL 2: Transferencia de Boleta Individual */}
      <AnimatePresence>
        {selectedTicketForTransfer && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(6px)' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ backgroundColor: 'var(--color-surface, #141419)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '1rem', padding: '2rem', width: '100%', maxWidth: '440px', position: 'relative' }}
            >
              <button 
                onClick={() => setSelectedTicketForTransfer(null)}
                style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.6 }}
              >
                <X size={20} />
              </button>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem', color: 'white' }}>
                Transferir Boleta #{selectedTicketForTransfer.id.slice(0, 8).toUpperCase()}
              </h3>
              <div style={{ color: 'var(--color-accent, #00f0ff)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                {selectedTicketForTransfer.ticket_tiers?.name || 'Localidad General'}
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Se enviará una invitación a tu amigo por correo. Tendrá <strong>48 horas</strong> para aceptarla o la boleta regresará automáticamente a tu posesión.
              </p>

              <form onSubmit={handleInitiateTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    Nombre de tu amigo
                  </label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    defaultValue={selectedTicketForTransfer.assigned_name || ''} 
                    placeholder="Ej. Carlos Mendoza" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.9rem' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                    Correo electrónico de tu amigo
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    defaultValue={selectedTicketForTransfer.assigned_email || ''} 
                    placeholder="amigo@email.com" 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.9rem' }} 
                  />
                </div>

                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '0.5rem', padding: '0.65rem 0.85rem', fontSize: '0.78rem', color: '#fde68a' }}>
                  ⚠️ Una vez aceptada por tu amigo, perderás el acceso a esta entrada y se asignará formalmente a su cuenta.
                </div>

                <button 
                  type="submit"
                  disabled={isPending}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem', backgroundColor: 'var(--color-magenta, #E50914)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 800, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1, fontSize: '0.9rem' }}
                >
                  {isPending ? 'Enviando invitación...' : 'Enviar Transferencia'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

