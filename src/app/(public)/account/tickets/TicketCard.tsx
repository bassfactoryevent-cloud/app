"use client";

import { useState } from "react";
import Image from "next/image";
import { Calendar, MapPin, QrCode } from "lucide-react";
import { motion } from "framer-motion";

export default function TicketCard({ ticket, eventDate }: { ticket: any; eventDate: string }) {
  const event = ticket.ticket_tiers.events;
  const [isHovered, setIsHovered] = useState(false);

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
    </motion.div>
  );
}
