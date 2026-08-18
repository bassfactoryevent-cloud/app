"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ScannerClient({ eventId }: { eventId: string }) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  // Ref para evitar montajes dobles en React Strict Mode
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Inicializar el escáner solo una vez
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true
        },
        false
      );

      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      // Limpiar al desmontar
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (status === 'scanning') return; // Evitar escaneos múltiples del mismo código muy rápido
    
    setScanResult(decodedText);
    setStatus('scanning');
    
    // Pausar escáner temporalmente
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }

    try {
      const res = await fetch('/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_hash: decodedText, event_id: eventId })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Boleta válida. Aforo actualizado.');
        toast.success(data.message || 'Boleta válida');
      } else {
        setStatus('error');
        setMessage(data.error || 'Boleta inválida');
        toast.error(data.error || 'Boleta inválida');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Error de conexión');
      toast.error('Error de conexión');
    }

    // Reanudar después de 2 segundos para dar tiempo a leer el mensaje
    setTimeout(() => {
      setStatus('idle');
      setScanResult(null);
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    }, 2500);
  };

  const onScanFailure = (error: any) => {
    // Ignorar errores continuos de lectura (pasan en cada frame que no hay QR)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Contenedor del Escáner */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1rem', overflow: 'hidden', padding: '1rem' }}>
        <div id="qr-reader" style={{ width: '100%', borderRadius: '0.5rem', overflow: 'hidden' }}></div>
      </div>

      {/* Resultado (Feedback visual grande) */}
      {status !== 'idle' && (
        <div style={{ 
          padding: '2rem', 
          borderRadius: '1rem', 
          textAlign: 'center',
          backgroundColor: status === 'success' ? 'rgba(34, 197, 94, 0.1)' : status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
          animation: 'fadeIn 0.3s ease'
        }}>
          
          {status === 'scanning' && <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Procesando...</div>}
          
          {status === 'success' && (
            <>
              <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e', margin: 0 }}>¡Acceso Concedido!</h3>
              <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', margin: 0 }}>Acceso Denegado</h3>
              <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>{message}</p>
            </>
          )}

        </div>
      )}

      {/* Global styles for html5-qrcode overrides to match dark mode */}
      <style dangerouslySetInnerHTML={{__html: `
        #qr-reader { border: none !important; }
        #qr-reader__scan_region { background-color: #000; }
        #qr-reader__dashboard { padding: 1rem 0 !important; }
        #qr-reader__dashboard_section_csr button { 
          background-color: var(--color-magenta); 
          color: white; 
          border: none; 
          padding: 0.5rem 1rem; 
          border-radius: 0.5rem; 
          font-weight: 600; 
          cursor: pointer; 
        }
        #qr-reader__dashboard_section_swaplink { color: var(--color-text-secondary); text-decoration: none; margin-top: 1rem; display: inline-block; }
      `}} />
    </div>
  );
}
