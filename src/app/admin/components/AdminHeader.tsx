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
  ChevronDown,
  DollarSign,
  Package,
  ArrowRightLeft,
  CheckCheck
} from "lucide-react";
import { CommandPaletteModal } from "./CommandPaletteModal";
import { getAdminLiveNotifications, AdminNotificationItem } from "../actions/getAdminNotifications";

interface AdminHeaderProps {
  profile: any;
  onOpenMobileMenu: () => void;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Justo ahora";
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} d`;
    return new Date(dateStr).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export function AdminHeader({ profile, onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Notifications State
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "sale" | "event" | "user">("all");
  const [lastReadTime, setLastReadTime] = useState<number>(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);

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

  // Fetch Notifications on load & interval
  const loadNotifications = async () => {
    try {
      setIsLoadingNotifs(true);
      const data = await getAdminLiveNotifications();
      setNotifications(data);
    } catch (err) {
      console.error("Error loading admin notifications:", err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const notifInterval = setInterval(loadNotifications, 45000);

    // Read stored last read timestamp
    try {
      const stored = localStorage.getItem("bassfactory_admin_notifs_read");
      if (stored) {
        setLastReadTime(Number(stored));
      }
    } catch {}

    return () => clearInterval(notifInterval);
  }, []);

  // Mark all as read
  const handleMarkAsRead = () => {
    const now = Date.now();
    setLastReadTime(now);
    try {
      localStorage.setItem("bassfactory_admin_notifs_read", String(now));
    } catch {}
  };

  // Close dropdowns on route change
  useEffect(() => {
    setIsQuickCreateOpen(false);
    setIsAlertsOpen(false);
  }, [pathname]);

  // Count unread
  const unreadCount = notifications.filter(
    (n) => new Date(n.timestamp).getTime() > lastReadTime
  ).length;

  // Filtered Notifications
  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "sale") return n.category === "sale" || n.category === "shipping";
    if (activeTab === "event") return n.category === "event" || n.category === "transfer";
    if (activeTab === "user") return n.category === "user";
    return true;
  });

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
    if (pathname.startsWith("/admin/analytics")) {
      return [{ label: "Analíticas & Tráfico En Vivo", href: "/admin/analytics", isCurrent: true }];
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

        {/* RIGHT: Live Status + Clock + Quick Create Button + Interactive Notifications */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", flexShrink: 0 }}>
          {/* Quick Analytics & Real-Time Traffic Access */}
          <Link
            href="/admin/analytics"
            className="header-analytics-badge"
            title="Analíticas de tráfico 100% en vivo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.32rem 0.7rem",
              borderRadius: "0.5rem",
              backgroundColor: pathname === "/admin/analytics" ? "rgba(217, 4, 22, 0.16)" : "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${pathname === "/admin/analytics" ? "rgba(217, 4, 22, 0.5)" : "rgba(255, 255, 255, 0.08)"}`,
              fontSize: "0.74rem",
              fontWeight: 700,
              color: pathname === "/admin/analytics" ? "#ff4d5a" : "#FFFFFF",
              textDecoration: "none",
              transition: "all 0.15s ease",
            }}
          >
            <Activity size={13} style={{ color: "#D90416" }} />
            <span>Tráfico en Vivo</span>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 6px #22c55e"
              }}
            />
          </Link>

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

          {/* Interactive Notifications Center Bell */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                const nextState = !isAlertsOpen;
                setIsAlertsOpen(nextState);
                setIsQuickCreateOpen(false);
                if (nextState) {
                  loadNotifications();
                }
              }}
              title="Centro de Notificaciones y Actividad"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "0.55rem",
                backgroundColor: isAlertsOpen ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: isAlertsOpen ? "#FFFFFF" : "rgba(255, 255, 255, 0.75)",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.09)";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseOut={(e) => {
                if (!isAlertsOpen) {
                  e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)";
                }
              }}
            >
              <Bell size={17} />
              
              {/* Dynamic Unread Badge */}
              {unreadCount > 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 4px",
                    borderRadius: "999px",
                    backgroundColor: "var(--color-magenta, #ec4899)",
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 10px rgba(236, 72, 153, 0.6)",
                    border: "2px solid #0c0c10"
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : (
                <span
                  style={{
                    position: "absolute",
                    top: "7px",
                    right: "7px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    boxShadow: "0 0 6px #22c55e"
                  }}
                />
              )}
            </button>

            {/* Notifications Dropdown Panel */}
            {isAlertsOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "0.5rem",
                  width: "380px",
                  maxWidth: "92vw",
                  backgroundColor: "rgba(18, 18, 24, 0.98)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "1rem",
                  boxShadow: "0 25px 60px -10px rgba(0, 0, 0, 0.8)",
                  overflow: "hidden",
                  zIndex: 60
                }}
              >
                {/* Header */}
                <div style={{
                  padding: "0.9rem 1.1rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 800, color: "#FFFFFF" }}>
                      Actividad en Vivo
                    </span>
                    {unreadCount > 0 && (
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "0.1rem 0.45rem",
                        borderRadius: "999px",
                        backgroundColor: "rgba(236, 72, 153, 0.2)",
                        color: "var(--color-magenta, #ec4899)",
                        border: "1px solid rgba(236, 72, 153, 0.4)"
                      }}>
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAsRead}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontWeight: 600
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#FFFFFF")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)")}
                    >
                      <CheckCheck size={13} />
                      Marcar leídas
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div style={{
                  display: "flex",
                  gap: "0.3rem",
                  padding: "0.5rem 0.85rem",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.05)"
                }}>
                  {[
                    { id: "all", label: `Todas (${notifications.length})` },
                    { id: "sale", label: "💰 Ventas" },
                    { id: "event", label: "🎪 Eventos" },
                    { id: "user", label: "👤 Usuarios" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      style={{
                        padding: "0.3rem 0.6rem",
                        borderRadius: "0.4rem",
                        fontSize: "0.74rem",
                        fontWeight: activeTab === tab.id ? 700 : 500,
                        backgroundColor: activeTab === tab.id ? "rgba(255, 255, 255, 0.12)" : "transparent",
                        color: activeTab === tab.id ? "#FFFFFF" : "rgba(255, 255, 255, 0.55)",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Notifications Scroll List */}
                <div style={{ maxHeight: "360px", overflowY: "auto", padding: "0.4rem" }}>
                  {filteredNotifs.length === 0 ? (
                    <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "rgba(255, 255, 255, 0.4)", fontSize: "0.825rem" }}>
                      {isLoadingNotifs ? "Cargando actividad..." : "No hay notificaciones recientes en esta sección."}
                    </div>
                  ) : (
                    filteredNotifs.map((item) => {
                      const isUnread = new Date(item.timestamp).getTime() > lastReadTime;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setIsAlertsOpen(false);
                            router.push(item.href);
                          }}
                          style={{
                            padding: "0.7rem 0.85rem",
                            borderRadius: "0.6rem",
                            backgroundColor: isUnread ? "rgba(236, 72, 153, 0.06)" : "transparent",
                            border: `1px solid ${isUnread ? "rgba(236, 72, 153, 0.15)" : "transparent"}`,
                            marginBottom: "0.35rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = isUnread ? "rgba(236, 72, 153, 0.06)" : "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.2rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", minWidth: 0 }}>
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.title}
                              </span>
                            </div>

                            <span style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.4)", whiteSpace: "nowrap", flexShrink: 0 }}>
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>

                          <p style={{ margin: "0 0 0.4rem 0", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.65)", lineHeight: 1.35 }}>
                            {item.description}
                          </p>

                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            {item.badge && (
                              <span style={{
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                                backgroundColor: item.badgeColor ? `${item.badgeColor}22` : "rgba(255, 255, 255, 0.08)",
                                color: item.badgeColor || "#FFFFFF",
                                border: `1px solid ${item.badgeColor ? `${item.badgeColor}55` : "rgba(255, 255, 255, 0.15)"}`
                              }}>
                                {item.badge}
                              </span>
                            )}

                            <span style={{ fontSize: "0.7rem", color: "var(--color-magenta, #ec4899)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "2px" }}>
                              Ver detalles →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Status */}
                <div style={{
                  padding: "0.6rem 0.9rem",
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.7rem",
                  color: "rgba(255, 255, 255, 0.45)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <CheckCircle2 size={12} color="#22c55e" />
                    <span>Bold, Supabase y Resend online</span>
                  </div>
                  <span>Sincronización en vivo</span>
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
