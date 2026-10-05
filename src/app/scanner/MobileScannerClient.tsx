"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ScanLine, CheckCircle2, XCircle, AlertTriangle, 
  Camera, LogOut, RefreshCw, Volume2, VolumeX, ShieldCheck, 
  FlipHorizontal, Zap, ZapOff
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
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
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  const [scanResult, setScanResult] = useState<{
    status: "idle" | "scanning" | "success" | "error";
    message: string;
    details?: string;
  }>({ status: "idle", message: "" });
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [scannedCounts, setScannedCounts] = useState<{ [id: string]: number }>(
    Object.fromEntries(events.map(e => [e.id, e.scanned_count]))
  );

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  // Reproducir sonidos y vibración háptica
  const playFeedback = (isSuccess: boolean) => {
    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      if (isSuccess) {
        navigator.vibrate([80, 40, 80]);
      } else {
        navigator.vibrate([250, 80, 250]);
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
        osc.frequency.setValueAtTime(240, ctx.currentTime);
        osc.frequency.setValueAtTime(170, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // AudioContext bloqueado por política del navegador
    }
  };

  // Iniciar la cámara trasera (o frontal si se cambia)
  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!isScannerOpen) return;

      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode("mobile-qr-reader");
        }

        const qrCode = html5QrCodeRef.current;

        if (qrCode.isScanning) {
          await qrCode.stop();
        }

        // Forzar explícitamente cámara trasera ("environment")
        const cameraConfig = { facingMode: cameraFacing };
        const qrConfig = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        await qrCode.start(
          cameraConfig,
          qrConfig,
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            setScanResult({ status: "scanning", message: "Verificando entrada..." });

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
                  details: "Entrada válida • Aforo actualizado"
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

            // Esperar 2.2 segundos y permitir el siguiente escaneo
            setTimeout(() => {
              if (isMounted) {
                setScanResult({ status: "idle", message: "" });
                isProcessingRef.current = false;
              }
            }, 2200);
          },
          () => {
            // Ignorar frames sin código
          }
        );

        // Detectar si la cámara soporta linterna / torch
        try {
          const capabilities = (qrCode as any).getRunningTrackCameraCapabilities?.();
          if (capabilities && capabilities.torchFeature?.().isSupported()) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }

      } catch (err) {
        console.error("Error al iniciar cámara:", err);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [isScannerOpen, cameraFacing, selectedEventId, soundEnabled]);

  const handleCloseScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop().catch(() => {});
    }
    setIsScannerOpen(false);
    setIsTorchOn(false);
    setScanResult({ status: "idle", message: "" });
    isProcessingRef.current = false;
  };

  const handleToggleCamera = () => {
    setCameraFacing(prev => (prev === "environment" ? "user" : "environment"));
  };

  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current) return;
    try {
      const nextTorch = !isTorchOn;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setIsTorchOn(nextTorch);
    } catch (e) {
      console.error("Error toggling torch:", e);
    }
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
              <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>
                / {activeEvent.total_capacity ? `${activeEvent.total_capacity} Asistentes` : "Aforo Libre"}
              </span>
            </div>
            {activeEvent.total_capacity > 0 && (
              <div style={{ marginTop: "0.35rem" }}>
                <div style={{ width: "140px", height: "5px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    backgroundColor: "#22c55e",
                    width: `${Math.min(100, Math.round(((scannedCounts[selectedEventId] || 0) / activeEvent.total_capacity) * 100))}%`,
                    transition: "width 0.3s ease"
                  }} />
                </div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                  {Math.round(((scannedCounts[selectedEventId] || 0) / activeEvent.total_capacity) * 100)}% capacidad
                </div>
              </div>
            )}
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
          ABRIR CÁMARA TRASERA
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Barra de Controles Rápidos de la Cámara */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={handleToggleCamera}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.9rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <FlipHorizontal size={16} />
              {cameraFacing === "environment" ? "Cámara Trasera (Activa)" : "Cámara Frontal"}
            </button>

            {hasTorch && (
              <button
                onClick={handleToggleTorch}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.9rem",
                  borderRadius: "0.5rem",
                  backgroundColor: isTorchOn ? "rgba(234, 179, 8, 0.25)" : "rgba(255, 255, 255, 0.1)",
                  border: isTorchOn ? "1px solid #eab308" : "1px solid rgba(255, 255, 255, 0.2)",
                  color: isTorchOn ? "#eab308" : "white",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {isTorchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                Linterna {isTorchOn ? "ON" : "OFF"}
              </button>
            )}
          </div>

          {/* Visor de Cámara */}
          <div style={{
            position: "relative",
            backgroundColor: "#111",
            borderRadius: "1rem",
            overflow: "hidden",
            border: "2px solid #06b6d4",
            minHeight: "320px"
          }}>
            <div id="mobile-qr-reader" style={{ width: "100%", height: "100%" }} />

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
