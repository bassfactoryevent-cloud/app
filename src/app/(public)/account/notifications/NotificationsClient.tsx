"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Ticket,
  Truck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
} from "lucide-react";
import { AppNotification } from "@/utils/notifications";

export default function NotificationsClient({
  notifications,
  userRole,
}: {
  notifications: AppNotification[];
  userRole?: string;
}) {
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = userRole === "admin";

  const tabs = [
    { id: "all", label: "Todas", count: notifications.length },
    {
      id: "order",
      label: "Compras",
      count: notifications.filter((n) => n.category === "order").length,
    },
    {
      id: "shipping",
      label: "Envíos",
      count: notifications.filter((n) => n.category === "shipping").length,
    },
    {
      id: "ticket",
      label: "Boletas",
      count: notifications.filter((n) => n.category === "ticket").length,
    },
    ...(isAdmin
      ? [
          {
            id: "admin",
            label: "Admin",
            count: notifications.filter((n) => n.category === "admin").length,
          },
        ]
      : []),
  ];

  const filteredNotifications = notifications.filter((n) => {
    if (selectedTab === "all") return true;
    return n.category === selectedTab;
  });

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case "order":
        return {
          icon: <FileText size={18} style={{ color: "#00F0FF" }} />,
          badgeBg: "rgba(0, 240, 255, 0.12)",
          badgeBorder: "rgba(0, 240, 255, 0.3)",
          badgeColor: "#00F0FF",
          label: "Facturación",
        };
      case "shipping":
        return {
          icon: <Truck size={18} style={{ color: "#22c55e" }} />,
          badgeBg: "rgba(34, 197, 94, 0.12)",
          badgeBorder: "rgba(34, 197, 94, 0.3)",
          badgeColor: "#22c55e",
          label: "Envío",
        };
      case "ticket":
        return {
          icon: <Ticket size={18} style={{ color: "#a855f7" }} />,
          badgeBg: "rgba(168, 85, 247, 0.12)",
          badgeBorder: "rgba(168, 85, 247, 0.3)",
          badgeColor: "#c084fc",
          label: "Boletería",
        };
      case "admin":
        return {
          icon: <ShieldAlert size={18} style={{ color: "#ef4444" }} />,
          badgeBg: "rgba(239, 68, 68, 0.14)",
          badgeBorder: "rgba(239, 68, 68, 0.35)",
          badgeColor: "#ef4444",
          label: "Admin",
        };
      default:
        return {
          icon: <Sparkles size={18} style={{ color: "var(--color-magenta)" }} />,
          badgeBg: "rgba(229, 9, 20, 0.12)",
          badgeBorder: "rgba(229, 9, 20, 0.3)",
          badgeColor: "#ff4d4d",
          label: "Bassfactory",
        };
    }
  };

  const formatNotificationTime = (dateStr: string) => {
    if (!mounted) {
      return new Date(dateStr).toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      });
    }
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 5) return "Hace un momento";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24)
        return `Hoy ${date.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      if (diffDays === 1)
        return `Ayer ${date.toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      return date.toLocaleDateString("es-CO", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Category Filter Pills (wraps cleanly on mobile!) */}
      <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "0.4rem 0.8rem",
                borderRadius: "999px",
                border: isActive
                  ? "1px solid var(--color-magenta)"
                  : "1px solid rgba(255,255,255,0.08)",
                backgroundColor: isActive
                  ? "rgba(229, 9, 20, 0.16)"
                  : "var(--color-surface)",
                color: isActive ? "#ffffff" : "var(--color-text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.76rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 6px",
                  borderRadius: "999px",
                  backgroundColor: isActive
                    ? "var(--color-magenta)"
                    : "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div
          style={{
            padding: "2.25rem 1.5rem",
            textAlign: "center",
            backgroundColor: "var(--color-surface)",
            borderRadius: "12px",
            border: "1px dashed rgba(255,255,255,0.12)",
          }}
        >
          <Bell size={34} style={{ opacity: 0.3, margin: "0 auto 0.75rem", color: "white" }} />
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "white" }}>
            No hay avisos en esta categoría
          </div>
          <p
            style={{
              color: "var(--color-text-secondary)",
              fontSize: "0.8rem",
              margin: "0.3rem 0 0 0",
            }}
          >
            Tus avisos se actualizarán aquí cuando compres o recibas boletas.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          {filteredNotifications.map((notif) => {
            const config = getCategoryConfig(notif.category);
            return (
              <div
                key={notif.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.85rem",
                  padding: "0.9rem 1rem",
                  backgroundColor: "var(--color-surface)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: config.badgeBg,
                    border: `1px solid ${config.badgeBorder}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        backgroundColor: config.badgeBg,
                        color: config.badgeColor,
                      }}
                    >
                      {config.label}
                    </span>

                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--color-text-secondary)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Clock size={11} /> {formatNotificationTime(notif.createdAt)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.3,
                      marginBottom: "0.25rem",
                    }}
                  >
                    {notif.title}
                  </div>

                  <p
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--color-text-secondary)",
                      margin: "0 0 0.65rem 0",
                      lineHeight: 1.45,
                    }}
                  >
                    {notif.message}
                  </p>

                  <Link
                    href={notif.actionHref}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "0.35rem 0.75rem",
                      borderRadius: "6px",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    {notif.actionText} <ArrowRight size={12} />
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
