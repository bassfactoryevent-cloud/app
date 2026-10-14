import Link from "next/link";
import { LoginForm } from "./LoginForm";

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
      <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.4rem", color: "#ffffff", letterSpacing: "-0.02em" }}>
          Bienvenido de vuelta
        </h1>
        <p style={{ opacity: 0.7, fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)", margin: 0 }}>
          Inicia sesión para gestionar tus tickets, órdenes y panel.
        </p>
      </div>

      <LoginForm initialMessage={message} />

      <div style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.85rem", opacity: 0.85, color: "rgba(255, 255, 255, 0.7)" }}>
        ¿No tienes cuenta?{" "}
        <Link href="/register" style={{ color: "var(--color-magenta, #D90416)", fontWeight: 700, textDecoration: "none" }}>
          Regístrate aquí
        </Link>
      </div>
    </>
  );
}
