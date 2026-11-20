import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import CartIcon from "@/components/CartIcon";
import { createClient, getCachedUser } from "@/utils/supabase/server";
import UserMenu from "./UserMenu";
import { MobileBottomNav } from "./MobileBottomNav";
import MobileNavDrawer from "./MobileNavDrawer";
import RaverPassDrawer from "./RaverPassDrawer";
import { getUserTicketsData } from "@/utils/userTickets";
import { getUserNotifications } from "@/utils/notifications";

export default async function Header() {
  const [supabase, user] = await Promise.all([createClient(), getCachedUser()]);

  let profile = null;
  let ticketsData = null;
  let notifications: any[] = [];

  if (user) {
    const [profileRes, tData] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      getUserTicketsData({ id: user.id, email: user.email }),
    ]);
    profile = profileRes.data;
    ticketsData = tData;
    notifications = await getUserNotifications({
      id: user.id,
      email: user.email,
      role: profile?.role,
    });
  }

  return (
    <header className={styles.headerWrapper}>
      {/* Top Banner - Hidden for Desktop App aesthetic */}
      {/* 
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
      */}

      {/* Main Glassmorphism Header */}
      <div className={styles.mainHeader}>
        <div className={styles.headerInner}>
          <div className={styles.logoContainer} style={{ gap: "0.5rem" }}>
            <MobileNavDrawer isLoggedIn={Boolean(user)} />
            <Link href="/" className={styles.logoLink}>
              <Image
                src="/Bass-Factory-Blanco-Sin-Letras.png"
                alt="Bassfactory Logo"
                width={150}
                height={50}
                style={{ objectFit: "contain", width: "140px", height: "auto" }}
                className={styles.logoImage}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            <Link href="/" className={styles.navLink}>Inicio</Link>
            <Link href="/events" className={styles.navLink}>Eventos</Link>
            <Link href="/djs" className={styles.navLink}>DJs & Booking</Link>
            <Link href="/merch" className={styles.navLink}>Merch</Link>
            <Link href="/blog" className={styles.navLink}>Cultura</Link>
            {user && (
              <Link href="/account" className={`${styles.navLink} ${styles.navLinkAccount}`}>
                Mi Cuenta
              </Link>
            )}
          </nav>

          <div className={styles.actionsGroup}>
            {user && ticketsData && (
              <RaverPassDrawer
                ticketsData={ticketsData}
                notifications={notifications}
              />
            )}

            <CartIcon />
            
            {user ? (
              <UserMenu 
                userEmail={user.email || ''} 
                userName={profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'} 
                avatarUrl={profile?.avatar_url}
                userRole={user.user_metadata?.role === 'scanner' ? 'scanner' : (profile?.role || user.user_metadata?.role)}
              />
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        isLoggedIn={Boolean(user)}
        ticketsCount={ticketsData?.tickets?.length || 0}
        incomingCount={ticketsData?.incomingTransfers?.length || 0}
      />
    </header>
  );
}
