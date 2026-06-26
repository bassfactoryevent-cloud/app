import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";
import logo from "../../../public/bassfactorylogo1.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footerWrapper}>
      <div className={styles.footerContainer}>
        {/* Sección de Marca */}
        <div className={styles.brandSection}>
          <Link href="/">
            <Image
              src="/Bass-Factory-Blanco-Sin-Letras.png"
              alt="Bassfactory Logo"
              width={160}
              height={53}
              style={{ objectFit: "contain", height: "auto", maxHeight: "53px" }}
              className={styles.logoImage}
            />
          </Link>
          <p className={styles.brandDescription}>
            El ecosistema definitivo B2B y B2C para la cultura de la música electrónica.
            Conectando artistas, promotores y fans en un solo lugar.
          </p>
        </div>

        {/* Sección Links: Explorar */}
        <div className={styles.linksSection}>
          <h4 className={styles.linksTitle}>Explorar</h4>
          <Link href="/events" className={styles.footerLink}>Eventos</Link>
          <Link href="/djs" className={styles.footerLink}>DJs & Booking</Link>
          <Link href="/merch" className={styles.footerLink}>Merchandising</Link>
          <Link href="/blog" className={styles.footerLink}>Cultura (Blog)</Link>
        </div>

        {/* Sección Links: Plataforma */}
        <div className={styles.linksSection}>
          <h4 className={styles.linksTitle}>Plataforma</h4>
          <Link href="/login" className={styles.footerLink}>Iniciar Sesión</Link>
          <Link href="/register" className={styles.footerLink}>Crear Cuenta</Link>
          <Link href="/support" className={styles.footerLink}>Centro de Soporte</Link>
          <Link href="/contact" className={styles.footerLink}>Contacto</Link>
        </div>

        {/* Sección Links: Legal */}
        <div className={styles.linksSection}>
          <h4 className={styles.linksTitle}>Legal</h4>
          <Link href="/terms" className={styles.footerLink}>Términos y Condiciones</Link>
          <Link href="/privacy" className={styles.footerLink}>Políticas de Privacidad</Link>
          <Link href="/refunds" className={styles.footerLink}>Políticas de Reembolso</Link>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <span>&copy; {currentYear} Bassfactory. Todos los derechos reservados.</span>
        
        <div className={styles.socialLinks}>
          <a href="https://instagram.com/bassfactory" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a href="https://twitter.com/bassfactory" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
          </a>
          <a href="https://youtube.com/bassfactory" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="YouTube">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
              <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
