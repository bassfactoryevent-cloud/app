"use client";

import { Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export default function PrintInvoiceButton({ 
  orderId,
  backHref = "/account/orders" 
}: { 
  orderId?: string;
  backHref?: string;
}) {
  return (
    <div className="no-print" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
      <Link 
        href={backHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.65rem 1.25rem',
          backgroundColor: 'rgba(255,255,255,0.08)',
          color: 'white',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}
      >
        <ArrowLeft size={16} /> Volver
      </Link>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {orderId && (
          <a
            href={`/api/orders/${orderId}/invoice/pdf`}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.5rem',
              backgroundColor: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              color: '#00F0FF',
              borderRadius: '0.5rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              cursor: 'pointer'
            }}
          >
            <Download size={16} /> Descargar PDF Oficial
          </a>
        )}

        <button
          onClick={() => window.print()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1.5rem',
            backgroundColor: 'var(--color-magenta)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          <Printer size={16} /> Imprimir Factura
        </button>
      </div>
    </div>
  );
}
