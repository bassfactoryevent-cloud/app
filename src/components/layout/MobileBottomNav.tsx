"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Headphones, ShoppingBag, BookOpen } from "lucide-react";
import styles from "./Header.module.css";

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/events", label: "Eventos", icon: Calendar },
    { href: "/djs", label: "Booking", icon: Headphones },
    { href: "/merch", label: "Merch", icon: ShoppingBag },
    { href: "/blog", label: "Cultura", icon: BookOpen },
  ];

  return (
    <nav className={styles.mobileBottomNav}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname?.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.bottomNavItem} ${isActive ? styles.active : ""}`}
          >
            <Icon size={24} />
            <span className={styles.bottomNavLabel}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
