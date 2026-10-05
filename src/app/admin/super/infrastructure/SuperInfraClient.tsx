"use client";

import { useState } from "react";
import { 
  Activity, HardDrive, Cpu, AlertTriangle, ShieldCheck, 
  Settings2, Check, AlertCircle, ExternalLink, Zap, Database, Server, RefreshCw
} from "lucide-react";
import { updateInfraAlerts, InfraStorageData } from "../actions";

interface SuperInfraClientProps {
  initialAlerts: {
    vercel_bandwidth_alert_gb: number;
    supabase_storage_alert_mb: number;
  };
  storageData: InfraStorageData;
  databaseData: {
    tables: { key: string; name: string; count: number }[];
    totalRows: number;
    maxFreeTierDBMB: number;
  };
}

export default function SuperInfraClient({
  initialAlerts,
  storageData,
  databaseData,
}: SuperInfraClientProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const handleSaveAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.set("vercel_bandwidth_alert_gb", alerts.vercel_bandwidth_alert_gb.toString());
      formData.set("supabase_storage_alert_mb", alerts.supabase_storage_alert_mb.toString());

      const res = await updateInfraAlerts(formData);
      if (res?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al actualizar los umbrales de alerta");
    } finally {
      setIsSaving(false);
    }
  };

  // Supabase Storage Status
  const isStorageWarning = storageData.totalMB >= alerts.supabase_storage_alert_mb;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* BANNER INFORMATIVO VIP */}
      <div style={{
        background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(20, 20, 20, 0.8) 100%)",
        border: "1px solid rgba(59, 130, 246, 0.35)",
        borderRadius: "1.25rem",
        padding: "1.5rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#60a5fa"
          }}>
            <Activity size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Monitor de Infraestructura, Cuotas y Protección Anti-Cobro
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              Vigilancia continua de consumo en Vercel (Fast Data Transfer) y Supabase (Storage & Postgres) para evitar tarifas automáticas de $20 USD.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.6rem 1.2rem",
            backgroundColor: showConfig ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            borderRadius: "0.75rem",
            color: "#60a5fa",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.875rem",
            transition: "all 0.2s"
          }}
        >
          <Settings2 size={18} />
          {showConfig ? "Ocultar Umbrales" : "Configurar Umbrales de Alerta"}
        </button>
      </div>

      {/* FORMULARIO EDITABLE DE UMBRALES DE ALERTA */}
      {showConfig && (
        <form 
          onSubmit={handleSaveAlerts}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "1.25rem",
            padding: "1.75rem",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: 0 }}>
                Límites Preventivos de Alarma
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
                Establece el límite donde el sistema encenderá avisos de riesgo antes de que se agote la cuota gratuita de cada proveedor.
              </p>
            </div>
            {saveSuccess && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#22c55e", fontSize: "0.85rem", fontWeight: 700 }}>
                <Check size={18} /> Umbrales guardados con éxito
              </div>
            )}
            {errorMessage && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#ef4444", fontSize: "0.85rem" }}>
                <AlertCircle size={18} /> {errorMessage}
              </div>
            )}
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem"
          }}>
            {/* Vercel Alert */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                Alerta de Ancho de Banda Vercel (GB)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={alerts.vercel_bandwidth_alert_gb}
                  onChange={(e) => setAlerts({ ...alerts, vercel_bandwidth_alert_gb: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.5rem 0.75rem 1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem"
                  }}
                />
                <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                  GB
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                Límite gratuito Vercel Hobby: 100 GB/mes (Recomendado: 80 GB)
              </span>
            </div>

            {/* Supabase Storage Alert */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                Alerta de Almacenamiento Supabase (MB)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  min="100"
                  max="1000"
                  value={alerts.supabase_storage_alert_mb}
                  onChange={(e) => setAlerts({ ...alerts, supabase_storage_alert_mb: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.5rem 0.75rem 1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem"
                  }}
                />
                <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                  MB
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                Límite gratuito Supabase: 1.000 MB (1 GB) (Recomendado: 800 MB)
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                fontWeight: 800,
                fontSize: "0.875rem",
                padding: "0.75rem 1.75rem",
                borderRadius: "0.5rem",
                border: "none",
                cursor: isSaving ? "not-allowed" : "pointer",
                opacity: isSaving ? 0.7 : 1,
                transition: "background 0.2s"
              }}
            >
              {isSaving ? "Guardando..." : "Guardar Umbrales"}
            </button>
          </div>
        </form>
      )}

      {/* SECCIÓN 1: VERCEL & PROTECCIÓN DE FACTURACIÓN ($20 USD) */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.3rem", fontWeight: 800, color: "white", margin: 0 }}>
              <Zap size={24} style={{ color: "#00f0ff" }} />
              Vercel: Estado de Cuota & Protección Anti-Cobro
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
              Proyecto conectado: <strong style={{ color: "white" }}>app</strong> (bassfactory.co) en Plan Hobby (Gratuito).
            </p>
          </div>

          <a
            href="https://vercel.com/bassteam/app/settings/billing"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "rgba(0, 240, 255, 0.1)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              borderRadius: "0.5rem",
              color: "#00f0ff",
              fontSize: "0.8rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Abrir Vercel Billing & Spend <ExternalLink size={14} />
          </a>
        </div>

        {/* TARJETAS DE LÍMITES VERCEL */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem"
        }}>
          {/* Fast Data Transfer */}
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "1rem",
            padding: "1.25rem"
          }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 800 }}>
              Ancho de Banda (Fast Data Transfer)
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", marginTop: "0.3rem" }}>
              0 – 100 GB <span style={{ fontSize: "0.9rem", color: "#22c55e", fontWeight: 700 }}>/ mes (Gratis)</span>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.3rem" }}>
                <span>Umbral de Alerta</span>
                <span style={{ color: "#eab308", fontWeight: 700 }}>{alerts.vercel_bandwidth_alert_gb} GB</span>
              </div>
              <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${alerts.vercel_bandwidth_alert_gb}%`, height: "100%", backgroundColor: "#eab308" }} />
              </div>
            </div>
          </div>

          {/* Serverless Functions */}
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "1rem",
            padding: "1.25rem"
          }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 800 }}>
              Serverless Function Execution
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", marginTop: "0.3rem" }}>
              100 GB-Hrs <span style={{ fontSize: "0.9rem", color: "#22c55e", fontWeight: 700 }}>/ mes (Gratis)</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "0.75rem", margin: 0 }}>
              Caché habilitada en rutas públicas para ejecutar el mínimo de invocaciones posibles.
            </p>
          </div>

          {/* Image Optimization */}
          <div style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "1rem",
            padding: "1.25rem"
          }}>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 800 }}>
              Optimización de Imágenes Vercel
            </div>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", marginTop: "0.3rem" }}>
              1.000 imgs <span style={{ fontSize: "0.9rem", color: "#22c55e", fontWeight: 700 }}>/ mes (Gratis)</span>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: "0.75rem", margin: 0, fontWeight: 600 }}>
              ✓ Banners y afiches se entregan directamente por CDN Supabase, consumiendo 0 de esta cuota.
            </p>
          </div>
        </div>

        {/* ALERTA Y RECOMENDACIÓN TÉCNICA SPEND MANAGEMENT */}
        <div style={{
          backgroundColor: "rgba(234, 179, 8, 0.08)",
          border: "1px solid rgba(234, 179, 8, 0.3)",
          borderRadius: "1rem",
          padding: "1.25rem",
          display: "flex",
          gap: "1rem",
          alignItems: "flex-start"
        }}>
          <AlertTriangle size={24} style={{ color: "#eab308", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 800, color: "#eab308", fontSize: "0.95rem" }}>
              Mecanismo Anti-Cobro de $20 USD Obligatorios (Spend Management)
            </div>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", margin: "0.35rem 0 0.5rem" }}>
              Vercel permite activar la función <strong>&quot;Pause Project&quot;</strong> en caso de alcanzar el límite mensual en lugar de requerir automáticamente una suscripción Pro de $20 USD.
            </p>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div>1. Ingresa al panel de Vercel en <strong>Settings → Billing → Spend Management</strong>.</div>
              <div>2. Configura el umbral de alerta en <strong>{alerts.vercel_bandwidth_alert_gb} GB</strong> de ancho de banda.</div>
              <div>3. Activa la opción de notificación por correo para que recibas un aviso antes de cualquier cobro.</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: SUPABASE STORAGE EN VIVO */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.3rem", fontWeight: 800, color: "white", margin: 0 }}>
              <HardDrive size={24} style={{ color: "#22c55e" }} />
              Supabase Storage: Almacenamiento Real en Vivo
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
              Archivos, fotos de eventos, afiches de DJs, merch y pautas publicitarias almacenadas.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
            <RefreshCw size={14} /> Consultado en tiempo real
          </div>
        </div>

        {/* BARRA DE PROGRESO DE ALMACENAMIENTO TOTAL */}
        <div style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "1rem",
          padding: "1.5rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
                Uso Total de Disco en la Nube
              </div>
              <div style={{ fontSize: "2.2rem", fontWeight: 900, color: isStorageWarning ? "#ef4444" : "#22c55e" }}>
                {storageData.totalMB} MB <span style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>/ {storageData.storageLimitMB} MB (1 GB)</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{
                display: "inline-block",
                padding: "0.35rem 0.85rem",
                borderRadius: "9999px",
                fontWeight: 800,
                fontSize: "0.85rem",
                backgroundColor: isStorageWarning ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                color: isStorageWarning ? "#ef4444" : "#22c55e"
              }}>
                {storageData.usagePercent}% en uso ({storageData.totalFiles} archivos)
              </span>
            </div>
          </div>

          <div style={{ height: "12px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "6px", overflow: "hidden", position: "relative" }}>
            <div 
              style={{ 
                width: `${Math.min(storageData.usagePercent, 100)}%`, 
                height: "100%", 
                backgroundColor: isStorageWarning ? "#ef4444" : "#22c55e",
                borderRadius: "6px",
                transition: "width 0.4s ease"
              }} 
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", marginTop: "0.5rem" }}>
            <span>0 MB</span>
            <span>Alerta fijada: {alerts.supabase_storage_alert_mb} MB</span>
            <span>1,000 MB (Límite Gratuito)</span>
          </div>
        </div>

        {/* DESGLOSE POR BUCKET */}
        <div>
          <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", marginBottom: "0.75rem" }}>
            Desglose de Almacenamiento por Bucket
          </h4>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem"
          }}>
            {storageData.buckets.map((b) => (
              <div 
                key={b.name}
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                  borderRadius: "0.75rem",
                  padding: "1rem"
                }}
              >
                <div style={{ fontSize: "0.8rem", color: "#00f0ff", fontWeight: 800, textTransform: "capitalize" }}>
                  {b.name}
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "white", marginTop: "0.2rem" }}>
                  {b.sizeMB} MB
                </div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
                  {b.filesCount} {b.filesCount === 1 ? "archivo" : "archivos"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: BASE DE DATOS POSTGRES */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem"
      }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "1.3rem", fontWeight: 800, color: "white", margin: 0 }}>
            <Database size={24} style={{ color: "#a855f7" }} />
            Base de Datos PostgreSQL (Supabase)
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
            Capacidad del plan gratuito: <strong style={{ color: "white" }}>500 MB</strong> de base de datos relacional. Registros activos por módulo.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem"
        }}>
          {databaseData.tables.map((t) => (
            <div 
              key={t.key}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                borderRadius: "0.75rem",
                padding: "1rem"
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
                {t.name}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", marginTop: "0.25rem" }}>
                {t.count}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#22c55e", marginTop: "0.2rem" }}>
                Activos en tabla
              </div>
            </div>
          ))}

          <div style={{
            backgroundColor: "rgba(168, 85, 247, 0.08)",
            border: "1px solid rgba(168, 85, 247, 0.25)",
            borderRadius: "0.75rem",
            padding: "1rem"
          }}>
            <div style={{ fontSize: "0.75rem", color: "#a855f7", fontWeight: 800 }}>
              Total Registros Indexados
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff", marginTop: "0.25rem" }}>
              {databaseData.totalRows}
            </div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", marginTop: "0.2rem" }}>
              &lt; 5 MB estimados / 500 MB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
