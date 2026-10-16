import { getHeroSettings, getHeroCatalog } from "./actions";
import HeroForm from "./HeroForm";
import { MonitorPlay, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hero Spotlight Studio | Bassfactory Admin",
};

export default async function HeroSettingsPage() {
  const [settings, catalog] = await Promise.all([
    getHeroSettings(),
    getHeroCatalog(),
  ]);

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.28rem 0.75rem",
              borderRadius: "999px",
              background: "rgba(217, 4, 22, 0.14)",
              border: "1px solid rgba(217, 4, 22, 0.35)",
              color: "#D90416",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "0.6rem",
            }}
          >
            <Sparkles size={13} />
            <span>Hero Spotlight Engine v2</span>
          </div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: 0 }}>
            <MonitorPlay size={28} style={{ color: "#D90416" }} />
            Banner Principal Multi-Slide (Spotlight)
          </h1>
          <p style={{ opacity: 0.7, marginTop: "0.45rem", maxWidth: "680px", fontSize: "0.92rem" }}>
            Configura múltiples slides interactivos en el Home. Conecta en 1 clic tus{" "}
            <strong>Eventos</strong> (con cuenta regresiva en vivo),{" "}
            <strong>Merch Drops</strong>, <strong>Noticias/Posts</strong>,{" "}
            <strong>Pautas Patrocinadas</strong> o <strong>Videos Oficiales</strong>.
          </p>
        </div>
      </div>

      <HeroForm initialData={settings} catalog={catalog} />
    </div>
  );
}
