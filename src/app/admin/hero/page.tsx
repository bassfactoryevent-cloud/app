import { getHeroSettings } from "./actions";
import HeroForm from "./HeroForm";
import { MonitorPlay } from "lucide-react";

export const metadata = {
  title: "Banner Principal | Bassfactory Admin",
};

export default async function HeroSettingsPage() {
  const settings = await getHeroSettings();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MonitorPlay size={28} /> 
            Banner Principal (Hero)
          </h1>
          <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>
            Administra el contenido principal que los usuarios ven al entrar al inicio de la página.
          </p>
        </div>
      </div>

      <HeroForm initialData={settings} />
    </div>
  );
}
