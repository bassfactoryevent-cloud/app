import styles from "./page.module.css";
import AdBanner from "@/components/AdBanner";

export default function Home() {
  return (
    <div className={styles.hero}>
      <main className={styles.heroContent}>
        <h1 className={styles.title}>
          Bienvenido a <span style={{ color: "var(--color-magenta)" }}>Bassfactory</span>
        </h1>
        <p className={styles.subtitle}>
          El ecosistema B2B y B2C definitivo para la cultura de la música electrónica. Descubre eventos, gestiona DJs, compra merchandising y conecta con la comunidad.
        </p>

        <div className={styles.actions}>
          <button className="btn btn-primary">
            Explorar Eventos
          </button>
          <button className="btn btn-secondary">
            Acceso DJs
          </button>
        </div>

        <div style={{ margin: '3rem auto', maxWidth: '800px', width: '100%' }}>
          <AdBanner placementName="home_hero" />
        </div>

        <div className={styles.featuresGrid}>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>🎫</div>
            <h3>Ticketing</h3>
            <p>Compra y gestiona tus entradas digitales con código QR encriptado.</p>
          </div>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>🎧</div>
            <h3>Bookings B2B</h3>
            <p>Descubre presskits dinámicos y contrata al lineup perfecto para tu fiesta.</p>
          </div>
          <div className={`card ${styles.featureCard}`}>
            <div className={styles.featureIcon}>👕</div>
            <h3>Merch Oficial</h3>
            <p>Adquiere la indumentaria oficial de la escena electrónica.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
