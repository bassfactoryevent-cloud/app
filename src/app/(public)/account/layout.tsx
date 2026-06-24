"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Ticket, ShoppingBag, Bell, Settings, LogOut } from "lucide-react";
import { signOut } from "../../(auth)/actions";
import { motion } from "framer-motion";

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
    <div className="container" style={{ display: 'flex', gap: '2rem', padding: '2rem 1rem', minHeight: '85vh', marginTop: '2rem' }}>
      
      {/* Vanguard Sidebar */}
      <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Profile Card */}
        <div className="glass-panel" style={{ padding: '2rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle glow background inside card */}
          <div style={{ position: 'absolute', top: '-50%', left: '-50%', right: '-50%', bottom: '-50%', background: 'radial-gradient(circle, var(--color-magenta-glow) 0%, transparent 60%)', opacity: 0.3, zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1, width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-magenta), var(--color-accent))', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, boxShadow: '0 8px 32px var(--color-magenta-glow)' }}>
            <User size={40} color="white" />
          </div>
          <h2 style={{ position: 'relative', zIndex: 1, fontSize: '1.5rem', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Mi Cuenta</h2>
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.name} href={item.href} style={{ position: 'relative', display: 'block', textDecoration: 'none' }}>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    style={{ position: 'absolute', inset: 0, borderRadius: '8px', background: 'var(--color-surface-hover)', border: '1px solid var(--glass-border)', zIndex: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', color: isActive ? 'var(--color-white)' : 'var(--color-text-secondary)', fontWeight: isActive ? 600 : 500, transition: 'color 0.2s' }}>
                  <div style={{ color: isActive ? 'var(--color-accent)' : 'inherit' }}>
                    {item.icon}
                  </div>
                  {item.name}
                </div>
              </Link>
            );
          })}
          
          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '1rem 0' }} />

          <button 
            onClick={() => signOut()}
            style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 16px', backgroundColor: 'transparent', color: '#ff4d4d', border: 'none', cursor: 'pointer', fontWeight: 500, textAlign: 'left', width: '100%', borderRadius: '8px', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 77, 77, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* Dynamic Content Area */}
      <main className="glass-panel" style={{ flex: 1, padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Soft background illumination for content area */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '400px', height: '400px', background: 'radial-gradient(circle, var(--color-magenta-glow) 0%, transparent 70%)', opacity: 0.15, transform: 'translate(30%, -30%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
