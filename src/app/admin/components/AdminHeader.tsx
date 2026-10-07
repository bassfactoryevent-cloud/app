"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ChevronRight,
  Search,
  Bell,
  Plus,
  Calendar,
  Users,
  ShoppingCart,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Activity,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { CommandPaletteModal } from "./CommandPaletteModal";

interface AdminHeaderProps {
  profile: any;
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ profile, onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Live Clock (Colombia COT / UTC-5)
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = now.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/Bogota"
        });
        setCurrentTime(formatted);
      } catch {
        setCurrentTime("");
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on route change or click outside
  useEffect(() => {
    setIsQuickCreateOpen(false);
    setIsAlertsOpen(false);
  }, [pathname]);

  // Dynamic Breadcrumb Resolver
  const getBreadcrumbs = () => {
    if (pathname === "/admin") {
      return [{ label: "Dashboard B2B", href: "/admin", isCurrent: true }];
    }
    if (pathname === "/admin/events/new") {
      return [
        { label: "Eventos", href: "/admin/events" },
        { label: "Nuevo Evento", href: "/admin/events/new", isCurrent: true }
      ];
    }
    if (pathname.startsWith("/admin/events")) {
      return [{ label: "Eventos & Taquilla", href: "/admin/events", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/finances")) {
      return [{ label: "Finanzas Globales", href: "/admin/finances", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/users")) {
      return [{ label: "Usuarios & Roles", href: "/admin/users", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/merch")) {
      return [{ label: "Tienda de Merch", href: "/admin/merch", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/djs")) {
      return [{ label: "DJs & Booking", href: "/admin/djs", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/sponsors")) {
      return [{ label: "Patrocinadores", href: "/admin/sponsors", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/ads")) {
      return [{ label: "Campañas Ads", href: "/admin/ads", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/blog")) {
      return [{ label: "Blog & Contenidos", href: "/admin/blog", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/hero")) {
      return [{ label: "Banner Principal", href: "/admin/hero", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/settings")) {
      return [{ label: "Ajustes de Plataforma", href: "/admin/settings", isCurrent: true }];
    }
    if (pathname.startsWith("/admin/super/revenue")) {
      return [
        { label: "Master", href: "/admin" },
        { label: "Ganancias Desarrollo", href: "/admin/super/revenue", isCurrent: true }
      ];
    }
    if (pathname.startsWith("/admin/super/infrastructure")) {
      return [
        { label: "Master", href: "/admin" },
        { label: "Consumo Vercel & BD", href: "/admin/super/infrastructure", isCurrent: true }
      ];
    }

    const cleanSegment = pathname.replace("/admin/", "").replace(/-/g, " ");
    return [{ label: cleanSegment, href: pathname, isCurrent: true }];
  };

  const breadcrumbs = getBreadcrumbs();
  const isSuperAdmin = profile?.role === "superadmin";

  return (
    <>
      <header
        style={{
          height: "58px",
          backgroundColor: "rgba(12, 12, 16, 0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          flexShrink: 0,
          zIndex: 30,
          position: "sticky",
          top: 0
        }}
      >
        {/* LEFT: Mobile Hamburger + Dynamic Breadcrumbs */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
          {/* Mobile hamburger menu button */}
          <button
            onClick={onOpenMobileMenu}
            aria-label="Abrir menú"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#FFFFFF",
              cursor: "pointer",
              padding: 0
            }}
            className="header-mobile-trigger"
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs Navigation */}
          <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap", overflow: "hidden" }}>
            <Link
              href="/admin"
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.5)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "color 0.2s"
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#FFFFFF")}
              onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
            >
              Admin
            </Link>

            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href || idx}>
                <ChevronRight size={13} style={{ color: "rgba(255, 255, 255, 0.25)", flexShrink: 0 }} />
                {crumb.isCurrent ? (
                  <span
                    style={{
                      fontSize: "0.825rem",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      textOverflow: "ellipsis",
                      overflow: "hidden"
                    }}
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "rgba(255, 255, 255, 0.5)",
                      textDecoration: "none",
                      transition: "color 0.2s"
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* CENTER: Quick Search Trigger (Cmd + K) */}
        <div style={{ flex: 1, maxWidth: "380px", margin: "0 1.25rem" }} className="header-search-wrapper">
          <button
            onClick={() => setIsCommandOpen(true)}
            type="button"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.45rem 0.85rem",
              borderRadius: "0.55rem",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "rgba(255, 255, 255, 0.45)",
              fontSize: "0.8rem",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.07)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.16)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={14} />
              <span>Buscar en el sistema...</span>
            </div>
            <kbd
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "0.15rem 0.45rem",
                borderRadius: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.6)",
                fontFamily: "monospace"
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* RIGHT: Live Status + Clock + Quick Create Button + Notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
          {/* Live System Health Badge */}
          <div
            title="Infraestructura Operativa: Supabase DB OK • Pasarela Bold OK"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.3rem 0.65rem",
              borderRadius: "999px",
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#4ade80",
              letterSpacing: "0.03em"
            }}
            className="header-status-badge"
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 8px #22c55e"
              }}
            />
            <span>SISTEMA ACTIVO</span>
          </div>

          {/* Colombia Clock (COT) */}
          {currentTime && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.3rem 0.6rem",
                borderRadius: "0.45rem",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "rgba(255, 255, 255, 0.65)",
                fontVariantNumeric: "tabular-nums"
              }}
              className="header-clock"
            >
              <Clock size={13} style={{ color: "var(--color-magenta, #ec4899)" }} />
              <span>{currentTime}</span>
            </div>
          )}

          {/* Quick Create Button "+ Nuevo" with Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setIsQuickCreateOpen(!isQuickCreateOpen);
                setIsAlertsOpen(false);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.42rem 0.85rem",
                borderRadius: "0.55rem",
                backgroundColor: "var(--color-magenta, #ec4899)",
                color: "#FFFFFF",
                fontSize: "0.8rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(236, 72, 153, 0.3)",
                transition: "opacity 0.2s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <Plus size={15} />
              <span>Nuevo</span>
              <ChevronDown size={13} />
            </button>

            {isQuickCreateOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.5rem",
                  width: "220px",
                  backgroundColor: "rgba(18, 18, 22, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)",
                  padding: "0.4rem",
                  zIndex: 50
                }}
              >
                <Link
                  href="/admin/events/new"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    transition: "background 0.15s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Calendar size={15} color="#ec4899" />
                  <span>Nuevo Evento</span>
                </Link>

                <Link
                  href="/admin/merch"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    transition: "background 0.15s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <ShoppingCart size={15} color="#10b981" />
                  <span>Nuevo Merch</span>
                </Link>

                <Link
                  href="/admin/users"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    transition: "background 0.15s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Users size={15} color="#3b82f6" />
                  <span>Registrar Personal</span>
                </Link>

                <Link
                  href="/admin/blog"
                  onClick={() => setIsQuickCreateOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 0.75rem",
                    borderRadius: "0.5rem",
                    color: "#FFFFFF",
                    textDecoration: "none",
                    fontSize: "0.825rem",
                    fontWeight: 600,
                    transition: "background 0.15s ease"
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <FileText size={15} color="#a855f7" />
                  <span>Nuevo Artículo Blog</span>
                </Link>
              </div>
            )}
          </div>

          {/* Operational Alerts Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setIsAlertsOpen(!isAlertsOpen);
                setIsQuickCreateOpen(false);
              }}
              title="Notificaciones y Estado del Sistema"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "34px",
                height: "34px",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "rgba(255, 255, 255, 0.7)",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
              }}
            >
              <Bell size={16} />
              {/* Green indicator dot */}
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#22c55e",
                  boxShadow: "0 0 6px #22c55e"
                }}
              />
            </button>

            {isAlertsOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.5rem",
                  width: "290px",
                  backgroundColor: "rgba(18, 18, 22, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 15px 35px rgba(0, 0, 0, 0.6)",
                  padding: "0.85rem",
                  zIndex: 50
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.65rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Estado del Ecosistema
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#4ade80", fontWeight: 700 }}>
                    100% Operativo
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.76rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255, 255, 255, 0.8)" }}>
                    <CheckCircle2 size={13} color="#22c55e" />
                    <span>Pasarela Bold (Producción)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255, 255, 255, 0.8)" }}>
                    <CheckCircle2 size={13} color="#22c55e" />
                    <span>Base de Datos Supabase (Sync)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255, 255, 255, 0.8)" }}>
                    <CheckCircle2 size={13} color="#22c55e" />
                    <span>Servicio de Correos Resend</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255, 255, 255, 0.8)" }}>
                    <CheckCircle2 size={13} color="#22c55e" />
                    <span>Control de Escáner Puerta</span>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem", paddingTop: "0.6rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)", fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.45)", textAlign: "center" }}>
                  Transacciones en tiempo real activas
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        isSuperAdmin={isSuperAdmin}
      />
    </>
  );
}
