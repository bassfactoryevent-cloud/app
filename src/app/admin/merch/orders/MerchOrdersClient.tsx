"use client";

import { useState, useTransition } from "react";
import { 
  Package, Truck, CheckCircle2, Clock, XCircle, Search, 
  DollarSign, ShoppingBag, Send, AlertCircle, Phone, Mail, MapPin
} from "lucide-react";
import { updateOrderStatus, updateOrderTracking } from "./actions";
import { toast } from "sonner";

interface MerchOrdersClientProps {
  initialOrders: any[];
}

export default function MerchOrdersClient({ initialOrders }: MerchOrdersClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  // Calcular métricas exclusivamente de Merch
  const totalRevenue = orders
    .filter(o => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingShipmentCount = orders.filter(o => o.status === "paid" || o.status === "pending" || o.status === "processing").length;
  const shippedCount = orders.filter(o => o.status === "shipped").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const totalOrdersCount = orders.length;

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(term) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(term)) ||
      (order.customer_email && order.customer_email.toLowerCase().includes(term)) ||
      (order.tracking_number && order.tracking_number.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    if (statusFilter === "pending") return order.status === "paid" || order.status === "pending" || order.status === "processing";
    if (statusFilter === "shipped") return order.status === "shipped";
    if (statusFilter === "delivered") return order.status === "delivered";
    if (statusFilter === "cancelled") return order.status === "cancelled";
    return true;
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        toast.success(`Estado del pedido actualizado a: ${newStatus.toUpperCase()}`);
      } else {
        toast.error(res.error || "Error al actualizar estado");
      }
    });
  };

  const handleSaveTracking = (orderId: string) => {
    const tracking = trackingInputs[orderId];
    if (!tracking || !tracking.trim()) {
      toast.error("Por favor ingresa un número de guía válido");
      return;
    }

    startTransition(async () => {
      const res = await updateOrderTracking(orderId, tracking.trim());
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_number: tracking.trim(), status: "shipped" } : o));
        toast.success("Número de guía guardado y pedido marcado como DESPACHADO");
      } else {
        toast.error(res.error || "Error al guardar la guía");
      }
    });
  };

  const formatCOP = (num: number) => `$${num.toLocaleString("es-CO")}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* KPI METRICS BAR */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
        gap: "1.25rem" 
      }}>
        <div style={{ backgroundColor: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#22c55e", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
            <DollarSign size={18} /> Ventas Merch
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "white" }}>
            {formatCOP(totalRevenue)}
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
            <Clock size={18} /> Por Despachar
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "white" }}>
            {pendingShipmentCount}
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3b82f6", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
            <Truck size={18} /> Despachados
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "white" }}>
            {shippedCount}
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.25)", borderRadius: "1rem", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#a855f7", marginBottom: "0.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
            <ShoppingBag size={18} /> Total Pedidos
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "white" }}>
            {totalOrdersCount}
          </div>
        </div>
      </div>

      {/* CONTROLS: SEARCH & FILTER TABS */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        {/* Search */}
        <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
          <input 
            type="text"
            placeholder="Buscar por cliente, correo, guía o #pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.6rem",
              borderRadius: "0.6rem",
              border: "1px solid rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "white",
              fontSize: "0.875rem",
              outline: "none"
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `Todos (${totalOrdersCount})` },
            { id: "pending", label: `Por Despachar (${pendingShipmentCount})` },
            { id: "shipped", label: `Despachados (${shippedCount})` },
            { id: "delivered", label: `Entregados (${deliveredCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: "0.55rem 1rem",
                borderRadius: "999px",
                fontSize: "0.825rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: statusFilter === tab.id ? "var(--color-magenta)" : "rgba(255,255,255,0.06)",
                color: statusFilter === tab.id ? "white" : "rgba(255,255,255,0.7)",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ORDERS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {filteredOrders.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "1rem", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <Package size={48} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>No hay órdenes de mercancía</h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", maxWidth: "450px", margin: "0 auto" }}>
              Las ventas de ropa y productos de la tienda aparecerán en este panel. Las compras de boletería están aisladas para no interferir con la logística de envíos.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const shortId = order.id.slice(0, 8).toUpperCase();
            const items = order.merch_order_items || [];

            return (
              <div 
                key={order.id} 
                style={{ 
                  backgroundColor: "rgba(18, 18, 24, 0.95)", 
                  borderRadius: "1.25rem", 
                  border: "1px solid rgba(255,255,255,0.08)", 
                  padding: "1.75rem",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1.25rem", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "white", margin: 0, fontFamily: "monospace" }}>
                        Pedido #{shortId}
                      </h3>
                      <span style={{
                        padding: "0.25rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        backgroundColor: 
                          order.status === "delivered" ? "rgba(34, 197, 94, 0.15)" :
                          order.status === "shipped" ? "rgba(59, 130, 246, 0.15)" :
                          order.status === "paid" ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.1)",
                        color: 
                          order.status === "delivered" ? "#22c55e" :
                          order.status === "shipped" ? "#3b82f6" :
                          order.status === "paid" ? "#f59e0b" : "white",
                        border: `1px solid ${
                          order.status === "delivered" ? "rgba(34, 197, 94, 0.3)" :
                          order.status === "shipped" ? "rgba(59, 130, 246, 0.3)" :
                          order.status === "paid" ? "rgba(245, 158, 11, 0.3)" : "rgba(255,255,255,0.2)"
                        }`
                      }}>
                        {order.status === "paid" ? "Pagado (Pendiente Envío)" : order.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.825rem", marginTop: "0.35rem", margin: 0 }}>
                      Fecha: {new Date(order.created_at).toLocaleString("es-CO")}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 700 }}>
                      Total del Pedido
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--color-magenta)", marginTop: "2px" }}>
                      {formatCOP(Number(order.total_amount || 0))}
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.75rem" }}>
                  {/* Column 1: Cliente & Contacto */}
                  <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h4 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
                      Datos del Cliente
                    </h4>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "white", marginBottom: "0.5rem" }}>
                      {order.customer_name}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", marginBottom: "0.35rem" }}>
                      <Mail size={14} style={{ color: "var(--color-magenta)" }} />
                      <a href={`mailto:${order.customer_email}`} style={{ color: "inherit", textDecoration: "none" }}>{order.customer_email}</a>
                    </div>
                    {order.customer_phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
                        <Phone size={14} style={{ color: "var(--color-magenta)" }} />
                        <a href={`tel:${order.customer_phone}`} style={{ color: "inherit", textDecoration: "none" }}>{order.customer_phone}</a>
                      </div>
                    )}
                  </div>

                  {/* Column 2: Envío & Guía */}
                  <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h4 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
                      Dirección de Entrega
                    </h4>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "white", marginBottom: "0.5rem" }}>
                      <MapPin size={16} style={{ color: "var(--color-magenta)", flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <div>{order.shipping_address}</div>
                        <div style={{ color: "var(--color-text-secondary)", fontSize: "0.8rem", marginTop: "2px" }}>
                          {order.shipping_city}, {order.shipping_country} {order.shipping_zip ? `(CP: ${order.shipping_zip})` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Tracking Number Section */}
                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      {order.tracking_number ? (
                        <div style={{ fontSize: "0.85rem", color: "#60a5fa", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                          <Truck size={16} /> Guía: <span style={{ fontFamily: "monospace", color: "white" }}>{order.tracking_number}</span>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input 
                            type="text"
                            placeholder="Número de Guía / Tracking..."
                            defaultValue={trackingInputs[order.id] || ""}
                            onChange={(e) => setTrackingInputs(prev => ({ ...prev, [order.id]: e.target.value }))}
                            style={{
                              flex: 1,
                              padding: "0.45rem 0.75rem",
                              borderRadius: "0.4rem",
                              border: "1px solid rgba(255,255,255,0.15)",
                              backgroundColor: "rgba(0,0,0,0.4)",
                              color: "white",
                              fontSize: "0.8rem"
                            }}
                          />
                          <button
                            onClick={() => handleSaveTracking(order.id)}
                            disabled={isPending}
                            style={{
                              padding: "0.45rem 0.85rem",
                              backgroundColor: "#3b82f6",
                              color: "white",
                              border: "none",
                              borderRadius: "0.4rem",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Guardar Guía
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Productos / Items Comprados */}
                  <div style={{ backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h4 style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 800, marginBottom: "0.75rem", letterSpacing: "0.05em" }}>
                      Artículos ({items.length})
                    </h4>
                    {items.length === 0 ? (
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Sin productos detallados.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {items.map((item: any, i: number) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "0.35rem" }}>
                            <div>
                              <strong style={{ color: "white" }}>{item.quantity}x</strong> {item.product_name}
                              {item.variant_name && <span style={{ color: "var(--color-accent, #00f0ff)", fontSize: "0.78rem" }}> ({item.variant_name})</span>}
                            </div>
                            <span style={{ fontWeight: 700, color: "white", fontFamily: "monospace" }}>
                              {formatCOP(Number(item.total_price || 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: State Changer Actions */}
                <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div style={{ fontSize: "0.825rem", color: "rgba(255,255,255,0.6)" }}>
                    Cambiar estado del pedido:
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => handleStatusChange(order.id, "processing")}
                      disabled={isPending || order.status === "processing"}
                      style={{
                        padding: "0.4rem 0.75rem",
                        backgroundColor: order.status === "processing" ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: order.status === "processing" ? "#f59e0b" : "white",
                        borderRadius: "0.4rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      En Preparación
                    </button>

                    <button
                      onClick={() => handleStatusChange(order.id, "shipped")}
                      disabled={isPending || order.status === "shipped"}
                      style={{
                        padding: "0.4rem 0.75rem",
                        backgroundColor: order.status === "shipped" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: order.status === "shipped" ? "#3b82f6" : "white",
                        borderRadius: "0.4rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Despachado
                    </button>

                    <button
                      onClick={() => handleStatusChange(order.id, "delivered")}
                      disabled={isPending || order.status === "delivered"}
                      style={{
                        padding: "0.4rem 0.75rem",
                        backgroundColor: order.status === "delivered" ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: order.status === "delivered" ? "#22c55e" : "white",
                        borderRadius: "0.4rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Entregado
                    </button>

                    <button
                      onClick={() => handleStatusChange(order.id, "cancelled")}
                      disabled={isPending || order.status === "cancelled"}
                      style={{
                        padding: "0.4rem 0.75rem",
                        backgroundColor: order.status === "cancelled" ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: order.status === "cancelled" ? "#ef4444" : "rgba(239, 68, 68, 0.8)",
                        borderRadius: "0.4rem",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
