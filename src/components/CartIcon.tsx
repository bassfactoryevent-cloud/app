"use client";

import { useCartStore } from "@/store/cartStore";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";

export default function CartIcon() {
  const { getTotalItems, openDrawer } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <button onClick={openDrawer} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' }} aria-label="Carrito de compras">
      <ShoppingCart size={24} />
      {mounted && getTotalItems() > 0 && (
        <span style={{
          position: 'absolute', top: '-8px', right: '-8px',
          backgroundColor: 'var(--color-magenta)', color: 'white',
          fontSize: '0.75rem', fontWeight: 700,
          width: '20px', height: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%'
        }}>
          {getTotalItems()}
        </span>
      )}
    </button>
  );
}
