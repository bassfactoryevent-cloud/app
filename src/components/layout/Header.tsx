import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import CartIcon from "@/components/CartIcon";
import { createClient } from "@/utils/supabase/server";
import UserMenu from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className={styles.headerWrapper}>
      {/* Top Banner (Optional for promos or B2B switch) */}
      <div className={styles.topHeader}>
        <div className={styles.topHeaderLeft}>
          <span>¿Eres DJ o Promotor? Únete a la red B2B.</span>
        </div>
        <div className={styles.topHeaderRight}>
          <Link href="/support" className={styles.topLink}>Soporte</Link>
          <span className={styles.topDivider}>|</span>
          <Link href="/contact" className={styles.topLink}>Contacto</Link>
        </div>
      </div>

      {/* Main Glassmorphism Header */}
      <div className={styles.mainHeader}>
        <div className={styles.headerInner}>
          <div className={styles.logoContainer}>
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/Bass-Factory-Blanco-Sin-Letras.png"
                alt="Bassfactory Logo"
                width={200}
                height={65}
                style={{ objectFit: "contain", height: "auto", maxHeight: "65px" }}
                className={styles.logoImage}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            <Link href="/events" className={styles.navLink}>Eventos</Link>
            <Link href="/djs" className={styles.navLink}>DJs & Booking</Link>
            <Link href="/merch" className={styles.navLink}>Merch</Link>
            <Link href="/blog" className={styles.navLink}>Cultura</Link>
          </nav>

          <div className={styles.actionsGroup}>
            <div className={styles.desktopOnly}>
              <ThemeToggle />
            </div>
            
            <CartIcon />
            
            {user ? (
              <UserMenu 
                userEmail={user.email || ''} 
                userName={user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'} 
              />
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                Ingresar
              </Link>
            )}

            {/* Mobile Hamburger Menu */}
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  );
}
