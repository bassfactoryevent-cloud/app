"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }}>
      <div style={{ 
        backgroundColor: 'var(--color-surface, #111)', 
        border: '1px solid var(--color-border, #333)', 
        borderRadius: '1rem', 
        padding: '2rem', 
        width: '100%', 
        maxWidth: '400px', 
        position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '50%', color: '#ef4444' }}>
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'white' }}>{title}</h2>
        </div>
        
        <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '2rem', lineHeight: 1.5, color: '#e5e5e5' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button 
            onClick={onCancel} 
            disabled={isLoading}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: 'transparent', 
              color: 'white', 
              border: '1px solid rgba(255,255,255,0.2)', 
              borderRadius: '0.5rem', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '0.5rem', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
