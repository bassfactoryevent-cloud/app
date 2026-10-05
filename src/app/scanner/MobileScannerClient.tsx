"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  ScanLine, CheckCircle2, XCircle, AlertTriangle, 
  Camera, LogOut, RefreshCw, Volume2, VolumeX, ShieldCheck, 
  FlipHorizontal, Zap, ZapOff, Users, Clock, ArrowRight, UserCheck
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { signOut } from "../(auth)/actions";

interface RecentScanItem {
  id: string;
  attendee_name: string;
  tier_name: string;
  scanned_at: string;
}

interface AssignedEvent {
  id: string;
  title: string;
  cover_image: string | null;
  location_name: string;
  start_date: string;
  total_capacity: number;
  scanned_count: number;
  my_scanned_count: number;
  my_recent_scans: RecentScanItem[];
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
    attendee_name?: string;
    tier_name?: string;
    scanned_time?: string;
  }>({ status: "idle", message: "" });
  
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Contadores globales e individuales
  const [scannedCounts, setScannedCounts] = useState<{ [id: string]: number }>(
    Object.fromEntries(events.map(e => [e.id, e.scanned_count]))
  );
  const [myScannedCounts, setMyScannedCounts] = useState<{ [id: string]: number }>(
    Object.fromEntries(events.map(e => [e.id, e.my_scanned_count]))
  );
  const [recentScansMap, setRecentScansMap] = useState<{ [id: string]: RecentScanItem[] }>(
    Object.fromEntries(events.map(e => [e.id, e.my_recent_scans || []]))
  );

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const activeEvent = events.find(e => e.id === selectedEventId) || events[0];

  const totalCapacity = activeEvent?.total_capacity || 0;
  const currentTotalScanned = scannedCounts[selectedEventId] || 0;
  const currentMyScanned = myScannedCounts[selectedEventId] || 0;
  const pendingToEnter = Math.max(0, totalCapacity - currentTotalScanned);
  const occupancyPercentage = totalCapacity > 0 ? Math.min(100, Math.round((currentTotalScanned / totalCapacity) * 100)) : 0;
  const myRecentScans = recentScansMap[selectedEventId] || [];

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

            setScanResult({ status: "scanning", message: "Verificando entrada en taquilla..." });

            try {
              const res = await fetch("/api/tickets/scan", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qr_hash: decodedText, event_id: selectedEventId })
              });

              const data = await res.json();

              if (res.ok && data.success) {
                playFeedback(true);
                const scanTime = data.scanned_time || new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                
                setScanResult({
                  status: "success",
                  message: "¡BIENVENIDO A BASSFACTORY!",
                  details: "Acceso Concedido • Verificado en taquilla",
                  attendee_name: data.attendee_name || "Asistente Oficial",
                  tier_name: data.tier_name || "Localidad Oficial",
                  scanned_time: scanTime
                });

                // Actualizar contadores en vivo
                setScannedCounts(prev => ({
                  ...prev,
                  [selectedEventId]: (prev[selectedEventId] || 0) + 1
                }));
                setMyScannedCounts(prev => ({
                  ...prev,
                  [selectedEventId]: (prev[selectedEventId] || 0) + 1
                }));

                // Agregar al historial de este miembro de staff en la puerta
                setRecentScansMap(prev => ({
                  ...prev,
                  [selectedEventId]: [
                    {
                      id: data.ticket_id || Math.random().toString(),
                      attendee_name: data.attendee_name || "Asistente Oficial",
                      tier_name: data.tier_name || "Localidad Oficial",
                      scanned_at: data.scanned_at || new Date().toISOString()
                    },
                    ...(prev[selectedEventId] || [])
                  ].slice(0, 20)
                }));

              } else {
                playFeedback(false);
                setScanResult({
                  status: "error",
                  message: data.error || "ENTRADA INVÁLIDA",
                  details: "No autorizar el ingreso a la sala"
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

            // Esperar 3.5 segundos para que lean la bienvenida y permitir el siguiente escaneo
            setTimeout(() => {
              if (isMounted) {
                setScanResult({ status: "idle", message: "" });
                isProcessingRef.current = false;
              }
            }, 3500);
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
      maxWidth: "500px",
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#050508",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "1rem 1rem 3.5rem"
    }}>
      {/* BARRA SUPERIOR BRANDING BASSFACTORY */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "1rem",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        marginBottom: "1.25rem"
      }}>
        {/* LOGO CORPORATIVO */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Image
            src="/bassfactorylogo1.png"
            alt="Bass Factory Logo"
            width={125}
            height={38}
            style={{ objectFit: "contain" }}
            priority
          />
          <span style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.12)",
            border: "1px solid rgba(6, 182, 212, 0.3)",
            padding: "0.2rem 0.55rem",
            borderRadius: "999px",
            letterSpacing: "0.04em",
            textTransform: "uppercase"
          }}>
            🚪 Puerta
          </span>
        </div>

        {/* ACCIONES SUPERIORES */}
        <div style={{ display: "flex", gap: "0.45rem", alignItems: "center" }}>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Silenciar confirmación" : "Activar sonido"}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.5rem",
              padding: "0.45rem 0.65rem",
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
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              borderRadius: "0.5rem",
              padding: "0.45rem 0.75rem",
              color: "#ef4444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.78rem",
              fontWeight: 800
            }}
          >
            <LogOut size={15} /> Salir
          </button>
        </div>
      </div>

      {/* CREDENCIAL DEL PERSONAL DE PUERTA */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.75rem 1rem",
        backgroundColor: "rgba(6, 182, 212, 0.06)",
        border: "1px solid rgba(6, 182, 212, 0.2)",
        borderRadius: "0.75rem",
        marginBottom: "1.25rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
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
            fontSize: "0.9rem"
          }}>
            {user.full_name ? user.full_name[0].toUpperCase() : "P"}
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 800, color: "white" }}>
              {user.full_name || "Personal de Puerta"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
              {user.email || "Staff Oficial de Taquilla"}
            </div>
          </div>
        </div>

        <span style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.7rem",
          fontWeight: 800,
          color: "#22c55e",
          backgroundColor: "rgba(34, 197, 94, 0.15)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          padding: "0.2rem 0.55rem",
          borderRadius: "999px",
          textTransform: "uppercase"
        }}>
          <span style={{ width: "6px", height: "6px", backgroundColor: "#22c55e", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px #22c55e" }} />
          Turno Activo
        </span>
      </div>

      {/* SELECTOR SI TIENE MÚLTIPLES EVENTOS */}
      {events.length > 1 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>
            Cambiar evento asignado:
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

      {/* TARJETA DEL EVENTO (AFICHE OFICIAL) */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        marginBottom: "1.25rem"
      }}>
        {/* Foto del Flyer del Evento */}
        <div style={{ position: "relative", width: "100%", height: "230px", backgroundColor: "#111" }}>
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
            background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)"
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
              📍 Puerta Oficial Asignada
            </span>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 900, color: "white", margin: 0, lineHeight: 1.2 }}>
              {activeEvent.title}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", marginTop: "0.3rem" }}>
              {activeEvent.location_name || "Locación oficial"}
            </div>
          </div>
        </div>

        {/* TABLERO DE CONTEO Y AFORO ("CUÁNTAS PERSONAS DEBEN ENTRAR Y LAS QUE VA DEJANDO ENTRAR") */}
        <div style={{
          padding: "1.25rem",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)"
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
            {/* KPI 1: Personas que deben entrar / Aforo Total */}
            <div style={{
              padding: "0.85rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 800 }}>
                🎯 Deben Entrar (Aforo)
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "white", marginTop: "0.2rem" }}>
                {totalCapacity > 0 ? totalCapacity : "Libre"}
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem" }}>
                Capacidad esperada
              </div>
            </div>

            {/* KPI 2: Total Ingresados en Sala */}
            <div style={{
              padding: "0.85rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.25)"
            }}>
              <div style={{ fontSize: "0.68rem", color: "#22c55e", textTransform: "uppercase", fontWeight: 800 }}>
                🚪 Total en Sala
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#22c55e", marginTop: "0.2rem" }}>
                {currentTotalScanned}{" "}
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                  / {totalCapacity > 0 ? totalCapacity : "∞"}
                </span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "#22c55e", marginTop: "0.2rem", fontWeight: 700 }}>
                {occupancyPercentage}% aforo ocupado
              </div>
            </div>
          </div>

          {/* KPI 3: Dejadas entrar por mí (Registro Personal del Staff) */}
          <div style={{
            padding: "0.85rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(6, 182, 212, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#06b6d4", textTransform: "uppercase", fontWeight: 800 }}>
                🟢 Dejadas Entrar Por Mí (Mi Turno)
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "white", marginTop: "0.15rem" }}>
                {currentMyScanned} personas
              </div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)" }}>
                Validadas con tu usuario en taquilla
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 700 }}>
                Faltan por llegar
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b" }}>
                {pendingToEnter}
              </div>
            </div>
          </div>

          {/* Barra de Progreso de Aforo */}
          {totalCapacity > 0 && (
            <div style={{ marginTop: "0.85rem" }}>
              <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  backgroundColor: occupancyPercentage >= 95 ? "#ef4444" : "#22c55e",
                  width: `${occupancyPercentage}%`,
                  transition: "width 0.3s ease",
                  boxShadow: "0 0 8px rgba(34, 197, 94, 0.5)"
                }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTÓN PRINCIPAL: ABRIR ESCÁNER QR */}
      {!isScannerOpen ? (
        <button
          onClick={() => setIsScannerOpen(true)}
          style={{
            width: "100%",
            padding: "1.1rem",
            borderRadius: "1rem",
            backgroundColor: "var(--color-magenta, #ec4899)",
            color: "white",
            border: "none",
            fontWeight: 900,
            fontSize: "1.1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            boxShadow: "0 10px 25px rgba(236, 72, 153, 0.4)",
            transition: "all 0.2s ease",
            marginBottom: "1.5rem"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.95"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          <Camera size={24} />
          ABRIR ESCÁNER DE BOLETAS
        </button>
      ) : (
        /* VISOR DE LA CÁMARA ESCÁNER */
        <div style={{
          backgroundColor: "#111",
          borderRadius: "1.25rem",
          overflow: "hidden",
          border: "2px solid var(--color-magenta)",
          position: "relative",
          marginBottom: "1.5rem",
          boxShadow: "0 10px 30px rgba(0,0,0,0.8)"
        }}>
          {/* Header del Escáner */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            padding: "0.75rem 1rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                width: "8px", height: "8px", backgroundColor: "#22c55e",
                borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #22c55e"
              }} />
              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "white" }}>
                CÁMARA ACTIVA
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              {hasTorch && (
                <button
                  onClick={handleToggleTorch}
                  style={{
                    background: isTorchOn ? "#f59e0b" : "rgba(0,0,0,0.6)",
                    color: isTorchOn ? "#000" : "#fff",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "0.5rem",
                    padding: "0.4rem 0.6rem",
                    cursor: "pointer"
                  }}
                >
                  {isTorchOn ? <Zap size={16} /> : <ZapOff size={16} />}
                </button>
              )}

              <button
                onClick={handleToggleCamera}
                title="Cambiar de cámara"
                style={{
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.6rem",
                  cursor: "pointer"
                }}
              >
                <FlipHorizontal size={16} />
              </button>

              <button
                onClick={handleCloseScanner}
                style={{
                  background: "rgba(239, 68, 68, 0.8)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  padding: "0.4rem 0.8rem",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Contenedor del video html5-qrcode */}
          <div id="mobile-qr-reader" style={{ width: "100%", minHeight: "340px", backgroundColor: "#000" }} />

          {/* Mira de enfoque láser */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "220px",
            height: "220px",
            border: "2px dashed rgba(236, 72, 153, 0.7)",
            borderRadius: "1.25rem",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 25px rgba(236, 72, 153, 0.2)"
          }}>
            <div style={{
              width: "100%",
              height: "2px",
              backgroundColor: "rgba(236, 72, 153, 0.8)",
              boxShadow: "0 0 8px #ec4899"
            }} />
          </div>

          {/* Modal / Toast de resultado de escaneo en vivo */}
          {scanResult.status !== "idle" && (
            <div style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "1.25rem",
              backgroundColor: scanResult.status === "success" 
                ? "rgba(10, 40, 20, 0.95)" 
                : scanResult.status === "error" 
                ? "rgba(50, 10, 10, 0.95)" 
                : "rgba(0,0,0,0.9)",
              borderTop: `3px solid ${
                scanResult.status === "success" ? "#22c55e" : scanResult.status === "error" ? "#ef4444" : "#3b82f6"
              }`,
              zIndex: 20,
              backdropFilter: "blur(8px)"
            }}>
              {scanResult.status === "scanning" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#60a5fa" }}>
                  <RefreshCw size={22} className="animate-spin" />
                  <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{scanResult.message}</span>
                </div>
              )}

              {scanResult.status === "success" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#22c55e", marginBottom: "0.3rem" }}>
                    <CheckCircle2 size={24} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{scanResult.message}</span>
                  </div>

                  <div style={{ fontSize: "1.25rem", fontWeight: 900, color: "white", marginTop: "0.25rem" }}>
                    {scanResult.attendee_name}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.35rem", flexWrap: "wrap" }}>
                    <span style={{
                      backgroundColor: "rgba(34, 197, 94, 0.2)",
                      color: "#22c55e",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontWeight: 800
                    }}>
                      🟢 ACTIVO EN EL EVENTO
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.78rem", fontWeight: 700 }}>
                      Localidad: {scanResult.tier_name}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
                      Hora: {scanResult.scanned_time}
                    </span>
                  </div>
                </div>
              )}

              {scanResult.status === "error" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444", marginBottom: "0.3rem" }}>
                    <XCircle size={24} />
                    <span style={{ fontSize: "1.1rem", fontWeight: 900 }}>{scanResult.message}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginTop: "0.2rem" }}>
                    {scanResult.details}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN: REGISTRO EN VIVO DE INGRESOS EN MI PUERTA ("LAS QUE VA DEJANDO ENTRAR") */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1rem",
        overflow: "hidden"
      }}>
        <div style={{
          padding: "1rem 1.25rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={18} color="#06b6d4" />
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "white" }}>
              Mis Ingresos Registrados en Puerta
            </h3>
          </div>
          <span style={{
            fontSize: "0.75rem",
            fontWeight: 800,
            color: "#06b6d4",
            backgroundColor: "rgba(6, 182, 212, 0.12)",
            padding: "0.2rem 0.5rem",
            borderRadius: "999px"
          }}>
            {currentMyScanned} validados
          </span>
        </div>

        <div style={{ maxHeight: "260px", overflowY: "auto" }}>
          {myRecentScans.length === 0 ? (
            <div style={{
              padding: "2rem 1.5rem",
              textAlign: "center",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.85rem"
            }}>
              Aún no has registrado ingresos en este turno.
              <br />
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "0.3rem", display: "inline-block" }}>
                Abre el escáner y lee el código QR de un asistente para dejarlo entrar.
              </span>
            </div>
          ) : (
            myRecentScans.map((scan, idx) => (
              <div
                key={scan.id || idx}
                style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: idx === 0 ? "rgba(34, 197, 94, 0.04)" : "transparent"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "white" }}>
                    {scan.attendee_name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                    <span style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "#06b6d4",
                      backgroundColor: "rgba(6, 182, 212, 0.12)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px"
                    }}>
                      {scan.tier_name}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                      {new Date(scan.scanned_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#22c55e",
                  backgroundColor: "rgba(34, 197, 94, 0.12)",
                  padding: "0.25rem 0.5rem",
                  borderRadius: "999px"
                }}>
                  <CheckCircle2 size={12} /> INGRESÓ
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
