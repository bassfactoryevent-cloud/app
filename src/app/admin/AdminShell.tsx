"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Music,
  Briefcase,
  Megaphone,
  FileText,
  MonitorPlay,
  Settings,
  Coins,
  Activity,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Crown,
} from "lucide-react";
import styles from "./AdminLayout.module.css";
import { signOut } from "../(auth)/actions";
import { AdminHeader } from "./components/AdminHeader";
import { AdminFooter } from "./components/AdminFooter";

interface AdminShellProps {
  profile: any;
  children: React.ReactNode;
}

export function AdminShell({ profile, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Auto-close drawer on route navigation
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Prevent background body scroll when drawer is open on mobile
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const isSuperAdmin =
    profile?.role === "superadmin" ||
    profile?.email === "danielopzj@gmail.com" ||
    profile?.email === "admin@admin.com" ||
    profile?.email === "admin@admin";

  // Centralized Navigation Groups
  const navGroups = [
    ...(isSuperAdmin
      ? [
          {
            title: "👑 Consola Master",
            items: [
              {
                name: "Ganancias Desarrollo",
                href: "/admin/super/revenue",
                icon: <Coins size={19} />,
              },
              {
                name: "Consumo Vercel & BD",
                href: "/admin/super/infrastructure",
                icon: <Activity size={19} />,
              },
            ],
          },
        ]
      : []),
    {
      title: "Resumen",
      items: [
        {
          name: "Dashboard B2B",
          href: "/admin",
          icon: <LayoutDashboard size={19} />,
        },
        {
          name: "Finanzas Globales",
          href: "/admin/finances",
          icon: <DollarSign size={19} />,
        },
      ],
    },
    {
      title: "Gestión Core",
      items: [
        {
          name: "Usuarios",
          href: "/admin/users",
          icon: <Users size={19} />,
        },
        {
          name: "Eventos & Boletería",
          href: "/admin/events",
          icon: <Calendar size={19} />,
        },
        {
          name: "DJs & Booking",
          href: "/admin/djs",
          icon: <Music size={19} />,
        },
        {
          name: "Patrocinadores",
          href: "/admin/sponsors",
          icon: <Briefcase size={19} />,
        },
      ],
    },
    {
      title: "Marketing & Tienda",
      items: [
        {
          name: "Pautas (Ads)",
          href: "/admin/ads",
          icon: <Megaphone size={19} />,
        },
        {
          name: "Merch",
          href: "/admin/merch",
          icon: <ShoppingCart size={19} />,
        },
      ],
    },
    {
      title: "Contenido",
      items: [
        {
          name: "Blog",
          href: "/admin/blog",
          icon: <FileText size={19} />,
        },
        {
          name: "Banner Principal",
          href: "/admin/hero",
          icon: <MonitorPlay size={19} />,
        },
      ],
    },
    {
      title: "Plataforma",
      items: [
        {
          name: "Ajustes",
          href: "/admin/settings",
          icon: <Settings size={19} />,
        },
      ],
    },
  ];

  // Mobile Bottom Navigation Key Items
  const mobileBottomItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Eventos",
      href: "/admin/events",
      icon: Calendar,
    },
    {
      name: "Finanzas",
      href: "/admin/finances",
      icon: DollarSign,
    },
    {
      name: "Merch",
      href: "/admin/merch",
      icon: ShoppingCart,
    },
    {
      name: "Menú",
      isAction: true,
      onClick: () => setIsDrawerOpen(true),
      icon: Menu,
    },
  ];

  const isLinkActive = (href: string, exact = false) => {
    if (exact || href === "/admin") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className={styles.adminWrapper}>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link href="/admin" style={{ display: "inline-block" }}>
            <Image
              src="/Bass-Factory-Blanco-Sin-Letras.png"
              alt="Bassfactory Logo"
              width={140}
              height={45}
              style={{ width: "125px", height: "auto", objectFit: "contain" }}
              priority
            />
          </Link>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "0.5rem",
              padding: "0.2rem 0.55rem",
              borderRadius: "999px",
              backgroundColor: isSuperAdmin ? "rgba(234, 179, 8, 0.15)" : "rgba(229, 9, 20, 0.12)",
              border: isSuperAdmin ? "1px solid rgba(234, 179, 8, 0.35)" : "1px solid rgba(229, 9, 20, 0.3)",
              color: isSuperAdmin ? "#eab308" : "var(--color-magenta, #E50914)",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {isSuperAdmin ? (
              <>
                <Crown size={11} /> Super Admin
              </>
            ) : (
              <>
                <ShieldCheck size={11} /> Admin B2B
              </>
            )}
          </div>
        </div>

        <nav className={styles.nav}>
          {navGroups.map((group, groupIdx) => (
            <div key={group.title} style={{ marginBottom: "0.5rem" }}>
              <div
                style={{
                  fontSize: "0.68rem",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                  padding: "0 0.85rem",
                  marginBottom: "0.35rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {group.title}
              </div>
              {group.items.map((item) => {
                const active = isLinkActive(item.href, item.href === "/admin");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                    style={{ position: "relative" }}
                  >
                    {active && (
                      <motion.div
                        layoutId="adminDesktopActiveTab"
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "var(--radius-md)",
                          background: "var(--color-surface-hover)",
                          zIndex: 0,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        color: active ? "var(--color-accent, #00F0FF)" : "inherit",
                      }}
                    >
                      {item.icon}
                      <span style={{ color: active ? "#ffffff" : "inherit" }}>
                        {item.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {groupIdx < navGroups.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    margin: "0.75rem 0.85rem",
                  }}
                />
              )}
            </div>
          ))}
        </nav>

        {/* Quick External Link (Desktop) */}
        <div style={{ padding: "0 0.85rem 0.75rem 0.85rem" }}>
          <Link
            href="/"
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              color: "rgba(255, 255, 255, 0.65)",
              textDecoration: "none",
              fontSize: "0.8rem",
              fontWeight: 600,
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.65)";
              e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
            }}
          >
            <ExternalLink size={15} />
            <span>Ver Tienda Pública</span>
          </Link>
        </div>

        {/* User Card & Signout (Desktop) */}
        <div style={{ padding: "1.25rem 1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem", padding: "0.25rem 0.5rem" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-magenta), #b90010)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.85rem",
                color: "white",
                flexShrink: 0,
              }}
            >
              {(profile?.full_name || "A")[0].toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.825rem", fontWeight: 700, color: "white", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {profile?.full_name || "Administrador"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {profile?.email || ""}
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.85rem",
              backgroundColor: "transparent",
              color: "#ff4d4d",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              textAlign: "left",
              width: "100%",
              borderRadius: "var(--radius-md)",
              transition: "background 0.2s",
              fontSize: "0.8rem",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 77, 77, 0.1)")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. MAIN VIEW AREA */}
      <div className={styles.mainContent}>
        {/* EXECUTIVE ADMIN HEADER */}
        <AdminHeader
          profile={profile}
          onOpenMobileMenu={() => setIsDrawerOpen(true)}
        />

        {/* CONTENT AREA WITH INTEGRATED TECHNICAL FOOTER */}
        <main className={styles.contentArea}>
          <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, paddingBottom: "2rem" }}>
              {children}
            </div>

            {/* TECHNICAL ADMIN FOOTER */}
            <AdminFooter profile={profile} />
          </div>
        </main>
      </div>

      {/* 3. MOBILE BOTTOM NAVIGATION (Fixed) */}
      <nav className={styles.mobileBottomNav}>
        {mobileBottomItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? isLinkActive(item.href, item.exact) : false;

          if (item.isAction) {
            return (
              <button
                key={item.name}
                onClick={item.onClick}
                className={`${styles.bottomNavItem} ${isDrawerOpen ? styles.bottomNavItemActive : ""}`}
                type="button"
                aria-label="Abrir menú completo"
              >
                <div className={styles.bottomNavIconWrapper}>
                  <Icon size={20} />
                </div>
                <span className={styles.bottomNavLabel}>{item.name}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href!}
              className={`${styles.bottomNavItem} ${active ? styles.bottomNavItemActive : ""}`}
            >
              <div className={styles.bottomNavIconWrapper}>
                <Icon size={20} />
              </div>
              <span className={styles.bottomNavLabel}>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 4. MOBILE SLIDEOVER DRAWER (All Features Accessible) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.drawerOverlay}
              onClick={() => setIsDrawerOpen(false)}
            />

            {/* Slideover Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className={styles.drawer}
            >
              {/* Drawer Header */}
              <div className={styles.drawerHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Image
                    src="/Bass-Factory-Blanco-Sin-Letras.png"
                    alt="Bassfactory Admin Logo"
                    width={110}
                    height={35}
                    style={{ width: "95px", height: "auto", objectFit: "contain" }}
                  />
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      padding: "0.15rem 0.45rem",
                      borderRadius: "999px",
                      backgroundColor: "rgba(229, 9, 20, 0.15)",
                      color: "var(--color-magenta)",
                      border: "1px solid rgba(229, 9, 20, 0.3)",
                    }}
                  >
                    B2B
                  </span>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className={styles.drawerCloseButton}
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User Profile Card */}
              <div className={styles.drawerUserCard}>
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--color-magenta), #b90010)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  {(profile?.full_name || "A")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "white", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {profile?.full_name || "Administrador"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {profile?.email || ""}
                  </div>
                  <div style={{ marginTop: "3px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: isSuperAdmin ? "#f59e0b" : "#22c55e",
                      }}
                    >
                      ● {isSuperAdmin ? "Superadmin" : "Admin"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Items in Drawer */}
              <div className={styles.drawerNavContent}>
                {navGroups.map((group) => (
                  <div key={group.title} style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        color: "var(--color-text-secondary)",
                        padding: "0 0.85rem",
                        marginBottom: "0.35rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {group.title}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      {group.items.map((item) => {
                        const active = isLinkActive(item.href, item.href === "/admin");

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsDrawerOpen(false)}
                            className={`${styles.drawerNavLink} ${active ? styles.drawerNavLinkActive : ""}`}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <span style={{ color: active ? "var(--color-magenta)" : "inherit" }}>
                                {item.icon}
                              </span>
                              <span>{item.name}</span>
                            </div>
                            <ChevronRight size={14} style={{ opacity: 0.3 }} />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Additional Quick Action: Go to Public Store */}
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <Link
                    href="/"
                    onClick={() => setIsDrawerOpen(false)}
                    className={styles.drawerNavLink}
                    style={{ color: "var(--color-accent, #00F0FF)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <ExternalLink size={18} />
                      <span>Ver Tienda Pública</span>
                    </div>
                    <ChevronRight size={14} style={{ opacity: 0.3 }} />
                  </Link>
                </div>
              </div>

              {/* Drawer Footer with Logout */}
              <div className={styles.drawerFooter}>
                <button
                  onClick={() => signOut()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "rgba(255, 77, 77, 0.12)",
                    border: "1px solid rgba(255, 77, 77, 0.25)",
                    color: "#ff4d4d",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
