"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, Ticket, Users, Activity, ScanLine } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

interface EventDashboardClientProps {
  event: any;
  initialTiers: any[];
  initialOrders: any[];
  initialTickets: any[];
  initialTransfers: any[];
}

export default function EventDashboardClient({ event, initialTiers, initialOrders, initialTickets, initialTransfers }: EventDashboardClientProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState(initialOrders);
  const [tickets, setTickets] = useState(initialTickets);
  const [transfers, setTransfers] = useState(initialTransfers);
  
  // Realtime subscription
  useEffect(() => {
    // Escuchar nuevas órdenes
    const ordersChannel = supabase
      .channel('schema-db-changes-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `event_id=eq.${event.id}`
        },
        (payload) => {
          const newOrder = payload.new;
          if (newOrder.status === 'paid') {
            setOrders((prev) => [newOrder, ...prev]);
            toast.success(`¡Nueva venta! ${newOrder.customer_name} compró boletas.`);
          }
        }
      )
      .subscribe();

    // Escuchar actualizaciones de boletas escaneadas
    const ticketsChannel = supabase
      .channel('schema-db-changes-tickets')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          const updatedTicket = payload.new;
          if (updatedTicket.status === 'scanned') {
            setTickets((prev) => {
              const newTickets = [...prev];
              const idx = newTickets.findIndex(t => t.id === updatedTicket.id);
              if (idx !== -1) {
                newTickets[idx] = updatedTicket;
              } else {
                newTickets.push(updatedTicket);
              }
              return newTickets;
            });
            // Opcional: toast para cuando escanean
            // toast.info("Nueva boleta escaneada en puerta");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, [event.id, supabase]);

  // Derived calculations
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
  const totalTicketsSold = tickets.length;
  // Acepta is_scanned (viejo) o status === 'scanned' (nuevo)
  const totalScanned = tickets.filter(t => t.is_scanned || t.status === 'scanned').length;

  const formatCurrency = (val: number) => `$${val.toLocaleString('es-CO')}`;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/admin/events" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "40px", height: "40px", backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "50%", color: "white", textDecoration: "none", transition: "background-color 0.2s"
        }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <Activity size={24} color="#3b82f6" />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: "white" }}>
            Ventas: {event.title}
          </h1>
        </div>
        <Link href={`/admin/events/${event.id}/scan`} style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          backgroundColor: 'var(--color-magenta)', color: 'white',
          padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
          textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <ScanLine size={18} /> Abrir Escáner
        </Link>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#22c55e", marginBottom: "0.5rem" }}>
            <DollarSign size={20} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Ingresos Totales</h3>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "white" }}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3b82f6", marginBottom: "0.5rem" }}>
            <Ticket size={20} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Boletas Vendidas</h3>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "white" }}>
            {totalTicketsSold}
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ec4899", marginBottom: "0.5rem" }}>
            <ScanLine size={20} />
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Aforo Ingresado (Escaneado)</h3>
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "white" }}>
            {totalScanned} <span style={{ fontSize: "1rem", opacity: 0.5, fontWeight: 500 }}>/ {totalTicketsSold}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", alignItems: "start" }}>
        
        {/* Inventory Control */}
        <div style={{ backgroundColor: "var(--color-surface, #111)", border: "1px solid var(--color-border, #333)", borderRadius: "var(--radius-lg)", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 1.5rem 0", color: "white" }}>
            Inventario por Localidad
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {initialTiers.map(tier => {
              const soldInTier = tickets.filter(t => t.tier_id === tier.id || t.ticket_tier_id === tier.id).length;
              const totalCapacity = tier.quantity_available + soldInTier; // Simple approximation if quantity_available means remaining. If it means total initially, then soldInTier / quantity_available.
              // Let's assume quantity_available is the CURRENT stock. Total stock was quantity_available + soldInTier.
              const percentage = totalCapacity > 0 ? (soldInTier / totalCapacity) * 100 : 0;
              
              return (
                <div key={tier.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 600, color: "white" }}>{tier.name}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{soldInTier} / {totalCapacity} vendidas</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: "100%", 
                      backgroundColor: percentage >= 100 ? "#ef4444" : "#3b82f6",
                      borderRadius: "4px"
                    }} />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", textAlign: "right" }}>
                    Quedan: <span style={{ color: "white", fontWeight: 600 }}>{tier.quantity_available}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Orders Table */}
        <div style={{ backgroundColor: "var(--color-surface, #111)", border: "1px solid var(--color-border, #333)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border, #333)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "white" }}>
              Últimas Compras (Real-Time)
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#22c55e" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "#22c55e", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #22c55e" }}></span>
              Sincronizando
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border, #333)" }}>
                  <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Cliente</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Fecha</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Estado</th>
                  <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem", textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                      Aún no hay ventas para este evento.
                    </td>
                  </tr>
                ) : (
                  orders.map((order, i) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid var(--color-border, #333)", backgroundColor: i === 0 ? "rgba(34, 197, 94, 0.05)" : "transparent" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontWeight: 600, color: "white" }}>{order.customer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{order.customer_email}</div>
                      </td>
                      <td style={{ padding: "1rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span style={{
                          padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600,
                          backgroundColor: order.status === 'paid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: order.status === 'paid' ? '#22c55e' : '#f59e0b', textTransform: "uppercase"
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: 700, color: "white" }}>
                        {formatCurrency(Number(order.total_amount))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transfers Table */}
      <div style={{ marginTop: "2rem", backgroundColor: "var(--color-surface, #111)", border: "1px solid var(--color-border, #333)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border, #333)" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "white" }}>
            Historial de Transferencias (P2P)
          </h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Auditoría de todos los tickets enviados entre usuarios.
          </p>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border, #333)" }}>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Ticket ID</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Enviado a</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Fecha</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No hay transferencias registradas para este evento.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border, #333)" }}>
                    <td style={{ padding: "1rem", fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-text-secondary)" }}>
                      {t.ticket_id.substring(0, 8)}...
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "white" }}>{t.to_name || 'Sin Nombre'}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{t.to_email}</div>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600,
                        backgroundColor: t.status === 'accepted' ? 'rgba(34, 197, 94, 0.2)' : t.status === 'rejected' || t.status === 'cancelled' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                        color: t.status === 'accepted' ? '#22c55e' : t.status === 'rejected' || t.status === 'cancelled' ? '#ef4444' : '#f59e0b', textTransform: "uppercase"
                      }}>
                        {t.status}
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
