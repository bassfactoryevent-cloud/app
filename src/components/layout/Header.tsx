import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
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
      <div className={styles.mainHeader}>
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

        <div className={styles.actions}>
          <button className={styles.cartBtn} aria-label="Carrito de compras">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </button>
          <Link href="/login" className={`btn btn-primary ${styles.loginBtn}`}>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
