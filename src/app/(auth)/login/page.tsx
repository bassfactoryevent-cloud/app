import Link from "next/link";
import { LoginForm } from "./LoginForm";
import styles from "../AuthLayout.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams?.message;

  return (
    <>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Bienvenido de vuelta</h1>
        <p className={styles.formSubtitle}>
          Ingresa tus credenciales para acceder a tus tickets QR y pedidos.
        </p>
      </div>

      <LoginForm initialMessage={message} />

      <div
        style={{
          marginTop: "1.4rem",
          textAlign: "center",
          fontSize: "0.84rem",
          color: "rgba(255, 255, 255, 0.65)",
        }}
      >
        ¿Aún no tienes una cuenta?{" "}
        <Link
          href="/register"
          style={{
            color: "#D90416",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Crear cuenta gratis →
        </Link>
      </div>
    </>
  );
}
