"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Users,
  DollarSign,
  ShoppingCart,
  Music,
  Megaphone,
  FileText,
  Settings,
  PlusCircle,
  ExternalLink,
  Coins,
  Activity,
  ArrowRight,
  X,
  LayoutDashboard
} from "lucide-react";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  category: "Navegación" | "Acciones Rápidas" | "Sistema";
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  badge?: string;
}

export function CommandPaletteModal({ isOpen, onClose, isSuperAdmin }: CommandPaletteModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation / shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const allItems: CommandItem[] = [
    // Acciones Rápidas
    {
      id: "new-event",
      title: "Crear Nuevo Evento & Taquilla",
      category: "Acciones Rápidas",
      icon: <PlusCircle size={18} color="#ec4899" />,
      href: "/admin/events/new",
      badge: "Acción"
    },
    {
      id: "new-user",
      title: "Registrar Personal o Usuario",
      category: "Acciones Rápidas",
      icon: <Users size={18} color="#3b82f6" />,
      href: "/admin/users",
      badge: "Acción"
    },
    {
      id: "new-merch",
      title: "Gestionar Inventario de Merch",
      category: "Acciones Rápidas",
      icon: <ShoppingCart size={18} color="#10b981" />,
      href: "/admin/merch",
      badge: "Acción"
    },
    // Navegación
    {
      id: "nav-dash",
      title: "Dashboard B2B (Resumen General)",
      category: "Navegación",
      icon: <LayoutDashboard size={18} />,
      href: "/admin"
    },
    {
      id: "nav-events",
      title: "Eventos & Boletería",
      category: "Navegación",
      icon: <Calendar size={18} />,
      href: "/admin/events"
    },
    {
      id: "nav-finances",
      title: "Finanzas & Reportes de Ventas",
      category: "Navegación",
      icon: <DollarSign size={18} />,
      href: "/admin/finances"
    },
    {
      id: "nav-users",
      title: "Usuarios, Clientes & Personal de Puerta",
      category: "Navegación",
      icon: <Users size={18} />,
      href: "/admin/users"
    },
    {
      id: "nav-djs",
      title: "DJs, Booking & Perfiles Artísticos",
      category: "Navegación",
      icon: <Music size={18} />,
      href: "/admin/djs"
    },
    {
      id: "nav-merch",
      title: "Catálogo de Merchandising",
      category: "Navegación",
      icon: <ShoppingCart size={18} />,
      href: "/admin/merch"
    },
    {
      id: "nav-ads",
      title: "Campañas Publicitarias (Ads)",
      category: "Navegación",
      icon: <Megaphone size={18} />,
      href: "/admin/ads"
    },
    {
      id: "nav-blog",
      title: "Blog & Publicaciones",
      category: "Navegación",
      icon: <FileText size={18} />,
      href: "/admin/blog"
    },
    {
      id: "nav-settings",
      title: "Ajustes de la Plataforma",
      category: "Navegación",
      icon: <Settings size={18} />,
      href: "/admin/settings"
    },
    {
      id: "nav-public",
      title: "Ver Tienda Pública y Eventos",
      category: "Navegación",
      icon: <ExternalLink size={18} />,
      href: "/"
    },
    ...(isSuperAdmin ? [
      {
        id: "super-revenue",
        title: "Master: Ganancias de Desarrollo",
        category: "Sistema" as const,
        icon: <Coins size={18} color="#eab308" />,
        href: "/admin/super/revenue",
        badge: "Superadmin"
      },
      {
        id: "super-infra",
        title: "Master: Consumo Vercel & Supabase",
        category: "Sistema" as const,
        icon: <Activity size={18} color="#eab308" />,
        href: "/admin/super/infrastructure",
        badge: "Superadmin"
      }
    ] : [])
  ];

  const filtered = allItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: CommandItem) => {
    onClose();
    if (item.href) {
      if (item.href === "/") {
        window.open("/", "_blank");
      } else {
        router.push(item.href);
      }
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          paddingTop: "12vh",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)"
        }}>
          {/* Backdrop Click */}
          <div
            onClick={onClose}
            style={{ position: "absolute", inset: 0 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.16 }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "620px",
              backgroundColor: "rgba(18, 18, 22, 0.98)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "1rem",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              overflow: "hidden"
            }}
          >
            {/* Search Input Bar */}
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              gap: "0.75rem"
            }}>
              <Search size={20} style={{ color: "rgba(255, 255, 255, 0.4)", flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar sección, evento, usuario o acción rápida..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#FFFFFF",
                  fontSize: "1rem",
                  fontWeight: 500
                }}
              />
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px"
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* List Results */}
            <div style={{ maxHeight: "380px", overflowY: "auto", padding: "0.5rem" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.9rem" }}>
                  No se encontraron resultados para &quot;{query}&quot;
                </div>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.6rem",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.85)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.15s ease",
                      gap: "0.75rem"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.color = "#FFFFFF";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.85)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      <div style={{ color: "rgba(255, 255, 255, 0.6)", display: "flex", alignItems: "center" }}>
                        {item.icon}
                      </div>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.title}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      {item.badge && (
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          backgroundColor: item.badge === "Superadmin" ? "rgba(234, 179, 8, 0.15)" : "rgba(236, 72, 153, 0.15)",
                          color: item.badge === "Superadmin" ? "#eab308" : "#ec4899"
                        }}>
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight size={14} style={{ color: "rgba(255, 255, 255, 0.3)" }} />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer Hints */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1rem",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
              fontSize: "0.72rem",
              color: "rgba(255, 255, 255, 0.4)"
            }}>
              <span>Navega con <b>↑ ↓</b> o haz clic</span>
              <span>Presiona <b>ESC</b> para cerrar</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
