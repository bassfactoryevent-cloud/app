"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, FileText, Calendar, Music, ShoppingCart, Settings, Briefcase } from "lucide-react";
import styles from "./AdminLayout.module.css";
import logo from "../../../public/bassfactorylogo1.png";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Eventos", href: "/admin/events", icon: <Calendar size={20} /> },
    { name: "DJs & Booking", href: "/admin/djs", icon: <Music size={20} /> },
    { name: "Patrocinadores", href: "/admin/sponsors", icon: <Briefcase size={20} /> },
    { name: "Merch", href: "/admin/merch", icon: <ShoppingCart size={20} /> },
    { name: "Blog", href: "/admin/blog", icon: <FileText size={20} /> },
    { name: "Ajustes", href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className={styles.adminWrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link href="/">
            <Image
              src={logo}
              alt="Bassfactory Logo"
              width={140}
              height={35}
              style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
            />
          </Link>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            Administración B2B
          </div>
          <div>
            {/* Aquí irá el perfil del usuario admin */}
            Admin
          </div>
        </header>
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  );
}
