import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Welcome to Bassfactory</h1>
        <p>El ecosistema del colectivo de música electrónica.</p>
      </main>
    </div>
  );
}
