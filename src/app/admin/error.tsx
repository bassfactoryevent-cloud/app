"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', backgroundColor: '#ffebe9', color: '#ff0000', borderRadius: '8px', margin: '2rem' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>¡Ups! Algo salió mal en el servidor</h2>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
        <strong>Message:</strong> {error.message}
        <br/><br/>
        <strong>Digest:</strong> {error.digest || 'N/A'}
        <br/><br/>
        <strong>Stack:</strong> {error.stack}
      </div>
      <button 
        onClick={() => reset()}
        style={{ padding: '0.5rem 1rem', backgroundColor: '#ff0000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
