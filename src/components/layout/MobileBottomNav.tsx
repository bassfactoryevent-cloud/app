"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Headphones, ShoppingBag, BookOpen, QrCode, User } from "lucide-react";
import styles from "./Header.module.css";

interface MobileBottomNavProps {
  isLoggedIn?: boolean;
  ticketsCount?: number;
  incomingCount?: number;
}

export function MobileBottomNav({
  isLoggedIn = false,
  ticketsCount = 0,
  incomingCount = 0,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  if (!isLoggedIn) {
    const guestItems = [
      { href: "/events", label: "Eventos", icon: Calendar },
      { href: "/djs", label: "Booking", icon: Headphones },
      { href: "/merch", label: "Merch", icon: ShoppingBag },
      { href: "/blog", label: "Cultura", icon: BookOpen },
    ];

    return (
      <nav className={styles.mobileBottomNav}>
        {guestItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.bottomNavItem} ${isActive ? styles.active : ""}`}
            >
              <Icon size={22} />
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  const isTicketsActive = pathname?.startsWith("/account/tickets");
  const isAccountActive =
    pathname === "/account" ||
    pathname?.startsWith("/account/orders") ||
    pathname?.startsWith("/account/notifications") ||
    pathname?.startsWith("/account/settings");

  return (
    <nav className={styles.mobileBottomNav}>
      <Link
        href="/"
        className={`${styles.bottomNavItem} ${pathname === "/" ? styles.active : ""}`}
      >
        <Home size={20} />
        <span className={styles.bottomNavLabel}>Inicio</span>
      </Link>

      <Link
        href="/events"
        className={`${styles.bottomNavItem} ${pathname?.startsWith("/events") ? styles.active : ""}`}
      >
        <Calendar size={20} />
        <span className={styles.bottomNavLabel}>Eventos</span>
      </Link>

      {/* Center Primary Action: Direct access to Tickets / QR */}
      <Link
        href="/account/tickets"
        className={`${styles.bottomNavPass} ${isTicketsActive ? styles.activePass : ""}`}
      >
        <div className={styles.bottomNavPassCircle}>
          <QrCode size={20} />
          {(incomingCount > 0 || ticketsCount > 0) && (
            <span
              className={styles.bottomNavPassBadge}
              style={{
                backgroundColor: incomingCount > 0 ? "#00F0FF" : "#FFFFFF",
                color: "#000000",
              }}
            >
              {incomingCount > 0 ? incomingCount : ticketsCount}
            </span>
          )}
        </div>
        <span className={styles.bottomNavPassLabel}>Mis Tickets</span>
      </Link>

      <Link
        href="/merch"
        className={`${styles.bottomNavItem} ${pathname?.startsWith("/merch") ? styles.active : ""}`}
      >
        <ShoppingBag size={20} />
        <span className={styles.bottomNavLabel}>Merch</span>
      </Link>

      <Link
        href="/account"
        className={`${styles.bottomNavItem} ${isAccountActive ? styles.active : ""}`}
      >
        <User size={20} />
        <span className={styles.bottomNavLabel}>Cuenta</span>
      </Link>
    </nav>
  );
}
