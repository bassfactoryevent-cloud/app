"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

interface PaymentStatusPollerProps {
  orderId: string;
}

export default function PaymentStatusPoller({ orderId }: PaymentStatusPollerProps) {
  const router = useRouter();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timer: NodeJS.Timeout;

    // Check status every 2.5 seconds
    interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            clearInterval(interval);
            router.refresh();
          } else if (data.status === "cancelled" || data.status === "fraud_detected") {
            clearInterval(interval);
            router.refresh();
          }
        }
      } catch (err) {
        console.error("Error polling order status:", err);
      }
    }, 2500);

    // Track elapsed time up to 40 seconds
    timer = setInterval(() => {
      setSecondsElapsed((prev) => {
        if (prev >= 35) {
          setIsTimedOut(true);
          clearInterval(interval);
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [orderId, router]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "paid") {
          router.refresh();
          return;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  if (isTimedOut) {
    return (
      <div style={{
        marginTop: "1.5rem",
        padding: "1.25rem",
        backgroundColor: "rgba(245, 158, 11, 0.08)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        borderRadius: "0.85rem",
        textAlign: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#f59e0b", marginBottom: "0.5rem", fontWeight: 700, fontSize: "0.9rem" }}>
          <AlertCircle size={18} />
          <span>Confirmación bancaria en curso</span>
        </div>
        <p style={{ fontSize: "0.825rem", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 1rem 0", lineHeight: 1.5 }}>
          Tu entidad bancaria está procesando la transacción con Bold. Tan pronto el banco apruebe el débito, tus boletas y factura llegarán automáticamente a tu correo.
        </p>
        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "white",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <RefreshCw size={14} className={isChecking ? "animate-spin" : ""} />
          {isChecking ? "Consultando..." : "Verificar de nuevo"}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.6rem",
      padding: "0.6rem 1rem",
      backgroundColor: "rgba(255, 255, 255, 0.04)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "999px",
      fontSize: "0.825rem",
      color: "rgba(255, 255, 255, 0.8)",
      margin: "1rem auto 0 auto"
    }}>
      <Loader2 size={15} className="animate-spin" style={{ color: "var(--color-magenta, #e50914)" }} />
      <span>Confirmando pago con Bold en tiempo real...</span>
    </div>
  );
}
