"use client";

import { useCartStore } from "@/store/cartStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Package, Lock, Truck } from "lucide-react";
import { processMerchCheckout } from "./actions";

export default function CheckoutClient() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    if (items.length === 0) {
      router.push("/merch");
    }
  }, [items, router]);

  if (!mounted || items.length === 0) return null;

  const subtotal = getTotalPrice();
  const shippingCost = 15000;
  const total = subtotal + shippingCost;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("items", JSON.stringify(items));
    
    try {
      await processMerchCheckout(formData);
      clearCart(); // Limpiar el carrito después de compra exitosa
    } catch (err: any) {
      console.error(err);
      alert("Hubo un error procesando tu orden: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '4rem 1rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Finalizar Compra</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem', alignItems: 'start' }}>
        {/* Formulario */}
        <form id="checkout-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Info Contacto */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Información de Contacto</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre Completo *</label>
                <input type="text" name="customer_name" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Correo Electrónico *</label>
                  <input type="email" name="customer_email" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Teléfono *</label>
                  <input type="tel" name="customer_phone" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Envío */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck size={20} /> Dirección de Envío
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Dirección Completa *</label>
                <input type="text" name="shipping_address" required placeholder="Calle, Carrera, Número, Apto/Casa" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Ciudad *</label>
                  <input type="text" name="shipping_city" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>País *</label>
                  <input type="text" name="shipping_country" defaultValue="Colombia" required style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 600 }}>Código Postal</label>
                  <input type="text" name="shipping_zip" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white' }} />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Resumen */}
        <div style={{ position: 'sticky', top: '100px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Resumen del Pedido</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {items.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.product_name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}><Package size={20}/></div>
                  )}
                  <span style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 700 }}>x{item.quantity}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 }}>{item.product_name}</h4>
                  {item.variant_name && <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.variant_name}</p>}
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  ${(item.unit_price * item.quantity).toLocaleString('es-CO')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7, fontSize: '0.875rem' }}>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7, fontSize: '0.875rem' }}>
              <span>Envío</span>
              <span>${shippingCost.toLocaleString('es-CO')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.5rem', marginTop: '0.5rem' }}>
              <span>Total</span>
              <span style={{ color: 'var(--color-magenta)' }}>${total.toLocaleString('es-CO')}</span>
            </div>
          </div>

          <button 
            type="submit" 
            form="checkout-form"
            disabled={loading}
            style={{ 
              width: '100%', marginTop: '2rem', padding: '1rem',
              backgroundColor: 'var(--color-magenta)', color: 'white',
              border: 'none', borderRadius: '0.5rem', fontWeight: 800,
              fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              opacity: loading ? 0.7 : 1
            }}
          >
            <Lock size={18} /> {loading ? 'Procesando...' : 'Pagar Ahora'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', opacity: 0.5, marginTop: '1rem' }}>
            Pagos 100% seguros. Cifrado SSL.
          </p>
        </div>
      </div>
    </div>
  );
}
