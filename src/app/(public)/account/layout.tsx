"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Ticket, ShoppingBag, Bell, Settings, LogOut } from "lucide-react";
import { signOut } from "../../(auth)/actions";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Resumen", href: "/account", icon: <User size={20} />, exact: true },
    { name: "Mis Tickets", href: "/account/tickets", icon: <Ticket size={20} /> },
    { name: "Mis Compras", href: "/account/orders", icon: <ShoppingBag size={20} /> },
    { name: "Notificaciones", href: "/account/notifications", icon: <Bell size={20} /> },
    { name: "Ajustes", href: "/account/settings", icon: <Settings size={20} /> },
  ];

  return (
    <div style={{ minHeight: '85vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Hero Header */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '4rem 1rem 0rem', background: 'linear-gradient(to bottom, rgba(229, 9, 20, 0.15) 0%, var(--color-bg) 100%)' }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', paddingBottom: '2rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-magenta), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, boxShadow: '0 8px 32px rgba(229, 9, 20, 0.3)' }}>
              <User size={60} color="white" />
            </div>
            <div style={{ flex: 1, paddingBottom: '0.5rem', minWidth: '200px' }}>
              <p style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, opacity: 0.7, marginBottom: '0.25rem' }}>Perfil de Usuario</p>
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1, margin: 0, letterSpacing: '-0.03em' }}>Mi Cuenta</h1>
            </div>
            
            <button 
              onClick={() => signOut()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', borderRadius: '99px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', fontSize: '0.875rem', marginBottom: '0.5rem' }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.5)'; e.currentTarget.style.color = '#ff4d4d'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>

          {/* Navigation Tabs */}
          <nav style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0', borderBottom: '1px solid var(--color-border)', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {navItems.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link key={item.name} href={item.href} style={{ position: 'relative', textDecoration: 'none' }}>
                  <div style={{ padding: '0.75rem 1.25rem', color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: isActive ? 600 : 500, transition: 'color 0.2s', fontSize: '0.875rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.icon}
                    {item.name}
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeAccountTab"
                      style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: '2px', background: 'var(--color-magenta)' }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <main className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
