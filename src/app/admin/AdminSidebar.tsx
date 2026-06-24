"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, FileText, Calendar, Music, ShoppingCart, Settings, Briefcase, Megaphone, LogOut } from "lucide-react";
import styles from "./AdminLayout.module.css";
import logo from "../../../public/bassfactorylogo1.png";
import { signOut } from "../(auth)/actions";
import { motion } from "framer-motion";

export function AdminSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard B2B", href: "/admin", icon: <LayoutDashboard size={20} /> },
    { name: "Eventos", href: "/admin/events", icon: <Calendar size={20} /> },
    { name: "DJs & Booking", href: "/admin/djs", icon: <Music size={20} /> },
    { name: "Patrocinadores", href: "/admin/sponsors", icon: <Briefcase size={20} /> },
    { name: "Pautas (Ads)", href: "/admin/ads", icon: <Megaphone size={20} /> },
    { name: "Merch", href: "/admin/merch", icon: <ShoppingCart size={20} /> },
    { name: "Blog", href: "/admin/blog", icon: <FileText size={20} /> },
    { name: "Ajustes", href: "/admin/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div className={styles.adminWrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar} style={{ backgroundColor: 'var(--color-black)' }}>
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
                style={{ position: 'relative' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminActiveTab"
                    style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-hover)', zIndex: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', color: isActive ? 'var(--color-accent)' : 'inherit' }}>
                  {item.icon}
                  <span style={{ color: isActive ? 'var(--color-white)' : 'inherit' }}>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        
        <div style={{ padding: '1.5rem' }}>
          <button 
            onClick={() => signOut()}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', backgroundColor: 'transparent', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontWeight: 500, textAlign: 'left', width: '100%', borderRadius: 'var(--radius-md)', transition: 'background 0.2s', fontSize: '0.875rem' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </div>
  );
}
