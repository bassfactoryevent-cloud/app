"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  DollarSign, Ticket, ShoppingBag, TrendingUp, Calendar, 
  Search, ArrowUpRight, CheckCircle2, Filter, Layers, Package
} from "lucide-react";

interface FinancesClientProps {
  totalRevenue: number;
  ticketRevenue: number;
  merchRevenue: number;
  totalTransactions: number;
  eventStats: any[];
  productStats: any[];
  transactions: any[];
}

export default function FinancesClient({
  totalRevenue,
  ticketRevenue,
  merchRevenue,
  totalTransactions,
  eventStats,
  productStats,
  transactions,
}: FinancesClientProps) {
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "products">("events");

  const formatCOP = (val: number) => `$${val.toLocaleString("es-CO")}`;

  const filteredTransactions = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      tx.id.toLowerCase().includes(term) ||
      (tx.customer_name && tx.customer_name.toLowerCase().includes(term)) ||
      (tx.customer_email && tx.customer_email.toLowerCase().includes(term)) ||
      (tx.description && tx.description.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (txTypeFilter === "ticket") return tx.type === "ticket";
    if (txTypeFilter === "merch") return tx.type === "merch";

    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* 1. KPI CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1.25rem"
      }}>
        {/* Total Consolidado */}
        <div style={{
          backgroundColor: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#22c55e", fontSize: "0.825rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <DollarSign size={20} /> Ingresos Totales Consolidados
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "white" }}>
            {formatCOP(totalRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "0.4rem" }}>
            Boletería + Tienda Merch
          </div>
        </div>

        {/* Boletería */}
        <div style={{
          backgroundColor: "rgba(0, 240, 255, 0.08)",
          border: "1px solid rgba(0, 240, 255, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-accent, #00f0ff)", fontSize: "0.825rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <Ticket size={20} /> Recaudo Boletería (Eventos)
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "white" }}>
            {formatCOP(ticketRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "0.4rem" }}>
            {totalRevenue > 0 ? `${Math.round((ticketRevenue / totalRevenue) * 100)}% del total` : "0%"}
          </div>
        </div>

        {/* Merch */}
        <div style={{
          backgroundColor: "rgba(236, 72, 153, 0.08)",
          border: "1px solid rgba(236, 72, 153, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ec4899", fontSize: "0.825rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <ShoppingBag size={20} /> Ventas Tienda (Merch)
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "white" }}>
            {formatCOP(merchRevenue)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "0.4rem" }}>
            {totalRevenue > 0 ? `${Math.round((merchRevenue / totalRevenue) * 100)}% del total` : "0%"}
          </div>
        </div>

        {/* Transacciones */}
        <div style={{
          backgroundColor: "rgba(168, 85, 247, 0.08)",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          borderRadius: "1.25rem",
          padding: "1.5rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#a855f7", fontSize: "0.825rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
            <TrendingUp size={20} /> Transacciones Aprobadas
          </div>
          <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "white" }}>
            {totalTransactions}
          </div>
          <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginTop: "0.4rem" }}>
            Órdenes pagadas en Bold
          </div>
        </div>
      </div>

      {/* 2. REVENUE BREAKDOWN BY EVENT / PRODUCT (TABS) */}
      <div style={{
        backgroundColor: "rgba(18, 18, 24, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "white", margin: 0 }}>
              Rendimiento por Canal Comercial
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
              Analiza la recaudación independiente de cada evento o artículo físico.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", backgroundColor: "rgba(255,255,255,0.04)", padding: "4px", borderRadius: "999px" }}>
            <button
              onClick={() => setActiveTab("events")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: activeTab === "events" ? "var(--color-magenta)" : "transparent",
                color: activeTab === "events" ? "white" : "rgba(255,255,255,0.7)"
              }}
            >
              Eventos ({eventStats.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "999px",
                border: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                backgroundColor: activeTab === "products" ? "var(--color-magenta)" : "transparent",
                color: activeTab === "products" ? "white" : "rgba(255,255,255,0.7)"
              }}
            >
              Productos Merch ({productStats.length})
            </button>
          </div>
        </div>

        {/* Events Table */}
        {activeTab === "events" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>Evento</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Fecha</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Boletas Vendidas</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Aforo Escaneado</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Recaudo Total</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {eventStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                      No hay eventos registrados.
                    </td>
                  </tr>
                ) : (
                  eventStats.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {ev.cover_image ? (
                            <img src={ev.cover_image} alt={ev.title} style={{ width: "40px", height: "40px", borderRadius: "0.4rem", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "40px", height: "40px", borderRadius: "0.4rem", backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Calendar size={18} />
                            </div>
                          )}
                          <div>
                            <strong style={{ color: "white", display: "block", fontSize: "0.9rem" }}>{ev.title}</strong>
                            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{ev.location_name || "Lugar por confirmar"}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                        {ev.start_date ? new Date(ev.start_date).toLocaleDateString("es-CO") : "Por confirmar"}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: "white" }}>
                        {ev.ticketsSold}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", color: "var(--color-accent, #00f0ff)", fontWeight: 700 }}>
                        {ev.scannedCount} <span style={{ fontSize: "0.75rem", opacity: 0.6, color: "var(--color-text-secondary)" }}>/ {ev.totalCapacity > 0 ? ev.totalCapacity : ev.ticketsSold}</span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, color: ev.totalRevenue > 0 ? "#22c55e" : "rgba(255,255,255,0.4)", fontSize: "1rem", fontFamily: "monospace" }}>
                        {formatCOP(ev.totalRevenue)}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <Link
                          href={`/admin/events/${ev.id}/dashboard`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "0.4rem 0.75rem",
                            borderRadius: "0.4rem",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          Ver Ventas <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Products Table */}
        {activeTab === "products" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>Producto</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Categoría</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Unidades Vendidas</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Ingresos Generados</th>
                </tr>
              </thead>
              <tbody>
                {productStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                      No hay compras de productos registradas aún.
                    </td>
                  </tr>
                ) : (
                  productStats.map((prod, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "36px", height: "36px", borderRadius: "0.4rem", backgroundColor: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={18} style={{ color: "var(--color-magenta)" }} />
                          </div>
                          <strong style={{ color: "white", fontSize: "0.9rem" }}>{prod.name}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                        {prod.category || "General"}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 700, color: "white" }}>
                        {prod.unitsSold}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, color: "#22c55e", fontSize: "1rem", fontFamily: "monospace" }}>
                        {formatCOP(prod.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. MASTER TRANSACTIONS AUDIT BOOK */}
      <div style={{
        backgroundColor: "rgba(18, 18, 24, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "white", margin: 0 }}>
              Libro Maestro de Transacciones Globales
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
              Auditoría unificada de todas las compras de boletería y mercancía.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                placeholder="Buscar cliente, orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.55rem 0.75rem 0.55rem 2.2rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "white",
                  fontSize: "0.8rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Type Filter */}
            <div style={{ display: "flex", gap: "0.35rem" }}>
              {[
                { id: "all", label: "Todas" },
                { id: "ticket", label: "Boletería" },
                { id: "merch", label: "Merch" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setTxTypeFilter(pill.id)}
                  style={{
                    padding: "0.5rem 0.85rem",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: txTypeFilter === pill.id ? "var(--color-magenta)" : "rgba(255,255,255,0.06)",
                    color: txTypeFilter === pill.id ? "white" : "rgba(255,255,255,0.7)"
                  }}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", fontSize: "0.8rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.85rem 1rem" }}>Referencia</th>
                <th style={{ padding: "0.85rem 1rem" }}>Tipo</th>
                <th style={{ padding: "0.85rem 1rem" }}>Concepto / Detalle</th>
                <th style={{ padding: "0.85rem 1rem" }}>Cliente</th>
                <th style={{ padding: "0.85rem 1rem" }}>Fecha</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Monto</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No se encontraron transacciones.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "1rem", fontFamily: "monospace", fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
                      #{tx.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "0.25rem 0.55rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: tx.type === "ticket" ? "rgba(0, 240, 255, 0.12)" : "rgba(236, 72, 153, 0.12)",
                        color: tx.type === "ticket" ? "var(--color-accent, #00f0ff)" : "#ec4899"
                      }}>
                        {tx.type === "ticket" ? <Ticket size={12} /> : <ShoppingBag size={12} />}
                        {tx.type === "ticket" ? "Boletería" : "Merch"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "white", fontWeight: 600 }}>
                      {tx.description}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ color: "white", fontWeight: 600, fontSize: "0.85rem" }}>{tx.customer_name}</div>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>{tx.customer_email}</div>
                    </td>
                    <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      {new Date(tx.created_at).toLocaleString("es-CO")}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, color: "white", fontSize: "0.95rem", fontFamily: "monospace" }}>
                      {formatCOP(Number(tx.total_amount || 0))}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span style={{
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        backgroundColor: tx.status === "paid" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: tx.status === "paid" ? "#22c55e" : "#f59e0b",
                        border: `1px solid ${tx.status === "paid" ? "rgba(34, 197, 94, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                      }}>
                        {tx.status?.toUpperCase()}
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
