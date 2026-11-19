"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Ticket, ShoppingBag, Bell, Settings, ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getAccountBadgesAction, type AccountBadgesPayload } from "./actions";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userMeta, setUserMeta] = useState<any>({});
  const [badges, setBadges] = useState<AccountBadgesPayload | null>(null);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);

  useEffect(() => {
    const fetchProfileAndBadges = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        setUserMeta(user.user_metadata || {});
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        setProfile(data || { full_name: user.user_metadata?.name });
      }

      try {
        const b = await getAccountBadgesAction();
        setBadges(b);
        if (b && b.notificationsCount > 0 && typeof window !== "undefined") {
          const seenAt = localStorage.getItem("bf_seen_notifs_at");
          const isOnNotifPage = pathname.startsWith("/account/notifications");
          if (isOnNotifPage && b.latestNotificationAt) {
            localStorage.setItem("bf_seen_notifs_at", b.latestNotificationAt);
            setHasUnreadNotifs(false);
          } else if (
            b.latestNotificationAt &&
            (!seenAt || new Date(b.latestNotificationAt) > new Date(seenAt))
          ) {
            setHasUnreadNotifs(true);
          } else {
            setHasUnreadNotifs(false);
          }
        } else {
          setHasUnreadNotifs(false);
        }
      } catch {
        // Ignore badge fetch errors silently
      }
    };
    fetchProfileAndBadges();

    window.addEventListener("profile_updated", fetchProfileAndBadges);
    return () => window.removeEventListener("profile_updated", fetchProfileAndBadges);
  }, [pathname]);

  const navItems = [
    {
      name: "Cuenta",
      shortName: "Cuenta",
      href: "/account",
      icon: <User size={16} />,
      exact: true,
      dotColor: null as string | null,
      badgeCount: 0,
    },
    {
      name: "Mis Tickets",
      shortName: "Tickets",
      href: "/account/tickets",
      icon: <Ticket size={16} />,
      dotColor:
        (badges?.incomingTicketsCount || 0) > 0
          ? "#00F0FF"
          : (badges?.qrReadyTicketsCount || 0) > 0
          ? "#22c55e"
          : null,
      badgeCount: badges?.incomingTicketsCount || 0,
    },
    {
      name: "Mis Compras",
      shortName: "Compras",
      href: "/account/orders",
      icon: <ShoppingBag size={16} />,
      dotColor:
        (badges?.pendingOrdersCount || 0) > 0
          ? "#f59e0b"
          : (badges?.shippedOrdersCount || 0) > 0
          ? "#a855f7"
          : null,
      badgeCount: (badges?.pendingOrdersCount || 0) + (badges?.shippedOrdersCount || 0),
    },
    {
      name: "Notificaciones",
      shortName: "Avisos",
      href: "/account/notifications",
      icon: <Bell size={16} />,
      dotColor: hasUnreadNotifs ? "#E50914" : null,
      badgeCount: hasUnreadNotifs ? badges?.notificationsCount || 0 : 0,
    },
    {
      name: "Ajustes",
      shortName: "Ajustes",
      href: "/account/settings",
      icon: <Settings size={16} />,
      dotColor: badges?.needsProfileSetup ? "#00F0FF" : null,
      badgeCount: 0,
    },
  ];

  const displayName = profile?.full_name || "Mi Cuenta";

  return (
    <div style={{ minHeight: "85vh", backgroundColor: "var(--color-bg)" }}>
      {/* Compact Account Header (Home Scale) */}
      <div
        className="account-header-band"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "1.25rem 1rem 0",
          background:
            "linear-gradient(to bottom, rgba(229, 9, 20, 0.12) 0%, var(--color-bg) 100%)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          className="container"
          style={{ position: "relative", zIndex: 1, maxWidth: "1120px", margin: "0 auto", padding: 0 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              paddingBottom: "0.9rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
              {/* Compact Avatar */}
              <div
                className="account-avatar-ring"
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  padding: "2px",
                  background: "linear-gradient(135deg, var(--color-magenta), var(--color-accent))",
                  boxShadow: "0 4px 18px rgba(229, 9, 20, 0.25)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: "#18181B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <User size={24} color="white" />
                  )}
                </div>
              </div>

              <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                      color: "var(--color-accent)",
                      display: "block",
                    }}
                  >
                    Cuenta Bassfactory{userMeta?.city ? ` · ${userMeta.city}` : ""}
                  </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.45rem", flexWrap: "wrap" }}>
                  <h1
                    style={{
                      fontSize: "clamp(1.25rem, 2.4vw, 1.65rem)",
                      fontWeight: 800,
                      lineHeight: 1.15,
                      margin: "2px 0 0 0",
                      letterSpacing: "-0.02em",
                      color: "white",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName}
                  </h1>
                  {userMeta?.raver_tag && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-accent)",
                        fontFamily: "monospace",
                      }}
                    >
                      @{String(userMeta.raver_tag).replace(/^@+/, "")}
                    </span>
                  )}
                </div>
                {userEmail && (
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-text-secondary)",
                      marginTop: "1px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userEmail}
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/"
              className="account-back-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "0.42rem 0.8rem",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "var(--color-text-primary)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.75rem",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={14} />
              <span>Inicio</span>
            </Link>
          </div>

          {/* Navigation Tabs: Horizontal row on Desktop, 5-col App Grid on Mobile (zero scroll cutoff!) */}
          <nav className="account-tabs-nav">
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`account-tab-link ${isActive ? "is-active" : ""}`}
                >
                  <div className="account-tab-inner">
                    <span className="tab-icon-wrap">
                      {item.icon}
                      {item.dotColor && (
                        <span
                          className="tab-notif-dot"
                          style={{
                            backgroundColor: item.dotColor,
                            boxShadow: `0 0 6px ${item.dotColor}`,
                          }}
                        />
                      )}
                    </span>
                    <span className="tab-label-desktop">{item.name}</span>
                    <span className="tab-label-mobile">{item.shortName}</span>
                    {item.badgeCount > 0 && (
                      <span
                        className="tab-count-pill"
                        style={{ backgroundColor: item.dotColor || "var(--color-magenta)" }}
                      >
                        {item.badgeCount > 9 ? "9+" : item.badgeCount}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeAccountTab"
                      className="account-tab-indicator"
                      transition={{ type: "spring", stiffness: 320, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <main
        className="container account-main-area"
        style={{ maxWidth: "1120px", margin: "0 auto", padding: "1.25rem 1rem 3rem" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {children}
        </motion.div>
      </main>

      <style jsx>{`
        .account-tabs-nav {
          display: flex;
          gap: 0.25rem;
        }
        :global(.account-tab-link) {
          position: relative;
          text-decoration: none;
        }
        .account-tab-inner {
          padding: 0.65rem 0.95rem;
          color: var(--color-text-secondary);
          font-weight: 500;
          font-size: 0.82rem;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          transition: color 0.2s;
        }
        :global(.account-tab-link.is-active) .account-tab-inner {
          color: var(--color-text-primary);
          font-weight: 700;
        }
        :global(.account-tab-indicator) {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-magenta);
        }
        .tab-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .tab-notif-dot {
          position: absolute;
          top: -3px;
          right: -4px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          border: 1.5px solid #0d0d11;
        }
        .tab-count-pill {
          font-size: 0.62rem;
          font-weight: 800;
          color: #000000;
          padding: 0 5px;
          height: 15px;
          line-height: 15px;
          border-radius: 999px;
        }
        .tab-label-mobile {
          display: none;
        }

        @media (max-width: 640px) {
          .tab-count-pill {
            display: none;
          }
          .account-header-band {
            padding: 0.9rem 0.75rem 0 !important;
          }
          :global(.account-main-area) {
            padding: 1rem 0.75rem 2.5rem !important;
          }
          .account-tabs-nav {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 4px;
            padding-bottom: 0.5rem;
          }
          .account-tab-inner {
            flex-direction: column;
            justify-content: center;
            gap: 3px;
            padding: 0.45rem 0.2rem;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.66rem;
          }
          :global(.account-tab-link.is-active) .account-tab-inner {
            background: rgba(229, 9, 20, 0.14);
            border-color: rgba(229, 9, 20, 0.45);
            color: #ffffff;
          }
          :global(.account-tab-indicator) {
            display: none;
          }
          .tab-label-desktop {
            display: none;
          }
          .tab-label-mobile {
            display: block;
            line-height: 1;
          }
        }
      `}</style>
    </div>
  );
}
