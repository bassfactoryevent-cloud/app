"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, QrCode, ShieldCheck, Sparkles, Lock } from "lucide-react";
import styles from "./AuthLayout.module.css";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isRegister = pathname?.startsWith("/register");

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If user came from an internal page on bassfactory.co, go back smoothly; otherwise go to "/"
    if (
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host) &&
      !document.referrer.includes("/login") &&
      !document.referrer.includes("/register")
    ) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <div className={styles.authViewport}>
      <div className={styles.ambientBg} />
      <div className={styles.ambientGrid} />

      {/* Top Sticky Bar - Clear escape hatch on Mobile & Desktop */}
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.backGroup}>
            <Link href="/" onClick={handleBack} className={styles.backButton}>
              <ArrowLeft size={16} />
              <span>Volver al inicio</span>
            </Link>
          </div>

          <nav className={styles.topBarNav}>
            <Link href="/events" className={styles.topNavLink}>
              Eventos
            </Link>
            <Link href="/store" className={styles.topNavLink}>
              Merch
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Split / Glass Stage */}
      <main className={styles.mainStage}>
        <div className={styles.stageContainer}>
          {/* Left Showcase Panel (Desktop) */}
          <aside className={styles.showcasePanel}>
            <div className={styles.showcaseBgImage} />
            <div className={styles.showcaseOverlay} />

            <div className={styles.showcaseTop}>
              <div className={styles.liveBadge}>
                <span className={styles.liveDot} />
                <span>Plataforma Oficial</span>
              </div>

              <h2 className={styles.showcaseHeadline}>
                El Ecosistema de la
                <span className={styles.showcaseHeadlineAccent}>
                  Cultura Underground.
                </span>
              </h2>

              <p className={styles.showcaseSubtext}>
                Gestiona tus entradas digitales, transfiere tickets a tus amigos de forma segura y accede a lanzamientos oficiales de Bassfactory.
              </p>
            </div>

            <div className={styles.featureList}>
              <div className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <QrCode size={18} />
                </div>
                <div>
                  <h3 className={styles.featureTextTitle}>Boletería QR Antifraude</h3>
                  <p className={styles.featureTextDesc}>
                    Tus entradas se activan en tu bóveda digital y llegan directo a tu correo.
                  </p>
                </div>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className={styles.featureTextTitle}>Transferencia Instantánea</h3>
                  <p className={styles.featureTextDesc}>
                    Envía entradas a otros asistentes con regeneración segura de código QR.
                  </p>
                </div>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconWrap}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className={styles.featureTextTitle}>Merch & Drops Oficiales</h3>
                  <p className={styles.featureTextDesc}>
                    Compra prendas de edición limitada y sigue el estado de tus pedidos.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Form Panel (Mobile & Desktop) */}
          <section className={styles.formPanel}>
            <div className={styles.formInner}>
              {/* Original Bassfactory Emblem Medallion */}
              <div className={styles.brandHeader}>
                <Link href="/" className={styles.logoMedallionLink} title="Ir al inicio de Bassfactory">
                  <div className={styles.logoCore}>
                    <Image
                      src="/Bass-Factory-Blanco-Sin-Letras.png"
                      alt="Bassfactory Emblem"
                      width={96}
                      height={72}
                      className={styles.logoEmblemImg}
                      priority
                    />
                    <span className={styles.logoCoreAccentBar} />
                  </div>
                  <div className={styles.brandWordmarkWrap}>
                    <span className={styles.brandWordmark}>BASSFACTORY</span>
                    <span className={styles.brandSubTag}>Official Access Pass</span>
                  </div>
                </Link>
              </div>

              {/* Segmented Mode Switcher */}
              <div className={styles.modeTabs} role="tablist" aria-label="Modo de acceso">
                <Link
                  href="/login"
                  role="tab"
                  aria-selected={!isRegister}
                  className={`${styles.modeTab} ${!isRegister ? styles.modeTabActive : ""}`}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  role="tab"
                  aria-selected={isRegister}
                  className={`${styles.modeTab} ${isRegister ? styles.modeTabActive : ""}`}
                >
                  Crear Cuenta
                </Link>
              </div>

              {/* Dynamic Form Content */}
              {children}

              {/* Security Footer */}
              <div className={styles.securityFooter}>
                <Lock size={13} style={{ color: "#D90416", flexShrink: 0 }} />
                <span>Conexión segura encriptada • Boletería Oficial Bassfactory</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className={styles.pageFooter}>
        © {new Date().getFullYear()} Bassfactory. Todos los derechos reservados.
      </footer>
    </div>
  );
}
