import Link from "next/link";
import { signIn } from "../actions";
import { LogIn } from "lucide-react";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Bienvenido de vuelta</h1>
        <p style={{ opacity: 0.7 }}>Inicia sesión para gestionar tus tickets y órdenes.</p>
      </div>

      {searchParams?.message && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>
          {searchParams.message}
        </div>
      )}

      <form action={signIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Correo Electrónico</label>
          <input
            type="email"
            name="email"
            id="email"
            required
            placeholder="tu@email.com"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
          />
        </div>
        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>Contraseña</label>
          <input
            type="password"
            name="password"
            id="password"
            required
            placeholder="••••••••"
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}
          />
        </div>
        <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '1rem', marginTop: '1rem', backgroundColor: 'var(--color-magenta)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' }}>
          <LogIn size={20} />
          Iniciar Sesión
        </button>
      </form>

      <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', opacity: 0.8 }}>
        ¿No tienes cuenta? <Link href="/register" style={{ color: 'var(--color-magenta)', fontWeight: 600, textDecoration: 'none' }}>Regístrate aquí</Link>
      </div>
    </>
  );
}
