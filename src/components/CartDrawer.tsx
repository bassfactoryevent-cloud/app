"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCartStore } from "@/store/cartStore";
import { X, Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasMerch = items.some((i) => i.itemType === "merch");
  const subtotal = getTotalPrice();

  return createPortal(
    <AnimatePresence>
      {isDrawerOpen && (
        <div
          onClick={closeDrawer}
          style={{
            position: "fixed",
            inset: 0,
            height: "100dvh",
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "380px",
              height: "100%",
              backgroundColor: "#0c0c0f",
              borderLeft: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "-16px 0 48px rgba(0,0,0,0.85)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1rem 1.15rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ShoppingCart size={18} color="var(--color-magenta)" />
                <span
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    fontFamily: "Outfit, sans-serif",
                    color: "white",
                  }}
                >
                  Tu Carrito
                </span>
                {items.length > 0 && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      padding: "1px 7px",
                      borderRadius: "999px",
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "white",
                    }}
                  >
                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar carrito"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem 1.15rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.65rem",
              }}
            >
              {items.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2.5rem 1rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <ShoppingCart
                    size={36}
                    style={{ margin: "0 auto 0.75rem", opacity: 0.25, color: "white" }}
                  />
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>
                    Tu carrito está vacío
                  </div>
                  <p style={{ fontSize: "0.78rem", margin: "0.25rem 0 1rem" }}>
                    Agrega merch oficial o entradas para continuar.
                  </p>
                  <Link
                    href="/merch"
                    onClick={closeDrawer}
                    style={{
                      display: "inline-block",
                      padding: "0.48rem 0.95rem",
                      borderRadius: "7px",
                      backgroundColor: "var(--color-magenta)",
                      color: "white",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Ver Merch
                  </Link>
                </div>
              ) : (
                items.map((item) => {
                  const itemName =
                    item.itemType === "merch" ? item.product_name : item.event_name;
                  const subName =
                    item.itemType === "merch"
                      ? item.variant_name
                      : item.ticket_tier_name;
                  return (
                    <div
                      key={item.cart_item_id}
                      style={{
                        display: "flex",
                        gap: "0.75rem",
                        padding: "0.65rem",
                        borderRadius: "10px",
                        backgroundColor: "var(--color-surface)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          width: "62px",
                          height: "62px",
                          backgroundColor: "#09090b",
                          borderRadius: "7px",
                          position: "relative",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={itemName || "Producto"}
                            fill
                            sizes="62px"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: "100%",
                              opacity: 0.3,
                            }}
                          >
                            <ShoppingCart size={20} />
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          flex: 1,
                          minWidth: 0,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "0.64rem",
                              textTransform: "uppercase",
                              color: "var(--color-magenta)",
                              fontWeight: 800,
                            }}
                          >
                            {item.itemType === "merch" ? "Merch" : "Boleta"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: "white",
                              lineHeight: 1.25,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {itemName}
                          </div>
                          {subName && (
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {subName}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginTop: "0.4rem",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              color: "white",
                            }}
                          >
                            ${(item.unit_price * item.quantity).toLocaleString("es-CO")}
                          </span>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "rgba(0,0,0,0.45)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "6px",
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.cart_item_id, item.quantity - 1)
                                }
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "white",
                                  padding: "0.22rem 0.45rem",
                                  cursor: "pointer",
                                  display: "flex",
                                }}
                              >
                                <Minus size={12} />
                              </button>
                              <span
                                style={{
                                  fontSize: "0.76rem",
                                  fontWeight: 700,
                                  width: "18px",
                                  textAlign: "center",
                                  color: "white",
                                }}
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.cart_item_id, item.quantity + 1)
                                }
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "white",
                                  padding: "0.22rem 0.45rem",
                                  cursor: "pointer",
                                  display: "flex",
                                }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.cart_item_id)}
                              aria-label="Eliminar del carrito"
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                padding: "0.2rem",
                                display: "flex",
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div
                style={{
                  padding: "1rem 1.15rem",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(0,0,0,0.45)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.65rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "white",
                  }}
                >
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-CO")} COP</span>
                </div>

                {hasMerch && (
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    Envío nacional ($15.000) se suma al finalizar la compra.
                  </div>
                )}

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={clearCart}
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "var(--color-text-secondary)",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Vaciar
                  </button>

                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    style={{
                      flex: 1,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      backgroundColor: "var(--color-magenta)",
                      color: "white",
                      padding: "0.65rem 1rem",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "0.84rem",
                    }}
                  >
                    Ir a Pagar <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
