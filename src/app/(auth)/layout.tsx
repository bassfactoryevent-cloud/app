import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/bassfactorylogo1.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg)', color: 'white' }}>
      <header style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        <Link href="/">
          <Image
            src={logo}
            alt="Bassfactory Logo"
            width={140}
            height={35}
            style={{ objectFit: "contain", filter: "brightness(0) invert(1)" }}
          />
        </Link>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '2.5rem', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}>
          {children}
        </div>
      </main>
      <footer style={{ textAlign: 'center', padding: '2rem', opacity: 0.5, fontSize: '0.875rem' }}>
        © {new Date().getFullYear()} Bassfactory. Todos los derechos reservados.
      </footer>
    </div>
  );
}
