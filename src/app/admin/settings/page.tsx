import { Settings, Wrench } from "lucide-react";

export default function SettingsAdminPage() {
  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={28} /> Ajustes</h1>
        <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Configuración global de la plataforma.</p>
      </div>

      <div style={{ padding: '4rem', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <Wrench size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Página en Construcción</h3>
        <p style={{ opacity: 0.7, marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto' }}>
          La sección de ajustes está lista para ser implementada. Dime qué configuraciones te gustaría administrar desde aquí (Ej: Enlaces de redes sociales, Información de Contacto, Textos del Home, SEO, etc).
        </p>
      </div>
    </div>
  );
}
