import Link from "next/link";
import { RegisterForm } from "./RegisterForm";
import styles from "../AuthLayout.module.css";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const message = resolvedSearchParams?.message;

  return (
    <>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>Únete a Bassfactory</h1>
        <p className={styles.formSubtitle}>
          Crea tu cuenta oficial para comprar entradas QR y merch exclusivo.
        </p>
      </div>

      <RegisterForm initialMessage={message} />

      <div
        style={{
          marginTop: "1.4rem",
          textAlign: "center",
          fontSize: "0.84rem",
          color: "rgba(255, 255, 255, 0.65)",
        }}
      >
        ¿Ya tienes una cuenta?{" "}
        <Link
          href="/login"
          style={{
            color: "#D90416",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Inicia sesión aquí →
        </Link>
      </div>
    </>
  );
}
