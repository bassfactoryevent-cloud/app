import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

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
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.4rem", color: "#ffffff", letterSpacing: "-0.02em" }}>
          Únete a Bassfactory
        </h1>
        <p style={{ opacity: 0.7, fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
          Crea tu cuenta para comprar tickets y merch exclusivo.
        </p>
      </div>

      <RegisterForm initialMessage={message} />

      <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.85rem", opacity: 0.85, color: "rgba(255, 255, 255, 0.7)" }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" style={{ color: "var(--color-magenta, #D90416)", fontWeight: 700, textDecoration: "none" }}>
          Inicia sesión aquí
        </Link>
      </div>
    </>
  );
}
