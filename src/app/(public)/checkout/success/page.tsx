import Link from "next/link";
import { CheckCircle2, Clock, Package, Ticket } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { fulfillOrder } from "@/utils/orderFulfillment";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export default async function CheckoutSuccessPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }> 
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.order_id || resolvedParams['bold-order-id'];
  
  const boldStatus = (
    resolvedParams['bold-order-status'] || 
    resolvedParams['bold-tx-status'] || 
    resolvedParams['status'] || 
    ''
  ).toLowerCase();

  // If redirected back with success from payment gateway, or if user arrived with valid orderId:
  if (orderId && (!boldStatus || boldStatus === 'approved' || boldStatus === 'successful' || boldStatus.includes('approv'))) {
    try {
      await fulfillOrder(orderId);
    } catch (err) {
      console.error("Fulfillment check error in success page:", err);
    }
  }

  let order: any = null;
  if (orderId) {
    try {
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

  const isPaid = order?.status === "paid";

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '4rem 2rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
      {isPaid ? (
        <CheckCircle2 size={64} style={{ color: '#22c55e', margin: '0 auto 1.5rem' }} />
      ) : (
        <Clock size={64} style={{ color: '#eab308', margin: '0 auto 1.5rem' }} />
      )}
      
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
        {isPaid ? "¡Compra Confirmada!" : "Pago en Proceso"}
      </h1>
      
      <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>
        {isPaid ? (
          "Tu pedido ha sido procesado y confirmado con éxito. Hemos enviado el recibo detallado a tu correo. Por seguridad antifraude, las boletas oficiales con código QR se habilitarán 1 día antes del evento."
        ) : (
          "Tu transacción está siendo verificada por Bold. Si acabas de pagar, tus boletas quedarán activadas en unos segundos."
        )}
      </p>

      {orderId && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <Package size={24} style={{ opacity: 0.5 }} />
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Número de Orden / Referencia</p>
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
          <Ticket size={18} /> Ver Mis Boletas
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
