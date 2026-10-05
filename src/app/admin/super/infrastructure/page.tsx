import { checkSuperAdmin, getStorageMetrics, getDatabaseMetrics } from "../actions";
import { getPlatformSettings } from "../../settings/actions";
import SuperInfraClient from "./SuperInfraClient";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuperInfrastructurePage() {
  await checkSuperAdmin();

  const [settings, storageData, databaseData] = await Promise.all([
    getPlatformSettings(),
    getStorageMetrics(),
    getDatabaseMetrics(),
  ]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "2.25rem", fontWeight: 900, color: "white", fontFamily: "Outfit, sans-serif", margin: 0 }}>
          <Activity size={32} style={{ color: "#3b82f6" }} />
          Consumo de Infraestructura & Alertas de Facturación
        </h1>
        <p style={{ opacity: 0.7, fontSize: "1rem", color: "var(--color-text-secondary)", marginTop: "0.35rem" }}>
          Monitoreo en vivo de cuotas gratuitas en Vercel y Supabase. Control estricto para evitar cobros de $20 USD y cortes no planificados.
        </p>
      </div>

      <SuperInfraClient
        initialAlerts={{
          vercel_bandwidth_alert_gb: Number(settings.vercel_bandwidth_alert_gb) || 80,
          supabase_storage_alert_mb: Number(settings.supabase_storage_alert_mb) || 800,
        }}
        storageData={storageData}
        databaseData={databaseData}
      />
    </div>
  );
}
