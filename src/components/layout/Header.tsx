import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import CartIcon from "@/components/CartIcon";
import { createClient } from "@/utils/supabase/server";
import UserMenu from "./UserMenu";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className={styles.headerWrapper}>
      {/* Top Header */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderLeft}>
          <span>¿Eres DJ o Promotor? Únete a la red B2B.</span>
        </div>
        <div className={styles.topHeaderRight}>
          <Link href="/support" className={styles.topLink}>
            Soporte
          </Link>
          <span>|</span>
          <Link href="/contact" className={styles.topLink}>
            Contacto
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className={styles.mainHeader} style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)', borderBottom: '1px solid var(--glass-border)', zIndex: 50 }}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image
              src="/bassfactorylogo1.png"
              alt="Bassfactory Logo"
              width={180}
              height={45}
              style={{ objectFit: "contain" }}
              priority
            />
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/events" className={styles.navLink}>
            Eventos
          </Link>
          <Link href="/djs" className={styles.navLink}>
            DJs & Booking
          </Link>
          <Link href="/merch" className={styles.navLink}>
            Merch
          </Link>
          <Link href="/blog" className={styles.navLink}>
            Cultura (Blog)
          </Link>
        </nav>

        <div className={styles.actions} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <CartIcon />
          
          {user ? (
            <UserMenu 
              userEmail={user.email || ''} 
              userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'} 
            />
          ) : (
            <Link href="/login" className="btn btn-primary" style={{ height: '40px' }}>
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
