"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";

export default function AddToCartClient({
  product,
  variants,
  primaryImage,
}: {
  product: any;
  variants: any[];
  primaryImage: string | null;
}) {
  const firstAvailable = variants.find((v) => v.stock_quantity > 0) || variants[0] || null;
  const [selectedVariant, setSelectedVariant] = useState(
    firstAvailable ? firstAvailable.id : null
  );
  const [quantity, setQuantity] = useState(1);
  const { addItem, openDrawer } = useCartStore();

  const currentVariant = variants.find((v) => v.id === selectedVariant);
  const currentPrice = currentVariant?.price_override
    ? parseFloat(currentVariant.price_override)
    : parseFloat(product.base_price);

  const isOutOfStock =
    product.status === "out_of_stock" ||
    (currentVariant && currentVariant.stock_quantity <= 0);

  const maxStock = currentVariant?.stock_quantity ?? 99;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      itemType: "merch",
      product_id: product.id,
      variant_id: selectedVariant,
      product_name: product.title,
      variant_name: currentVariant ? currentVariant.name : null,
      image_url: primaryImage,
      unit_price: currentPrice,
      quantity,
    });
    toast.success(`${product.title} agregado al carrito`);
    openDrawer();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
        <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "white" }}>
          ${currentPrice.toLocaleString("es-CO")} COP
        </span>
        {currentVariant && currentVariant.stock_quantity > 0 && currentVariant.stock_quantity <= 5 && (
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#f59e0b" }}>
            ¡Últimas {currentVariant.stock_quantity} unidades!
          </span>
        )}
      </div>

      {variants.length > 0 && (
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.74rem",
              fontWeight: 700,
              marginBottom: "0.45rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--color-text-secondary)",
            }}
          >
            Talla / Variante
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
            {variants.map((v) => {
              const isSelected = selectedVariant === v.id;
              const noStock = v.stock_quantity <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    if (!noStock) {
                      setSelectedVariant(v.id);
                      setQuantity(1);
                    }
                  }}
                  disabled={noStock}
                  style={{
                    padding: "0.45rem 0.9rem",
                    backgroundColor: isSelected
                      ? "rgba(229, 9, 20, 0.18)"
                      : "var(--color-surface)",
                    border: `1px solid ${
                      isSelected ? "var(--color-magenta)" : "rgba(255,255,255,0.12)"
                    }`,
                    color: noStock ? "rgba(255,255,255,0.3)" : "white",
                    borderRadius: "7px",
                    cursor: noStock ? "not-allowed" : "pointer",
                    fontSize: "0.78rem",
                    fontWeight: isSelected ? 700 : 600,
                    textDecoration: noStock ? "line-through" : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity + Add to Cart */}
      <div style={{ display: "flex", gap: "0.65rem", alignItems: "stretch" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "var(--color-surface)",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            aria-label="Disminuir cantidad"
            style={{
              padding: "0.6rem 0.75rem",
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Minus size={14} />
          </button>
          <span style={{ width: "28px", textAlign: "center", fontWeight: 700, fontSize: "0.85rem" }}>
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
            aria-label="Aumentar cantidad"
            style={{
              padding: "0.6rem 0.75rem",
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.68rem 1.1rem",
            backgroundColor: isOutOfStock
              ? "rgba(255,255,255,0.08)"
              : "var(--color-magenta)",
            color: isOutOfStock ? "rgba(255,255,255,0.35)" : "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 700,
            fontSize: "0.84rem",
            cursor: isOutOfStock ? "not-allowed" : "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <ShoppingCart size={16} />
          {isOutOfStock ? "Agotado" : "Añadir al Carrito"}
        </button>
      </div>

      {/* Compact Trust Strip */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          paddingTop: "0.25rem",
          fontSize: "0.74rem",
          color: "var(--color-text-secondary)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <Truck size={13} color="var(--color-accent)" /> Envío nacional ($15.000)
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <ShieldCheck size={13} color="#22c55e" /> Producto oficial Bassfactory
        </span>
      </div>
    </div>
  );
}
