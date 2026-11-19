"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Calendar,
  Headphones,
  ShoppingBag,
  BookOpen,
  Sliders,
  User,
  Ticket,
  Bell,
  Settings,
  LogIn,
} from "lucide-react";

export default function MobileNavDrawer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const publicLinks = [
    { href: "/", label: "Inicio", icon: <Home size={16} /> },
    { href: "/events", label: "Eventos", icon: <Calendar size={16} /> },
    { href: "/djs", label: "DJs & Booking", icon: <Headphones size={16} /> },
    { href: "/merch", label: "Merch Oficial", icon: <ShoppingBag size={16} /> },
    { href: "/blog", label: "Cultura & Noticias", icon: <BookOpen size={16} /> },
    { href: "/produccion", label: "Producción", icon: <Sliders size={16} /> },
  ];

  const accountLinks = [
    { href: "/account", label: "Mi Cuenta", icon: <User size={16} /> },
    { href: "/account/tickets", label: "Mis Tickets", icon: <Ticket size={16} /> },
    { href: "/account/orders", label: "Mis Compras", icon: <ShoppingBag size={16} /> },
    { href: "/account/notifications", label: "Avisos", icon: <Bell size={16} /> },
    { href: "/account/settings", label: "Ajustes", icon: <Settings size={16} /> },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú de navegación"
        className="mobile-hamburger-btn"
      >
        <Menu size={19} />
      </button>

      <AnimatePresence>
        {open && (
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 130,
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "82%",
                maxWidth: "310px",
                height: "100%",
                backgroundColor: "#0c0c0f",
                borderRight: "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                boxShadow: "16px 0 48px rgba(0,0,0,0.85)",
              }}
            >
              <div
                style={{
                  padding: "0.95rem 1.1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: "Outfit, sans-serif",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    letterSpacing: "0.04em",
                    color: "white",
                  }}
                >
                  BASSFACTORY
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar menú"
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

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "0.9rem 1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.1rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-secondary)",
                      marginBottom: "0.45rem",
                      paddingLeft: "4px",
                    }}
                  >
                    Plataforma
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {publicLinks.map((item) => {
                      const active =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "0.6rem 0.75rem",
                            borderRadius: "8px",
                            backgroundColor: active
                              ? "rgba(229, 9, 20, 0.14)"
                              : "var(--color-surface)",
                            border: active
                              ? "1px solid rgba(229, 9, 20, 0.4)"
                              : "1px solid rgba(255,255,255,0.06)",
                            color: "white",
                            fontSize: "0.84rem",
                            fontWeight: active ? 700 : 500,
                            textDecoration: "none",
                          }}
                        >
                          <span style={{ color: active ? "var(--color-magenta)" : "var(--color-text-secondary)", display: "flex" }}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--color-text-secondary)",
                      marginBottom: "0.45rem",
                      paddingLeft: "4px",
                    }}
                  >
                    Tu Zona
                  </div>
                  {isLoggedIn ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      {accountLinks.map((item) => {
                        const active =
                          item.href === "/account"
                            ? pathname === "/account"
                            : pathname?.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "0.6rem 0.75rem",
                              borderRadius: "8px",
                              backgroundColor: active
                                ? "rgba(0, 240, 255, 0.1)"
                                : "var(--color-surface)",
                              border: active
                                ? "1px solid rgba(0, 240, 255, 0.35)"
                                : "1px solid rgba(255,255,255,0.06)",
                              color: "white",
                              fontSize: "0.84rem",
                              fontWeight: active ? 700 : 500,
                              textDecoration: "none",
                            }}
                          >
                            <span style={{ color: active ? "var(--color-accent)" : "var(--color-text-secondary)", display: "flex" }}>
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "0.65rem 1rem",
                        borderRadius: "8px",
                        backgroundColor: "var(--color-magenta)",
                        color: "white",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      <LogIn size={16} /> Ingresar / Crear Cuenta
                    </Link>
                  )}
                </div>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .mobile-hamburger-btn {
          display: none;
        }
        @media (max-width: 900px) {
          .mobile-hamburger-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: white;
            cursor: pointer;
            flex-shrink: 0;
          }
        }
      `}</style>
    </>
  );
}
