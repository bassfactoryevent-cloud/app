"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ScanLine, CheckCircle2, XCircle, AlertTriangle, 
  Camera, LogOut, RefreshCw, Volume2, VolumeX, ShieldCheck
} from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import { signOut } from "../(auth)/actions";

interface AssignedEvent {
  id: string;
  title: string;
  cover_image: string | null;
  location_name: string;
  start_date: string;
  total_capacity: number;
  scanned_count: number;
}

interface MobileScannerClientProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  events: AssignedEvent[];
}

export default function MobileScannerClient({ user, events }: MobileScannerClientProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || "");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "scanning" | "success" | "error";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scannedCounts, setScannedCounts] = useState<{ [id: string]: number }>(
    Object.fromEntries(events.map(e => [e.id, e.scanned_count]))
  );

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Reproducir sonidos y vibración
  const playFeedback = (isSuccess: boolean) => {
    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      if (isSuccess) {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate([300, 100, 300]);
      }
    }

    if (!soundEnabled || typeof window === "undefined") return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext no permitido o bloqueado
    }
  };

  useEffect(() => {
    if (isScannerOpen && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        "mobile-qr-reader",
        {
          fps: 12,
          qrbox: { width: 260, height: 260 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          rememberLastUsedCamera: true,
        },
        false
      );

      scanner.render(
        async (decodedText) => {
          if (scanResult.status === "scanning") return;

          setScanResult({ status: "scanning", message: "Verificando entrada..." });
          scanner.pause(true);

          try {
            const res = await fetch("/api/tickets/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ qr_hash: decodedText, event_id: selectedEventId })
            });

            const data = await res.json();

            if (res.ok && data.success) {
              playFeedback(true);
              setScanResult({
                status: "success",
                message: data.message || "¡ACCESO CONCEDIDO!",
                details: "Entrada validada correctamente"
              });
              setScannedCounts(prev => ({
                ...prev,
                [selectedEventId]: (prev[selectedEventId] || 0) + 1
              }));
            } else {
              playFeedback(false);
              setScanResult({
                status: "error",
                message: data.error || "ENTRADA INVÁLIDA",
                details: "No autorizar el ingreso"
              });
            }
          } catch (err: any) {
            playFeedback(false);
            setScanResult({
              status: "error",
              message: "ERROR DE CONEXIÓN",
              details: err.message || "Revisa la señal de internet"
            });
          }

          // Reanudar cámara tras 2.2 segundos para siguiente persona
          setTimeout(() => {
            setScanResult({ status: "idle", message: "" });
            if (scannerRef.current) {
              scannerRef.current.resume();
            }
          }, 2200);
        },
        () => {
          // Ignorar frames sin código
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [isScannerOpen, selectedEventId, soundEnabled]);

  const handleCloseScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setIsScannerOpen(false);
    setScanResult({ status: "idle", message: "" });
  };

  return (
    <div style={{
      maxWidth: "480px",
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#000",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "1rem 1rem 3rem"
    }}>
      {/* BARRA SUPERIOR MÓVIL */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        marginBottom: "1.25rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#06b6d4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
            color: "#000",
            fontSize: "0.85rem"
          }}>
            🚪
          </div>
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "white" }}>
              {user.full_name || "Personal de Puerta"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "#06b6d4", fontWeight: 700, textTransform: "uppercase" }}>
              Control de Accesos Bassfactory
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.4rem 0.6rem",
              color: soundEnabled ? "#22c55e" : "rgba(255,255,255,0.4)",
              cursor: "pointer"
            }}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={() => signOut()}
            title="Cerrar turno / Salir"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "0.5rem",
              padding: "0.4rem 0.6rem",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              fontWeight: 700
            }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </div>

      {/* SELECTOR SI TIENE MÚLTIPLES EVENTOS */}
      {events.length > 1 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
            Evento asignado actual:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setIsScannerOpen(false);
            }}
            style={{
              width: "100%",
              marginTop: "0.25rem",
              padding: "0.6rem 0.75rem",
              backgroundColor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "0.5rem",
              color: "white",
              fontWeight: 700,
              fontSize: "0.85rem"
            }}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* TARJETA DEL EVENTO (FOTO OBLIGATORIA DEL EVENTO ASIGNADO) */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        marginBottom: "1.5rem"
      }}>
        {/* Foto del Flyer del Evento */}
        <div style={{ position: "relative", width: "100%", height: "240px", backgroundColor: "#111" }}>
          {activeEvent.cover_image ? (
            <Image
              src={activeEvent.cover_image}
              alt={activeEvent.title}
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}>
              Sin afiche disponible
            </div>
          )}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)"
          }} />
          <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
            <span style={{
              display: "inline-block",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              backgroundColor: "#06b6d4",
              color: "#000",
              fontWeight: 900,
              fontSize: "0.7rem",
              textTransform: "uppercase",
              marginBottom: "0.4rem"
            }}>
              Turno de Puerta Asignado
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>
              {activeEvent.title}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", marginTop: "0.3rem" }}>
              📍 {activeEvent.location_name || "Locación oficial"}
            </div>
          </div>
        </div>

        {/* Contador de Ingresos / Aforo */}
        <div style={{
          padding: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          borderTop: "1px solid rgba(255, 255, 255, 0.05)"
        }}>
          <div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 700 }}>
              Ingresos Escaneados
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#22c55e" }}>
              {scannedCounts[selectedEventId] || 0}{" "}
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
                / {activeEvent.total_capacity || "Aforo Libre"}
              </span>
            </div>
          </div>

          <div style={{
            padding: "0.4rem 0.8rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            color: "#22c55e",
            fontSize: "0.75rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem"
          }}>
            <ShieldCheck size={16} /> Puerta Autorizada
          </div>
        </div>
      </div>

      {/* ÁREA DE ESCÁNER DE CÁMARA */}
      {!isScannerOpen ? (
        <button
          onClick={() => setIsScannerOpen(true)}
          style={{
            width: "100%",
            padding: "1.25rem",
            backgroundColor: "#22c55e",
            color: "#000",
            border: "none",
            borderRadius: "1rem",
            fontWeight: 900,
            fontSize: "1.1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(34, 197, 94, 0.35)",
            transition: "transform 0.1s"
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <Camera size={26} />
          ABRIR LECTOR DE BOLETAS
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Cámara Render */}
          <div style={{
            position: "relative",
            backgroundColor: "#111",
            borderRadius: "1rem",
            overflow: "hidden",
            border: "2px solid #06b6d4"
          }}>
            <div id="mobile-qr-reader" style={{ width: "100%" }} />

            {/* OVERLAY DE RESULTADO EN PANTALLA GIGANTE */}
            {scanResult.status !== "idle" && (
              <div style={{
                position: "absolute",
                inset: 0,
                backgroundColor: 
                  scanResult.status === "success" ? "rgba(34, 197, 94, 0.95)" :
                  scanResult.status === "error" ? "rgba(239, 68, 68, 0.95)" : "rgba(0, 0, 0, 0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                textAlign: "center",
                zIndex: 20,
                transition: "background-color 0.2s"
              }}>
                {scanResult.status === "success" && <CheckCircle2 size={80} color="#fff" />}
                {scanResult.status === "error" && <XCircle size={80} color="#fff" />}
                {scanResult.status === "scanning" && <RefreshCw size={50} color="#06b6d4" className="animate-spin" />}

                <h2 style={{
                  fontSize: "1.6rem",
                  fontWeight: 900,
                  color: "#fff",
                  marginTop: "1rem",
                  marginBottom: "0.5rem",
                  textTransform: "uppercase"
                }}>
                  {scanResult.message}
                </h2>
                {scanResult.details && (
                  <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.9)", margin: 0, fontWeight: 700 }}>
                    {scanResult.details}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleCloseScanner}
            style={{
              padding: "0.85rem",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "white",
              borderRadius: "0.75rem",
              fontWeight: 800,
              fontSize: "0.95rem",
              cursor: "pointer"
            }}
          >
            Pausar Cámara / Volver
          </button>
        </div>
      )}

      {/* PIE DE PÁGINA INFORMATIVO */}
      <div style={{ marginTop: "auto", paddingTop: "2rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
        Acceso restringido para control de acceso • Bassfactory Cloud
      </div>
    </div>
  );
}
