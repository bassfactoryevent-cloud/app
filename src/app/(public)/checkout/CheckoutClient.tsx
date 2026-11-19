"use client";

import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Package, Lock, Truck, Ticket, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { processCheckout } from "./actions";

export default function CheckoutClient({ user }: { user: any }) {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<any>(null);
  const scriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (items.length === 0 && !paymentData) {
      router.push("/");
    }
  }, [items, router, paymentData]);

  useEffect(() => {
    if (paymentData && scriptContainerRef.current) {
      scriptContainerRef.current.innerHTML = "";
      const script = document.createElement("script");
      script.src = "https://checkout.bold.co/library/boldPaymentButton.js";
      const apiKey = paymentData.boldApiKey || process.env.NEXT_PUBLIC_BOLD_API_KEY || "nwvAHzfbKKkqP6Sw4wCi86jB5tqAf9WPwJi-zBFQftA";
      if (!apiKey) {
        toast.error("Configuración de pasarela incompleta en el cliente");
        return;
      }

      script.setAttribute("data-bold-button", "dark-L");
      script.setAttribute("data-api-key", apiKey);
      script.setAttribute("data-amount", Math.round(paymentData.amount).toString());
      script.setAttribute("data-currency", "COP");
      script.setAttribute("data-order-id", paymentData.orderId);
      script.setAttribute("data-integrity-signature", paymentData.hash);
      script.setAttribute("data-redirection-url", `${window.location.origin}/checkout/success?order_id=${paymentData.orderId}`);
      
      script.async = true;
      scriptContainerRef.current.appendChild(script);
    }
  }, [paymentData]);

  if (!mounted || (items.length === 0 && !paymentData)) return null;

  const hasMerch = items.some(item => item.itemType === 'merch');
  const subtotal = getTotalPrice();
  const shippingCost = hasMerch ? 15000 : 0;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));
    formData.set("hasMerch", hasMerch.toString());
    formData.set("user_id", user?.id || "");
    
    try {
      const data = await processCheckout(formData);
      if (!data || !data.success) {
        toast.error(data?.error || "Error procesando tu orden");
        setLoading(false);
        return;
      }
      
      toast.success("¡Orden generada! Procede con el pago en Bold.");
      setPaymentData(data);
      clearCart();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error al conectar con el servidor");
      setLoading(false);
    }
  };

  if (paymentData) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2.5rem 2rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>¡Casi listo!</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Tu orden <b style={{ color: 'white' }}>#{paymentData.orderId.substring(0,8).toUpperCase()}</b> ha sido generada exitosamente por un total de <b style={{ color: '#22c55e' }}>${Number(paymentData.amount).toLocaleString('es-CO')} COP</b>.
        </p>
        <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '2rem' }}>
          Haz clic en el botón de abajo para abrir la pasarela segura de Bold (PSE, Tarjetas de Crédito/Débito, etc).
        </p>
        
        <div ref={scriptContainerRef} id="bold-script-container" style={{ minHeight: '60px', display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}></div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ArrowLeft size={16} /> Volver al formulario de compra
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 800, marginBottom: '1.25rem' }}>Finalizar Compra</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Formulario */}
        <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: '1 1 56%', minWidth: '290px' }}>
          
          {/* Info Contacto */}
          <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.15rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.45rem' }}>Información del Comprador</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>Nombre Completo *</label>
                <input type="text" name="customer_name" defaultValue={user?.user_metadata?.name || ''} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>Correo Electrónico *</label>
                  <input type="email" name="customer_email" defaultValue={user?.email || ''} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>Teléfono *</label>
                  <input type="tel" name="customer_phone" defaultValue={user?.user_metadata?.whatsapp || ''} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Envío (SOLO SI HAY MERCH) */}
          {hasMerch && (
            <div style={{ backgroundColor: 'var(--color-surface)', padding: '1.15rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck size={16} color="var(--color-accent)" /> Dirección de Envío
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>Dirección Completa *</label>
                  <input type="text" name="shipping_address" required placeholder="Calle, Carrera, Número, Apto/Casa" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>Ciudad *</label>
                    <input type="text" name="shipping_city" defaultValue={user?.user_metadata?.city || ''} required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
                  </div>
                  <div style={{ flex: '1 1 160px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>País *</label>
                    <input type="text" name="shipping_country" defaultValue="Colombia" required style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
                  </div>
                  <div style={{ flex: '1 1 130px' }}>
                    <label style={{ display: 'block', fontSize: '0.76rem', marginBottom: '0.3rem', fontWeight: 600 }}>Código Postal</label>
                    <input type="text" name="shipping_zip" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.4)', color: 'white', fontSize: '0.84rem' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Resumen */}
        <div style={{ position: 'sticky', top: '90px', backgroundColor: 'var(--color-surface)', padding: '1.15rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', flex: '1 1 300px', width: '100%' }}>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.45rem' }}>Resumen del Pedido</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.1rem' }}>
            {items.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '52px', height: '52px', backgroundColor: '#09090b', borderRadius: '7px', overflow: 'hidden', flexShrink: 0 }}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.itemType === 'merch' ? item.product_name! : item.event_name!} fill sizes="52px" style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
                      {item.itemType === 'merch' ? <Package size={18}/> : <Ticket size={18}/>}
                    </div>
                  )}
                  <span style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: '1px 5px', fontSize: '0.68rem', fontWeight: 700 }}>x{item.quantity}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--color-magenta)', fontWeight: 800 }}>
                    {item.itemType === 'merch' ? 'Merch' : 'Boleta'}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2, color: 'white' }}>{item.itemType === 'merch' ? item.product_name : item.event_name}</div>
                  {(item.variant_name || item.ticket_tier_name) && <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)' }}>{item.itemType === 'merch' ? item.variant_name : item.ticket_tier_name}</div>}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'white' }}>
                  ${(item.unit_price * item.quantity).toLocaleString('es-CO')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            {hasMerch && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                <span>Envío (Merch)</span>
                <span>${shippingCost.toLocaleString('es-CO')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', marginTop: '0.3rem', color: 'white' }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-magenta)' }}>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <button 
            type="submit" 
            form="checkout-form"
            disabled={loading}
            style={{ 
              width: '100%', marginTop: '1rem', padding: '0.72rem 1rem',
              backgroundColor: 'var(--color-magenta)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 700,
              fontSize: '0.88rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Lock size={15} /> {loading ? 'Procesando...' : 'Pagar Ahora'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: '0.6rem', marginBottom: 0 }}>
            Pagos 100% seguros con Bold.
          </p>
        </div>
      </div>
    </div>
  );
}
