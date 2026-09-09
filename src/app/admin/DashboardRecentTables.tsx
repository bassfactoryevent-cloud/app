"use client";

import Link from "next/link";
import { Ticket, ShoppingBag, ArrowUpRight, CheckCircle2, Clock, Truck } from "lucide-react";

interface RecentTicket {
  id: string;
  eventTitle: string;
  eventId: string;
  tierName: string;
  price: number;
  buyerName: string;
  buyerEmail: string;
  status: string;
  createdAt: string;
}

interface RecentMerchOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  city: string;
  itemsSummary: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface DashboardRecentTablesProps {
  recentTickets: RecentTicket[];
  recentMerchOrders: RecentMerchOrder[];
}

export default function DashboardRecentTables({
  recentTickets,
  recentMerchOrders,
}: DashboardRecentTablesProps) {
  const formatCOP = (val: number) => `$${val.toLocaleString("es-CO")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", marginTop: "2.5rem" }}>
      {/* SECTION 1: TICKETS RECIENTES */}
      <div style={{
        backgroundColor: "rgba(18, 18, 24, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        <div style={{
          padding: "1.5rem 1.75rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Ticket size={20} style={{ color: "var(--color-accent, #00f0ff)" }} />
              Últimas Boletas Vendidas (Boletería)
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.825rem", margin: "4px 0 0 0" }}>
              Monitoreo en tiempo real de accesos y entradas emitidas. Haz clic en una fila para ir al evento.
            </p>
          </div>

          <Link
            href="/admin/finances"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--color-accent, #00f0ff)",
              fontSize: "0.825rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Ver todas en Finanzas <ArrowUpRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--color-text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.85rem 1.25rem" }}>Evento</th>
                <th style={{ padding: "0.85rem 1.25rem" }}>Localidad</th>
                <th style={{ padding: "0.85rem 1.25rem" }}>Comprador / Asistente</th>
                <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Precio</th>
                <th style={{ padding: "0.85rem 1.25rem" }}>Fecha</th>
                <th style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>Estado</th>
                <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                    No hay compras de boletas registradas aún.
                  </td>
                </tr>
              ) : (
                recentTickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <strong style={{ color: "white", fontSize: "0.9rem" }}>{t.eventTitle}</strong>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <span style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: "rgba(0, 240, 255, 0.1)",
                        color: "var(--color-accent, #00f0ff)"
                      }}>
                        {t.tierName}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ color: "white", fontWeight: 600, fontSize: "0.875rem" }}>{t.buyerName}</div>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>{t.buyerEmail}</div>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right", fontWeight: 800, color: "white", fontFamily: "monospace" }}>
                      {formatCOP(t.price)}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
                      {new Date(t.createdAt).toLocaleDateString("es-CO")}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor: "rgba(34, 197, 94, 0.15)",
                        color: "#22c55e"
                      }}>
                        <CheckCircle2 size={12} /> {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <Link
                        href={`/admin/events/${t.eventId}/dashboard`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "0.4rem 0.75rem",
                          borderRadius: "0.4rem",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "white",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textDecoration: "none"
                        }}
                      >
                        Ver Evento <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: PEDIDOS DE MERCH RECIENTES */}
      <div style={{
        backgroundColor: "rgba(18, 18, 24, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        <div style={{
          padding: "1.5rem 1.75rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <ShoppingBag size={20} style={{ color: "#ec4899" }} />
              Últimos Pedidos de Tienda (Merchandise)
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.825rem", margin: "4px 0 0 0" }}>
              Pedidos físicos de ropa y accesorios. Haz clic en gestionar para actualizar guías y estados.
            </p>
          </div>

          <Link
            href="/admin/merch/orders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#ec4899",
              fontSize: "0.825rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            Ver todos los pedidos <ArrowUpRight size={14} />
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "var(--color-text-secondary)", fontSize: "0.78rem", textTransform: "uppercase" }}>
                <th style={{ padding: "0.85rem 1.25rem" }}>Pedido ID</th>
                <th style={{ padding: "0.85rem 1.25rem" }}>Cliente</th>
                <th style={{ padding: "0.85rem 1.25rem" }}>Artículos</th>
                <th style={{ padding: "0.85rem 1.25rem" }}>Ciudad Destino</th>
                <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Total</th>
                <th style={{ padding: "0.85rem 1.25rem", textAlign: "center" }}>Estado</th>
                <th style={{ padding: "0.85rem 1.25rem", textAlign: "right" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {recentMerchOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
                    No hay pedidos de tienda registrados aún.
                  </td>
                </tr>
              ) : (
                recentMerchOrders.map((o) => (
                  <tr key={o.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "1rem 1.25rem", fontFamily: "monospace", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: "1rem 1.25rem" }}>
                      <div style={{ color: "white", fontWeight: 600, fontSize: "0.875rem" }}>{o.customerName}</div>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>{o.customerEmail}</div>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", fontSize: "0.85rem", color: "white" }}>
                      {o.itemsSummary}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                      {o.city}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right", fontWeight: 800, color: "white", fontFamily: "monospace" }}>
                      {formatCOP(o.totalAmount)}
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        backgroundColor: o.status === "shipped" ? "rgba(59, 130, 246, 0.15)" : o.status === "delivered" ? "rgba(34, 197, 94, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: o.status === "shipped" ? "#3b82f6" : o.status === "delivered" ? "#22c55e" : "#f59e0b"
                      }}>
                        {o.status === "shipped" ? <Truck size={12} /> : o.status === "delivered" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {o.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <Link
                        href="/admin/merch/orders"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "0.4rem 0.75rem",
                          borderRadius: "0.4rem",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "white",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          textDecoration: "none"
                        }}
                      >
                        Gestionar <ArrowUpRight size={13} />
                      </Link>
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
