import Link from "next/link";
import {
  Compass,
  Speaker,
  Handshake,
  QrCode,
  Mic2,
  LineChart,
  CheckCircle2,
} from "lucide-react";
import CanvasIcon from "@/components/ui/CanvasIcon";
import ContactForm from "./ContactForm";

export const metadata = {
  title: "Asesoría y Producción de Eventos | Bassfactory",
  description:
    "Consultoría, producción técnica y acompañamiento integral para crear eventos de música electrónica de nivel internacional.",
};

const SERVICES = [
  { icon: Compass, title: "Asesoría & Consultoría", desc: "Viabilidad financiera, concepto, curaduría de lineup, locación, permisos y estrategia de venta por fases." },
  { icon: Speaker, title: "Producción Técnica", desc: "Sonido Line Array calibrado, iluminación DMX, láseres, visuales LED y diseño de escenario." },
  { icon: Handshake, title: "Acompañamiento Integral", desc: "Te acompañamos de la idea al día del evento: cronograma, proveedores, staff y operación en vivo." },
  { icon: QrCode, title: "Boletería QR Bassfactory", desc: "Venta en nuestra plataforma con QR antifraude, transferencias seguras y control de acceso en puerta." },
  { icon: Mic2, title: "Booking de Artistas", desc: "Conexión con DJs nacionales e internacionales, riders técnicos y hospitalidad." },
  { icon: LineChart, title: "Marketing & Difusión", desc: "Exposición en el Home de Bassfactory, contenido editorial, pauta y comunidad de ravers." },
];

const STEPS = [
  { n: "01", t: "Diagnóstico", d: "Llamada inicial para entender tu idea, público y presupuesto." },
  { n: "02", t: "Propuesta", d: "Plan de producción, cronograma y presupuesto detallado." },
  { n: "03", t: "Producción", d: "Ejecutamos contigo montaje, ticketing, booking y difusión." },
  { n: "04", t: "Show & Cierre", d: "Operación en vivo, liquidación y reporte de resultados." },
];

const card: React.CSSProperties = {
  background: "var(--color-surface)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "0.9rem",
};

export default function ProduccionPage() {
  return (
    <div style={{ width: "100%", paddingBottom: "4rem" }}>
      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "3.5rem 1.25rem 2.5rem",
          background:
            "radial-gradient(circle at 15% 20%, rgba(217,4,22,0.22), transparent 55%), linear-gradient(180deg,#0a0a0c,#000)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Link href="/" style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
            ← Volver al inicio
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "1.1rem 0 0.75rem" }}>
            <CanvasIcon variant="laser" size={26} />
            <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", color: "#D90416", textTransform: "uppercase" }}>
              Bassfactory Producción
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.6rem, 3.6vw, 2.6rem)", fontWeight: 900, lineHeight: 1.05, margin: "0 0 0.8rem", textTransform: "uppercase", maxWidth: "760px" }}>
            Creamos contigo eventos de nivel internacional
          </h1>
          <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.72)", maxWidth: "620px", margin: "0 0 1.4rem" }}>
            Asesoría, consultoría y acompañamiento integral para promotores, marcas y colectivos que quieren producir su propio evento de música electrónica.
          </p>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" }}>
            <a href="#contacto" style={{ padding: "0.7rem 1.3rem", borderRadius: "0.55rem", background: "#D90416", color: "#fff", fontWeight: 800, fontSize: "0.82rem", textDecoration: "none" }}>
              Solicitar asesoría
            </a>
            <Link href="/events" style={{ padding: "0.7rem 1.3rem", borderRadius: "0.55rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, fontSize: "0.82rem", textDecoration: "none" }}>
              Ver eventos producidos
            </Link>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2.25rem 1.25rem 0", display: "flex", flexDirection: "column", gap: "2.5rem" }}>
        {/* Services */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 1rem" }}>¿En qué te ayudamos?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "0.85rem" }}>
            {SERVICES.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ ...card, padding: "1.1rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "0.6rem", background: "rgba(217,4,22,0.14)", border: "1px solid rgba(217,4,22,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D90416", marginBottom: "0.7rem" }}>
                  <Icon size={18} />
                </div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0 0 0.3rem" }}>{title}</h3>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.45 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 1rem" }}>Cómo trabajamos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ ...card, padding: "1rem", borderTop: "2px solid #D90416" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 900, color: "#D90416", letterSpacing: "0.1em" }}>{s.n}</span>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 800, margin: "0.25rem 0" }}>{s.t}</h3>
                <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contacto" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", alignItems: "start", scrollMarginTop: "90px" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, margin: "0 0 0.6rem" }}>Hablemos de tu evento</h2>
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.7)", margin: "0 0 1rem" }}>
              Completa el formulario y un productor de Bassfactory te contactará en menos de 48 horas hábiles. La primera sesión de diagnóstico es gratuita.
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.55rem" }}>
              {["Diagnóstico inicial sin costo", "Propuesta y presupuesto a la medida", "Boletería QR integrada en Bassfactory", "Exposición ante nuestra comunidad"].map((t) => (
                <li key={t} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.84rem" }}>
                  <CheckCircle2 size={16} style={{ color: "#D90416", flexShrink: 0 }} /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ ...card, padding: "1.35rem" }}>
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
