"use client";

import { useState } from "react";
import { 
  Coins, Ticket, ShoppingBag, Megaphone, TrendingUp, 
  Settings2, Check, AlertCircle, Search, Filter, ShieldCheck, ArrowUpRight
} from "lucide-react";
import { updateDevRates } from "../actions";

interface SuperRevenueClientProps {
  initialRates: {
    dev_fee_per_ticket: number;
    dev_fee_merch_percent: number;
    dev_fee_ads_percent: number;
  };
  metrics: {
    totalDevRevenue: number;
    devTicketRevenue: number;
    devMerchRevenue: number;
    devAdsRevenue: number;
    totalTicketsSold: number;
    totalMerchVolume: number;
    totalAdsVolume: number;
  };
  transactions: {
    id: string;
    type: "ticket" | "merch" | "ad";
    date: string;
    concept: string;
    customer: string;
    grossAmount: number;
    devShare: number;
    status: string;
    details: string;
  }[];
}

export default function SuperRevenueClient({
  initialRates,
  metrics,
  transactions,
}: SuperRevenueClientProps) {
  const [rates, setRates] = useState(initialRates);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "ticket" | "merch" | "ad">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  const formatCOP = (val: number) => `$${Math.round(val).toLocaleString("es-CO")}`;

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.set("dev_fee_per_ticket", rates.dev_fee_per_ticket.toString());
      formData.set("dev_fee_merch_percent", rates.dev_fee_merch_percent.toString());
      formData.set("dev_fee_ads_percent", rates.dev_fee_ads_percent.toString());

      const res = await updateDevRates(formData);
      if (res?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Error al actualizar las tarifas");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      tx.id.toLowerCase().includes(term) ||
      tx.concept.toLowerCase().includes(term) ||
      tx.customer.toLowerCase().includes(term) ||
      tx.details.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* BANNER VIP SUPER ADMIN */}
      <div style={{
        background: "linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(20, 20, 20, 0.8) 100%)",
        border: "1px solid rgba(234, 179, 8, 0.35)",
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
            backgroundColor: "rgba(234, 179, 8, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#eab308"
          }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", margin: 0 }}>
              Consola Master de Recaudos y Desarrollo
            </h2>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              Acceso exclusivo para <strong style={{ color: "#eab308" }}>admin@admin</strong>. Registro transparente de liquidaciones del desarrollo.
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
            backgroundColor: showConfig ? "rgba(234, 179, 8, 0.2)" : "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(234, 179, 8, 0.4)",
            borderRadius: "0.75rem",
            color: "#eab308",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.875rem",
            transition: "all 0.2s"
          }}
        >
          <Settings2 size={18} />
          {showConfig ? "Ocultar Ajustes de Tarifas" : "Modificar Tarifas / Comisiones"}
        </button>
      </div>

      {/* FORMULARIO EDITABLE DE TARIFAS (ADMINISTRABLE) */}
      {showConfig && (
        <form 
          onSubmit={handleSaveRates}
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
                Estándares de Comisión del Desarrollo
              </h3>
              <p style={{ fontSize: "0.825rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
                Valores dinámicos configurables. Las métricas de recaudos se calcularán según estos parámetros.
              </p>
            </div>
            {saveSuccess && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#22c55e", fontSize: "0.85rem", fontWeight: 700 }}>
                <Check size={18} /> Tarifas guardadas con éxito
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
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem"
          }}>
            {/* Tarifa Boleta */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                Tarifa fija por Boleta Vendida (COP)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  step="100"
                  min="0"
                  value={rates.dev_fee_per_ticket}
                  onChange={(e) => setRates({ ...rates, dev_fee_per_ticket: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem 0.75rem 2.2rem",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem"
                  }}
                />
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                  $
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                Por defecto: $2.000 COP por boleta
              </span>
            </div>

            {/* Comisión Merch */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                Comisión en Ventas de Merch (%)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={rates.dev_fee_merch_percent}
                  onChange={(e) => setRates({ ...rates, dev_fee_merch_percent: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 2rem 0.75rem 1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem"
                  }}
                />
                <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                  %
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                Por defecto: 5% del valor vendido
              </span>
            </div>

            {/* Comisión Pautas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                Comisión en Pautas Publicitarias (%)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={rates.dev_fee_ads_percent}
                  onChange={(e) => setRates({ ...rates, dev_fee_ads_percent: Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "0.75rem 2rem 0.75rem 1rem",
                    backgroundColor: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "1rem"
                  }}
                />
                <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}>
                  %
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                Por defecto: 5% por campaña
              </span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                backgroundColor: "#eab308",
                color: "#000",
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
              {isSaving ? "Guardando..." : "Guardar Nuevas Tarifas"}
            </button>
          </div>
        </form>
      )}

      {/* KPI CARDS: GANANCIAS DEL DESARROLLO */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1.25rem"
      }}>
        {/* GRAN TOTAL DESARROLLO */}
        <div style={{
          background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(20, 20, 20, 0.6) 100%)",
          border: "1px solid rgba(34, 197, 94, 0.4)",
          borderRadius: "1.25rem",
          padding: "1.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#22c55e", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <Coins size={22} /> Gran Total Ganancias Desarrollo
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#22c55e", letterSpacing: "-0.02em" }}>
            {formatCOP(metrics.totalDevRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "0.5rem" }}>
            Total acumulado por boletas + comisiones merch + pautas
          </div>
        </div>

        {/* RECAUDO BOLETERÍA */}
        <div style={{
          backgroundColor: "rgba(0, 240, 255, 0.06)",
          border: "1px solid rgba(0, 240, 255, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#00f0ff", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <Ticket size={22} /> Boletería Vendida ({metrics.totalTicketsSold})
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
            {formatCOP(metrics.devTicketRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "0.5rem" }}>
            {metrics.totalTicketsSold} boletas × {formatCOP(rates.dev_fee_per_ticket)} COP fijados
          </div>
        </div>

        {/* COMISIÓN TIENDA MERCH */}
        <div style={{
          backgroundColor: "rgba(236, 72, 153, 0.06)",
          border: "1px solid rgba(236, 72, 153, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ec4899", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <ShoppingBag size={22} /> Merch ({rates.dev_fee_merch_percent}%)
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
            {formatCOP(metrics.devMerchRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "0.5rem" }}>
            Volumen ventas merch: {formatCOP(metrics.totalMerchVolume)}
          </div>
        </div>

        {/* COMISIÓN PAUTAS */}
        <div style={{
          backgroundColor: "rgba(234, 179, 8, 0.06)",
          border: "1px solid rgba(234, 179, 8, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.75rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#eab308", fontSize: "0.85rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <Megaphone size={22} /> Pautas ({rates.dev_fee_ads_percent}%)
          </div>
          <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "white", letterSpacing: "-0.02em" }}>
            {formatCOP(metrics.devAdsRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)", marginTop: "0.5rem" }}>
            Volumen pautas: {formatCOP(metrics.totalAdsVolume)}
          </div>
        </div>
      </div>

      {/* LIBRO CONTABLE DETALLADO */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        overflow: "hidden"
      }}>
        {/* Cabecera & Filtros */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", margin: 0 }}>
              Libro Maestro de Liquidación del Desarrollo
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
              Desglose operación por operación con la comisión y tarifa correspondiente.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Buscador */}
            <div style={{ position: "relative", minWidth: "220px" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Buscar cliente, evento o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem 0.5rem 2.2rem",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "0.5rem",
                  color: "white",
                  fontSize: "0.85rem"
                }}
              />
            </div>

            {/* Selector Tipo */}
            <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "rgba(0,0,0,0.4)", padding: "0.25rem", borderRadius: "0.5rem" }}>
              {(["all", "ticket", "merch", "ad"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "0.35rem",
                    border: "none",
                    backgroundColor: typeFilter === t ? "#eab308" : "transparent",
                    color: typeFilter === t ? "#000" : "rgba(255,255,255,0.7)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {t === "all" ? "Todos" : t === "ticket" ? "Boletas" : t === "merch" ? "Merch" : "Pautas"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th style={{ padding: "1rem 1.5rem" }}>Tipo</th>
                <th style={{ padding: "1rem 1.5rem" }}>Concepto / Detalle</th>
                <th style={{ padding: "1rem 1.5rem" }}>Cliente</th>
                <th style={{ padding: "1rem 1.5rem" }}>Fecha</th>
                <th style={{ padding: "1rem 1.5rem" }}>Venta Total</th>
                <th style={{ padding: "1rem 1.5rem", color: "#22c55e" }}>Ganancia Desarrollo</th>
                <th style={{ padding: "1rem 1.5rem" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                    No se encontraron transacciones registradas.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr 
                    key={tx.id}
                    style={{ 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: tx.type === "ticket" ? "rgba(0, 240, 255, 0.15)" : tx.type === "merch" ? "rgba(236, 72, 153, 0.15)" : "rgba(234, 179, 8, 0.15)",
                        color: tx.type === "ticket" ? "#00f0ff" : tx.type === "merch" ? "#ec4899" : "#eab308"
                      }}>
                        {tx.type === "ticket" ? <Ticket size={12} /> : tx.type === "merch" ? <ShoppingBag size={12} /> : <Megaphone size={12} />}
                        {tx.type === "ticket" ? "Boleto" : tx.type === "merch" ? "Merch" : "Pauta"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ fontWeight: 700, color: "white" }}>{tx.concept}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "0.15rem" }}>{tx.details}</div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "rgba(255,255,255,0.8)" }}>
                      {tx.customer}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                      {new Date(tx.date).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "white" }}>
                      {formatCOP(tx.grossAmount)}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "0.5rem",
                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e",
                        fontWeight: 900,
                        fontSize: "0.95rem"
                      }}>
                        +{formatCOP(tx.devShare)}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        fontSize: "0.75rem",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        backgroundColor: "rgba(34, 197, 94, 0.1)",
                        color: "#22c55e",
                        fontWeight: 600,
                        textTransform: "uppercase"
                      }}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
