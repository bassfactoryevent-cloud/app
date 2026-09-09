import Link from "next/link";
import { CheckCircle2, Clock, Package, Ticket } from "lucide-react";
import { createClient } from "@/utils/supabase/server";

export default async function CheckoutSuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ order_id?: string }> 
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.order_id;

  let order: any = null;
  if (orderId) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("merch_orders")
        .select("id, status, total_amount, customer_email")
        .eq("id", orderId)
        .single();
      order = data;
    } catch (e) {
      console.error("Error fetching order in success page:", e);
    }
  }

  const isPending = order?.status === "pending";

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      {isPending ? (
        <Clock size={64} style={{ color: '#eab308', margin: '0 auto 1.5rem' }} />
      ) : (
        <CheckCircle2 size={64} style={{ color: '#22c55e', margin: '0 auto 1.5rem' }} />
      )}
      
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
        {isPending ? "Pago en Proceso" : "¡Compra Exitosa!"}
      </h1>
      
      <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>
        {isPending ? (
          "Tu transacción está siendo verificada por Bold. Tan pronto como sea confirmada, tus boletas y comprobante llegarán automáticamente a tu correo electrónico."
        ) : (
          "Tu pedido ha sido procesado y confirmado correctamente. Hemos enviado el comprobante y las entradas a tu correo electrónico."
        )}
      </p>

      {orderId && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Package size={24} style={{ opacity: 0.5 }} />
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Número de Referencia / Orden</p>
            <p style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1.25rem' }}>{orderId.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link 
          href="/account/tickets" 
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.875rem 1.5rem', 
            backgroundColor: 'var(--color-magenta)', color: 'white', 
            textDecoration: 'none', borderRadius: '0.5rem', 
            fontWeight: 700 
          }}
        >
          <Ticket size={18} /> Mis Boletas
        </Link>
        <Link 
          href="/" 
          style={{ 
            display: 'inline-block', padding: '0.875rem 1.5rem', 
            backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', 
            textDecoration: 'none', borderRadius: '0.5rem', 
            fontWeight: 600 
          }}
        >
          Ir al Inicio
        </Link>
      </div>
    </div>
  );
}
