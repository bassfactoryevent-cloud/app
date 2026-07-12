"use client";

import { useCartStore } from "@/store/cartStore";
import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, getTotalPrice } = useCartStore();

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={closeDrawer}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9998,
          backdropFilter: 'blur(4px)'
        }} 
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px',
        backgroundColor: '#111', zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.5)'
      }}>
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingCart size={24} /> Tu Carrito
          </h2>
          <button onClick={closeDrawer} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>
              <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>Tu carrito está vacío.</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.cart_item_id} style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  {item.image_url ? (
                    <Image src={item.image_url} alt={item.itemType === 'merch' ? item.product_name! : item.event_name!} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}><ShoppingCart size={24}/></div>
                  )}
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-magenta)', fontWeight: 800, marginBottom: '0.25rem' }}>
                      {item.itemType === 'merch' ? 'Merch' : 'Boleta'}
                    </div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 }}>{item.itemType === 'merch' ? item.product_name : item.event_name}</h4>
                    {(item.variant_name || item.ticket_tier_name) && <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>{item.itemType === 'merch' ? item.variant_name : item.ticket_tier_name}</p>}
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '0.25rem', color: 'var(--color-magenta)' }}>${item.unit_price.toLocaleString('es-CO')}</p>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '0.25rem' }}>
                      <button onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)} style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.25rem 0.5rem', cursor: 'pointer' }}><Minus size={14}/></button>
                      <span style={{ fontSize: '0.875rem', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)} style={{ background: 'transparent', border: 'none', color: 'white', padding: '0.25rem 0.5rem', cursor: 'pointer' }}><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeItem(item.cart_item_id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
              <span>Total:</span>
              <span>${getTotalPrice().toLocaleString('es-CO')}</span>
            </div>
            <Link 
              href="/checkout" 
              onClick={closeDrawer}
              style={{ 
                display: 'block', width: '100%', textAlign: 'center', 
                backgroundColor: 'var(--color-magenta)', color: 'white', 
                padding: '1rem', borderRadius: 'var(--radius-md)', 
                textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem' 
              }}
            >
              Ir a Pagar
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
