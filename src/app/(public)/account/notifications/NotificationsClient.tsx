"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  Package, 
  Ticket, 
  Truck, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  Clock,
  Filter
} from "lucide-react";
import { AppNotification } from "@/utils/notifications";

export default function NotificationsClient({
  notifications,
  userRole
}: {
  notifications: AppNotification[];
  userRole?: string;
}) {
  const [selectedTab, setSelectedTab] = useState<string>("all");

  const isAdmin = userRole === "admin";

  const tabs = [
    { id: "all", label: "Todas", count: notifications.length },
    { id: "order", label: "Compras & Facturas", count: notifications.filter(n => n.category === "order").length },
    { id: "shipping", label: "Envíos & Merch", count: notifications.filter(n => n.category === "shipping").length },
    { id: "ticket", label: "Boletas", count: notifications.filter(n => n.category === "ticket").length },
    ...(isAdmin ? [{ id: "admin", label: "Panel Admin", count: notifications.filter(n => n.category === "admin").length }] : []),
  ];

  const filteredNotifications = notifications.filter(n => {
    if (selectedTab === "all") return true;
    return n.category === selectedTab;
  });

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "order":
        return {
          icon: <FileText size={22} style={{ color: "#00F0FF" }} />,
          badgeBg: "rgba(0, 240, 255, 0.12)",
          badgeBorder: "rgba(0, 240, 255, 0.3)",
          badgeColor: "#00F0FF",
          label: "Facturación & Compra",
          cardBorder: "rgba(0, 240, 255, 0.25)"
        };
      case "shipping":
        return {
          icon: <Truck size={22} style={{ color: "#22c55e" }} />,
          badgeBg: "rgba(34, 197, 94, 0.12)",
          badgeBorder: "rgba(34, 197, 94, 0.3)",
          badgeColor: "#22c55e",
          label: "Logística de Tienda",
          cardBorder: "rgba(34, 197, 94, 0.25)"
        };
      case "ticket":
        return {
          icon: <Ticket size={22} style={{ color: "#a855f7" }} />,
          badgeBg: "rgba(168, 85, 247, 0.12)",
          badgeBorder: "rgba(168, 85, 247, 0.3)",
          badgeColor: "#c084fc",
          label: "Boletería & Antifraude",
          cardBorder: "rgba(168, 85, 247, 0.25)"
        };
      case "admin":
        return {
          icon: <ShieldAlert size={22} style={{ color: "#ef4444" }} />,
          badgeBg: "rgba(239, 68, 68, 0.15)",
          badgeBorder: "rgba(239, 68, 68, 0.35)",
          badgeColor: "#ef4444",
          label: "Alerta Administrativa",
          cardBorder: "rgba(239, 68, 68, 0.35)"
        };
      default:
        return {
          icon: <Sparkles size={22} style={{ color: "var(--color-magenta)" }} />,
          badgeBg: "rgba(217, 4, 22, 0.12)",
          badgeBorder: "rgba(217, 4, 22, 0.3)",
          badgeColor: "#ff4d4d",
          label: "Comunidad Bassfactory",
          cardBorder: "rgba(255, 255, 255, 0.1)"
        };
    }
  };

  const formatNotificationTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 5) return "Hace un momento";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hoy a las ${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
      if (diffDays === 1) return `Ayer a las ${date.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
      return date.toLocaleDateString("es-CO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      {/* Category Tabs */}
      <div style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        paddingBottom: "0.5rem",
        marginBottom: "2rem",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1rem",
                borderRadius: "0.5rem",
                border: "none",
                backgroundColor: isActive ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.02)",
                color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
                borderBottom: isActive ? "2px solid var(--color-magenta)" : "2px solid transparent"
              }}
            >
              {tab.label}
              <span style={{
                fontSize: "0.7rem",
                padding: "0.15rem 0.45rem",
                borderRadius: "1rem",
                backgroundColor: isActive ? "var(--color-magenta)" : "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div style={{
          padding: "4rem 2rem",
          textAlign: "center",
          backgroundColor: "rgba(255,255,255,0.02)",
          borderRadius: "1rem",
          border: "1px dashed rgba(255,255,255,0.1)"
        }}>
          <Bell size={48} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", margin: "0 0 0.5rem 0" }}>
            No hay notificaciones en esta categoría
          </h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Tus avisos y novedades se actualizarán en tiempo real cuando realices compras o recibas boletas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredNotifications.map((notif) => {
            const config = getCategoryConfig(notif.category);
            return (
              <div
                key={notif.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1.25rem",
                  padding: "1.5rem",
                  backgroundColor: "rgba(255,255,255,0.025)",
                  borderRadius: "1rem",
                  border: `1px solid ${config.cardBorder}`,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  transition: "transform 0.15s ease",
                  flexWrap: "wrap"
                }}
              >
                {/* Left Icon */}
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "0.75rem",
                  backgroundColor: config.badgeBg,
                  border: `1px solid ${config.badgeBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {config.icon}
                </div>

                {/* Body Details */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "0.25rem",
                      backgroundColor: config.badgeBg,
                      color: config.badgeColor,
                      border: `1px solid ${config.badgeBorder}`
                    }}>
                      {config.label}
                    </span>

                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                      <Clock size={12} /> {formatNotificationTime(notif.createdAt)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: "0 0 0.35rem 0", lineHeight: 1.4 }}>
                    {notif.title}
                  </h3>

                  <p style={{ fontSize: "0.9rem", color: "#a1a1aa", margin: "0 0 1rem 0", lineHeight: 1.5 }}>
                    {notif.message}
                  </p>

                  {/* Direct Action CTA Button */}
                  <Link
                    href={notif.actionHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "0.5rem",
                      backgroundColor: notif.category === "admin" ? "rgba(239,68,68,0.15)" : notif.category === "order" ? "rgba(0,240,255,0.12)" : "rgba(217,4,22,0.15)",
                      border: notif.category === "admin" ? "1px solid rgba(239,68,68,0.4)" : notif.category === "order" ? "1px solid rgba(0,240,255,0.3)" : "1px solid rgba(217,4,22,0.4)",
                      color: notif.category === "admin" ? "#ef4444" : notif.category === "order" ? "#00F0FF" : "#ff4d4d",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {notif.actionText} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
