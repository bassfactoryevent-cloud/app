import Link from "next/link";
import { CheckCircle2, Package } from "lucide-react";

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { order_id?: string } }) {
  const orderId = searchParams.order_id;

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      <CheckCircle2 size={64} style={{ color: '#22c55e', margin: '0 auto 1.5rem' }} />
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>¡Compra Exitosa!</h1>
      <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>
        Tu pedido ha sido procesado correctamente. Te enviaremos un correo con los detalles del envío pronto.
      </p>

      {orderId && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Package size={24} style={{ opacity: 0.5 }} />
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Número de Orden</p>
            <p style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.25rem' }}>{orderId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      )}

      <Link 
        href="/merch" 
        style={{ 
          display: 'inline-block', padding: '1rem 2rem', 
          backgroundColor: 'var(--color-magenta)', color: 'white', 
          textDecoration: 'none', borderRadius: '0.5rem', 
          fontWeight: 700 
        }}
      >
        Volver a la Tienda
      </Link>
    </div>
  );
}
