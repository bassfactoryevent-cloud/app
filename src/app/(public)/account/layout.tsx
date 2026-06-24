"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Ticket, ShoppingBag, Bell, Settings, LogOut } from "lucide-react";
import { signOut } from "../../(auth)/actions";

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem', display: 'flex', gap: '2rem', minHeight: '80vh' }}>
      
      {/* Sidebar B2C */}
      <aside style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-magenta)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
            <User size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Mi Cuenta</h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isActive ? 'var(--color-magenta)' : 'transparent',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
          
          <button 
            onClick={() => signOut()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: 'transparent',
              color: '#ef4444',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              marginTop: '1rem',
              textAlign: 'left',
              width: '100%'
            }}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', padding: '2rem' }}>
        {children}
      </main>

    </div>
  );
}
