"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PrintInvoiceButton({ backHref = "/account/orders" }: { backHref?: string }) {
  return (
    <div className="no-print" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
      <Link 
        href={backHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1.25rem',
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

      <button
        onClick={() => window.print()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1.5rem',
          backgroundColor: 'var(--color-magenta)',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer'
        }}
      >
        <Printer size={16} /> Imprimir / Guardar Factura en PDF
      </button>
    </div>
  );
}
