"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";

export default function AddToCartClient({ product, variants, primaryImage }: { product: any, variants: any[], primaryImage: string | null }) {
  const [selectedVariant, setSelectedVariant] = useState(variants.length > 0 ? variants[0].id : null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  const currentVariant = variants.find(v => v.id === selectedVariant);
  const currentPrice = currentVariant?.price_override ? parseFloat(currentVariant.price_override) : parseFloat(product.base_price);
  
  const isOutOfStock = product.status === 'out_of_stock' || (currentVariant && currentVariant.stock_quantity <= 0);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addItem({
      product_id: product.id,
      variant_id: selectedVariant,
      product_name: product.title,
      variant_name: currentVariant ? currentVariant.name : null,
      image_url: primaryImage,
      unit_price: currentPrice,
      quantity: quantity
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '2rem', fontWeight: 800 }}>${currentPrice.toLocaleString('es-CO')}</span>
      </div>

      {variants.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Talla / Variante</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {variants.map(v => {
              const isSelected = selectedVariant === v.id;
              const noStock = v.stock_quantity <= 0;
              return (
                <button
                  key={v.id}
                  onClick={() => !noStock && setSelectedVariant(v.id)}
                  disabled={noStock}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isSelected ? 'var(--color-magenta)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--color-magenta)' : 'rgba(255,255,255,0.2)'}`,
                    color: noStock ? 'rgba(255,255,255,0.3)' : 'white',
                    borderRadius: 'var(--radius-sm)',
                    cursor: noStock ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {v.name}
                  {noStock && (
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', backgroundColor: 'rgba(255,255,255,0.3)', transform: 'rotate(-20deg)' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ padding: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>-</button>
          <span style={{ width: '40px', textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} style={{ padding: '1rem', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>+</button>
        </div>

        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={{ 
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            backgroundColor: isOutOfStock ? 'rgba(255,255,255,0.1)' : 'var(--color-magenta)', 
            color: isOutOfStock ? 'rgba(255,255,255,0.3)' : 'white',
            border: 'none', borderRadius: 'var(--radius-md)', 
            fontWeight: 800, fontSize: '1.1rem', cursor: isOutOfStock ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
        >
          <ShoppingCart size={20} />
          {isOutOfStock ? 'Agotado' : 'Añadir al Carrito'}
        </button>
      </div>
    </div>
  );
}
