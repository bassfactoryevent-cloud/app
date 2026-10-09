"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { 
  ArrowLeft, DollarSign, Ticket, Users, Activity, ScanLine, 
  CheckCircle2, Clock, Search, UserPlus, Power, Trash2, ShieldCheck, Smartphone, ExternalLink,
  Gift, Lock, Unlock, Sparkles
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { addStaffToEventAction, toggleStaffStatusAction, removeStaffAction } from "../staff/actions";
import { IssueCourtesyModal } from "./IssueCourtesyModal";
import { toggleCourtesyLock } from "./actions";

interface EventDashboardClientProps {
  event: any;
  initialTiers: any[];
  initialOrders: any[];
  initialTickets: any[];
  initialTransfers: any[];
  initialAssignments?: any[];
  availableUsers?: any[];
  staffUsersMap?: Record<string, { full_name: string; email: string; role: string }>;
}

export default function EventDashboardClient({ 
  event, 
  initialTiers, 
  initialOrders, 
  initialTickets, 
  initialTransfers,
  initialAssignments = [],
  availableUsers = [],
  staffUsersMap = {}
}: EventDashboardClientProps) {
  const supabase = createClient();
  const [orders, setOrders] = useState(initialOrders);
  const [tickets, setTickets] = useState(initialTickets);
  const [transfers, setTransfers] = useState(initialTransfers);
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedStaffUserId, setSelectedStaffUserId] = useState("");
  const [isStaffPending, startStaffTransition] = useTransition();

  const [attendeeFilter, setAttendeeFilter] = useState<"all" | "active" | "pending" | "courtesy">("active");
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [isCourtesyModalOpen, setIsCourtesyModalOpen] = useState(false);
  const [isLockingTicketId, setIsLockingTicketId] = useState<string | null>(null);

  const handleToggleTicketLock = async (ticketId: string, currentDispatched: boolean) => {
    try {
      setIsLockingTicketId(ticketId);
      const res = await toggleCourtesyLock(ticketId, event.id, currentDispatched);
      if (res.success) {
        setTickets((prev) => prev.map(t => t.id === ticketId ? { ...t, qr_dispatched: res.isDispatched } : t));
        toast.success(res.isDispatched ? "QR desbloqueado para el invitado" : "QR bloqueado hasta el evento");
      } else {
        toast.error(res.error || "Error al actualizar bloqueo");
      }
    } finally {
      setIsLockingTicketId(null);
    }
  };

  const handleAssignStaff = () => {
    if (!selectedStaffUserId) {
      toast.error("Selecciona un usuario para asignar a la puerta");
      return;
    }

    startStaffTransition(async () => {
      const res = await addStaffToEventAction(event.id, selectedStaffUserId);
      if (res.success) {
        toast.success("Personal asignado a la puerta de este evento");
        const assignedUser = availableUsers?.find((u: any) => u.id === selectedStaffUserId);
        if (assignedUser) {
          setAssignments((prev: any[]) => [
            ...prev.filter((a: any) => a.user_id !== selectedStaffUserId),
            {
              id: crypto.randomUUID(),
              user_id: selectedStaffUserId,
              user_name: assignedUser.full_name || "Personal de Puerta",
              user_email: assignedUser.email || "",
              event_id: event.id,
              event_title: event.title,
              is_active: true,
              assigned_at: new Date().toISOString(),
              assigned_by: "Admin",
            }
          ]);
        }
        setSelectedStaffUserId("");
      } else {
        toast.error(res.error || "Error al asignar personal");
      }
    });
  };

  const handleToggleStaffStatus = (assignmentId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    startStaffTransition(async () => {
      const res = await toggleStaffStatusAction(assignmentId, nextStatus, event.id);
      if (res.success) {
        setAssignments((prev: any[]) => prev.map((a: any) => a.id === assignmentId ? { ...a, is_active: nextStatus } : a));
        toast.success(nextStatus ? "Acceso de escáner activado" : "Acceso de escáner bloqueado inmediatamente");
      } else {
        toast.error(res.error || "Error al actualizar estado");
      }
    });
  };

  const handleRemoveStaff = (assignmentId: string) => {
    if (!confirm("¿Deseas revocar el permiso de escaneo a este usuario para este evento?")) return;
    startStaffTransition(async () => {
      const res = await removeStaffAction(assignmentId, event.id);
      if (res.success) {
        setAssignments((prev: any[]) => prev.filter((a: any) => a.id !== assignmentId));
        toast.success("Asignación de puerta eliminada");
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    });
  };
  
  // Realtime subscription
  useEffect(() => {
    // Escuchar actualizaciones de boletas escaneadas o creadas
    const ticketsChannel = supabase
      .channel('schema-db-changes-tickets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          const updatedTicket = payload.new as any;
          if (!updatedTicket) return;
          setTickets((prev) => {
            const exists = prev.some(t => t.id === updatedTicket.id);
            if (exists) {
              return prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
            }
            return [updatedTicket, ...prev];
          });
          if (updatedTicket.status === 'scanned') {
            toast.info("Boleta escaneada en puerta");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [event.id, supabase]);

  // Derived calculations
  const totalTiersCapacity = initialTiers.reduce((sum, t) => sum + (Number(t.quantity_available) || 0), 0);
  const totalAforo = Number(event.total_capacity) || totalTiersCapacity;

  // Identificar ordenes y tickets de cortesía
  const courtesyOrdersMap = new Map<string, any>(
    orders.filter(o => o.payment_provider === 'courtesy').map(o => [o.id, o])
  );
  const courtesyTickets = tickets.filter(t => courtesyOrdersMap.has(t.order_id));
  const commercialTickets = tickets.filter(t => !courtesyOrdersMap.has(t.order_id));

  // Calculo de ingresos: solo órdenes comerciales reales (las cortesías tienen total $0 COP)
  const commercialOrdersTotal = orders
    .filter(o => o.payment_provider !== 'courtesy')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const commercialTicketsValueTotal = commercialTickets.reduce((sum, t) => {
    const tier = initialTiers.find(ti => ti.id === t.tier_id || ti.id === t.ticket_tier_id);
    return sum + (tier ? Number(tier.price || 0) : 0);
  }, 0);
  const totalRevenue = Math.max(commercialOrdersTotal, commercialTicketsValueTotal);

  const totalTicketsCount = tickets.length;
  const totalScanned = tickets.filter(t => t.status === 'scanned' || Boolean(t.scanned_at)).length;

  const formatCurrency = (val: number) => `$${val.toLocaleString('es-CO')}`;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link href="/admin/events" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "40px", height: "40px", backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "50%", color: "white", textDecoration: "none", transition: "background-color 0.2s"
        }}>
          <ArrowLeft size={20} />
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: "260px" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={22} color="#3b82f6" />
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, margin: 0, color: "white" }}>
              Detalle del Evento: {event.title}
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.65)", margin: 0, fontSize: "0.85rem" }}>
            Aforo y capacidad, lista de asistentes en vivo, cortesías emitidas, personal de puerta y ventas.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsCourtesyModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              backgroundColor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899',
              border: '1px solid rgba(236, 72, 153, 0.35)',
              padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              fontSize: '0.875rem'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.25)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.15)'}
          >
            <Gift size={18} /> + Emitir Cortesías
          </button>

          <Link href={`/admin/events/${event.id}/staff`} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
            textDecoration: 'none', fontWeight: 700, transition: 'background-color 0.2s',
            fontSize: '0.875rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.25)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.15)'}
          >
            <Users size={18} /> Personal de Puerta
          </Link>

          <Link href={`/admin/events/${event.id}/scan`} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: 'var(--color-magenta)', color: 'white',
            padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)',
            textDecoration: 'none', fontWeight: 600, transition: 'opacity 0.2s',
            fontSize: '0.875rem'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <ScanLine size={18} /> Abrir Escáner
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.25rem", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#22c55e", marginBottom: "0.5rem" }}>
            <DollarSign size={20} />
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Ingresos Ventas</h3>
          </div>
          <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 800, color: "white", wordBreak: "break-word" }}>
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.25rem", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3b82f6", marginBottom: "0.5rem" }}>
            <Ticket size={20} />
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Ventas Comerciales</h3>
          </div>
          <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 800, color: "white", wordBreak: "break-word" }}>
            {commercialTickets.length} <span style={{ fontSize: "0.95rem", opacity: 0.5, fontWeight: 500 }}>boletas</span>
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.25)", borderRadius: "var(--radius-lg)", padding: "1.25rem", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#c084fc", marginBottom: "0.5rem" }}>
            <Gift size={20} />
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Cortesías Emitidas</h3>
          </div>
          <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 800, color: "white", wordBreak: "break-word" }}>
            {courtesyTickets.length} <span style={{ fontSize: "0.95rem", opacity: 0.5, fontWeight: 500 }}>invitados</span>
          </div>
        </div>

        <div style={{ backgroundColor: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.2)", borderRadius: "var(--radius-lg)", padding: "1.25rem", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ec4899", marginBottom: "0.5rem" }}>
            <ScanLine size={20} />
            <h3 style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "uppercase", margin: 0 }}>Aforo Ingresado (Puerta)</h3>
          </div>
          <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: 800, color: "white", wordBreak: "break-word" }}>
            {totalScanned} <span style={{ fontSize: "1rem", opacity: 0.5, fontWeight: 500 }}>/ {totalAforo > 0 ? totalAforo : totalTicketsCount}</span>
          </div>
        </div>
      </div>

      {/* Live Door Check-in & Attendees Table */}
      <div style={{ marginTop: "2.5rem", backgroundColor: "var(--color-surface, #111)", border: "1px solid var(--color-border, #333)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border, #333)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.3rem" }}>🚪</span>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "white" }}>
                Control de Entrada / Asistentes (Check-in en Vivo)
              </h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.35rem", marginBottom: 0 }}>
              Registro de boletas comerciales y de cortesía, estado del QR antifraude y verificación en sala.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "rgba(34, 197, 94, 0.12)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              padding: "0.4rem 0.85rem",
              borderRadius: "999px",
              color: "#22c55e",
              fontWeight: 800,
              fontSize: "0.825rem"
            }}>
              <CheckCircle2 size={15} />
              {totalScanned} / {totalAforo > 0 ? totalAforo : totalTicketsCount} Ingresados
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#22c55e" }}>
              <span style={{ width: "8px", height: "8px", backgroundColor: "#22c55e", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #22c55e" }} />
              En Vivo
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ padding: "1rem 1.5rem", backgroundColor: "rgba(255,255,255,0.015)", borderBottom: "1px solid var(--color-border, #333)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => setAttendeeFilter("all")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                border: attendeeFilter === "all" ? "1px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
                backgroundColor: attendeeFilter === "all" ? "rgba(59, 130, 246, 0.2)" : "rgba(255,255,255,0.04)",
                color: attendeeFilter === "all" ? "white" : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              Todos ({tickets.length})
            </button>
            <button
              onClick={() => setAttendeeFilter("active")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                border: attendeeFilter === "active" ? "1px solid #22c55e" : "1px solid rgba(255,255,255,0.1)",
                backgroundColor: attendeeFilter === "active" ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.04)",
                color: attendeeFilter === "active" ? "#22c55e" : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🟢 Activos en el Evento ({totalScanned})
            </button>
            <button
              onClick={() => setAttendeeFilter("pending")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                border: attendeeFilter === "pending" ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)",
                backgroundColor: attendeeFilter === "pending" ? "rgba(245, 158, 11, 0.2)" : "rgba(255,255,255,0.04)",
                color: attendeeFilter === "pending" ? "#f59e0b" : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🟡 Pendientes ({Math.max(0, tickets.length - totalScanned)})
            </button>
            <button
              onClick={() => setAttendeeFilter("courtesy")}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                border: attendeeFilter === "courtesy" ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                backgroundColor: attendeeFilter === "courtesy" ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.04)",
                color: attendeeFilter === "courtesy" ? "#c084fc" : "rgba(255,255,255,0.6)",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer"
              }}
            >
              🎁 Cortesías ({courtesyTickets.length})
            </button>
          </div>

          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o #ticket..."
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "0.825rem"
              }}
            />
          </div>
        </div>

        {/* Table of Attendees */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "750px" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border, #333)" }}>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>Asistente</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>Localidad / Tipo</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>Estado en Puerta</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>Seguridad QR</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>Hora de Ingreso</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem" }}>Validado en Puerta Por</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.85rem", textAlign: "right" }}>Ticket ID</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = tickets.filter(t => {
                  const isScanned = t.status === "scanned" || Boolean(t.scanned_at);
                  const isCourtesy = courtesyOrdersMap.has(t.order_id);
                  if (attendeeFilter === "active" && !isScanned) return false;
                  if (attendeeFilter === "pending" && isScanned) return false;
                  if (attendeeFilter === "courtesy" && !isCourtesy) return false;

                  if (attendeeSearch.trim()) {
                    const q = attendeeSearch.toLowerCase().trim();
                    const relatedOrder = orders.find(o => o.id === t.order_id);
                    const name = (t.assigned_name || relatedOrder?.customer_name || "").toLowerCase();
                    const email = (t.assigned_email || relatedOrder?.customer_email || "").toLowerCase();
                    const reason = (relatedOrder?.shipping_city || "").toLowerCase();
                    const shortId = t.id.slice(0, 8).toLowerCase();
                    return name.includes(q) || email.includes(q) || reason.includes(q) || shortId.includes(q);
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} style={{ padding: "2.5rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                        {attendeeSearch ? "No se encontraron asistentes con ese criterio." : "No hay boletas en esta categoría."}
                      </td>
                    </tr>
                  );
                }

                return filtered.map((t) => {
                  const isScanned = t.status === "scanned" || Boolean(t.scanned_at);
                  const relatedOrder = orders.find(o => o.id === t.order_id);
                  const isCourtesy = courtesyOrdersMap.has(t.order_id);
                  const attendeeName = t.assigned_name || relatedOrder?.customer_name || "Titular de Cuenta";
                  const attendeeEmail = t.assigned_email || relatedOrder?.customer_email || "-";
                  const tier = initialTiers.find(ti => ti.id === t.tier_id || ti.id === t.ticket_tier_id);
                  const staffUser = t.scanned_by ? staffUsersMap[t.scanned_by] : null;
                  const isQrLocked = t.qr_dispatched === false;

                  return (
                    <tr key={t.id} style={{
                      borderBottom: "1px solid var(--color-border, #333)",
                      backgroundColor: isScanned ? "rgba(34, 197, 94, 0.04)" : isCourtesy ? "rgba(168, 85, 247, 0.02)" : "transparent"
                    }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "white" }}>{attendeeName}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{attendeeEmail}</div>
                            {isCourtesy && (
                              <div style={{
                                marginTop: "3px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: "#c084fc",
                                backgroundColor: "rgba(168, 85, 247, 0.12)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid rgba(168, 85, 247, 0.25)"
                              }}>
                                🎁 Cortesía: {relatedOrder?.shipping_city || "Invitado"}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
                          <span style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            backgroundColor: "rgba(0, 240, 255, 0.1)",
                            color: "#00f0ff",
                            border: "1px solid rgba(0, 240, 255, 0.25)"
                          }}>
                            {tier?.name || "General"}
                          </span>
                          {isCourtesy ? (
                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                              Cortesía ($0 COP)
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                              {formatCurrency(Number(tier?.price || 0))}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {isScanned ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            backgroundColor: "rgba(34, 197, 94, 0.2)",
                            color: "#22c55e",
                            border: "1px solid rgba(34, 197, 94, 0.3)"
                          }}>
                            <CheckCircle2 size={13} /> ACTIVO EN EL EVENTO
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                            color: "#f59e0b",
                            border: "1px solid rgba(245, 158, 11, 0.25)"
                          }}>
                            <Clock size={13} /> PENDIENTE
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {isQrLocked ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "0.25rem 0.55rem",
                              borderRadius: "999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                              color: "#f59e0b",
                              border: "1px solid rgba(245, 158, 11, 0.3)"
                            }} title="QR bloqueado hasta 24h antes del evento para prevenir fraudes">
                              <Lock size={12} /> Bloqueado (24h)
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "0.25rem 0.55rem",
                              borderRadius: "999px",
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              backgroundColor: "rgba(34, 197, 94, 0.15)",
                              color: "#22c55e",
                              border: "1px solid rgba(34, 197, 94, 0.3)"
                            }}>
                              <CheckCircle2 size={12} /> QR Activo
                            </span>
                          )}

                          <button
                            onClick={() => handleToggleTicketLock(t.id, !isQrLocked)}
                            disabled={isLockingTicketId === t.id}
                            title={isQrLocked ? "Desbloquear QR ahora mismo" : "Bloquear QR por seguridad"}
                            style={{
                              padding: "0.2rem 0.45rem",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              color: isQrLocked ? "#22c55e" : "#f59e0b",
                              fontSize: "0.7rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                          >
                            {isLockingTicketId === t.id ? (
                              "..."
                            ) : isQrLocked ? (
                              <Unlock size={12} />
                            ) : (
                              <Lock size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", color: isScanned ? "white" : "var(--color-text-secondary)", fontSize: "0.85rem", fontFamily: isScanned ? "monospace" : "inherit" }}>
                        {t.scanned_at ? new Date(t.scanned_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Pendiente"}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {isScanned ? (
                          t.scanned_by ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <span style={{ fontSize: "0.85rem" }}>🚪</span>
                              <div>
                                <div style={{ fontWeight: 800, color: "white", fontSize: "0.825rem" }}>
                                  {staffUser?.full_name || assignments.find(a => a.user_id === t.scanned_by)?.user_name || "Staff de Puerta"}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: "#06b6d4", fontWeight: 700 }}>
                                  {staffUser?.role === "superadmin" ? "👑 Super Admin" : staffUser?.role === "admin" ? "Admin" : "Personal de Puerta"}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem", fontStyle: "italic" }}>
                              Validado en taquilla
                            </span>
                          )
                        ) : (
                          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                            — Pendiente
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-accent, #00f0ff)" }}>
                        #{t.id.slice(0, 8).toUpperCase()}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Door Staff Assignment Card */}
      <div style={{ marginTop: "2.5rem", backgroundColor: "var(--color-surface, #111)", border: "1px solid var(--color-border, #333)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border, #333)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={22} color="#06b6d4" />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "white" }}>
                Personal de Puerta Asignado (Escáner de Boletas)
              </h3>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.35rem", marginBottom: 0 }}>
              Configura quiénes están autorizados para recibir los QRs y escanear en la puerta de este evento desde su celular en <strong>bassfactory.co/scanner</strong>.
            </p>
          </div>

          <Link href={`/admin/events/${event.id}/staff`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.825rem",
            fontWeight: 700,
            color: "#06b6d4",
            textDecoration: "none",
            padding: "0.45rem 0.9rem",
            borderRadius: "0.5rem",
            backgroundColor: "rgba(6, 182, 212, 0.12)",
            border: "1px solid rgba(6, 182, 212, 0.3)"
          }}>
            <ExternalLink size={14} /> Gestión Completa de Puerta
          </Link>
        </div>

        {/* Quick Assign Form */}
        <div style={{ padding: "1.25rem 1.5rem", backgroundColor: "rgba(255,255,255,0.015)", borderBottom: "1px solid var(--color-border, #333)", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem" }}>
          <div style={{ flex: 1, minWidth: "260px" }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)", fontWeight: 700, marginBottom: "0.35rem" }}>
              Seleccionar personal autorizado para la puerta de este evento (Puerta / Admin):
            </label>
            {availableUsers && availableUsers.length > 0 ? (
              <select
                value={selectedStaffUserId}
                onChange={(e) => setSelectedStaffUserId(e.target.value)}
                disabled={isStaffPending}
                style={{
                  width: "100%",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: 600
                }}
              >
                <option value="">-- Elige personal autorizado (Puerta o Admin) --</option>
                {availableUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email}) — [Rol: {u.role === 'scanner' ? '🚪 Personal de Puerta' : u.role === 'superadmin' ? '👑 Super Admin' : u.role === 'admin' ? 'Admin' : u.role}]
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ padding: "0.5rem 0", fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
                No hay usuarios con rol de <strong>Puerta</strong> o <strong>Admin</strong> disponibles. (Los clientes comunes están excluidos por seguridad).{" "}
                <Link href="/admin/users" style={{ color: "var(--color-magenta)", fontWeight: 700, textDecoration: "underline" }}>
                  + Crear usuario o cambiar rol en Usuarios &rarr;
                </Link>
              </div>
            )}
          </div>

          <button
            onClick={handleAssignStaff}
            disabled={isStaffPending || !selectedStaffUserId}
            style={{
              alignSelf: "flex-end",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "0.5rem",
              backgroundColor: isStaffPending || !selectedStaffUserId ? "rgba(6, 182, 212, 0.2)" : "#06b6d4",
              color: isStaffPending || !selectedStaffUserId ? "rgba(255,255,255,0.4)" : "#000",
              fontWeight: 800,
              fontSize: "0.85rem",
              border: "none",
              cursor: isStaffPending || !selectedStaffUserId ? "not-allowed" : "pointer"
            }}
          >
            <UserPlus size={16} /> Asignar a la Puerta
          </button>
        </div>

        {/* Assigned Staff List */}
        <div style={{ padding: "1.25rem 1.5rem" }}>
          {assignments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "1.75rem", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem" }}>
              No hay personal asignado a la puerta de este evento. Asigna a uno arriba para que pueda escanear desde su celular.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {assignments.map((a: any) => {
                const staffScansCount = tickets.filter(t => t.scanned_by === a.user_id && (t.status === 'scanned' || Boolean(t.scanned_at))).length;
                return (
                  <div key={a.id} style={{
                    padding: "1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: a.is_active ? "rgba(6, 182, 212, 0.05)" : "rgba(239, 68, 68, 0.05)",
                    border: `1px solid ${a.is_active ? "rgba(6, 182, 212, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.75rem"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ fontWeight: 800, color: "white", fontSize: "0.95rem" }}>
                          {a.user_name || "Personal de Puerta"}
                        </div>
                        <span style={{
                          padding: "0.2rem 0.5rem",
                          borderRadius: "999px",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          backgroundColor: a.is_active ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                          color: a.is_active ? "#22c55e" : "#ef4444",
                          textTransform: "uppercase"
                        }}>
                          {a.is_active ? "ACTIVO" : "BLOQUEADO"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        {a.user_email || "Sin correo"}
                      </div>
                      <div style={{
                        marginTop: "0.5rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        color: staffScansCount > 0 ? "#22c55e" : "rgba(255,255,255,0.4)",
                        backgroundColor: staffScansCount > 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${staffScansCount > 0 ? "rgba(34, 197, 94, 0.25)" : "rgba(255,255,255,0.08)"}`,
                        padding: "0.25rem 0.55rem",
                        borderRadius: "0.4rem"
                      }}>
                        🎟️ {staffScansCount} {staffScansCount === 1 ? "persona ingresada" : "personas ingresadas"}
                      </div>
                    </div>

                  <div style={{ display: "flex", gap: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.75rem" }}>
                    <button
                      onClick={() => handleToggleStaffStatus(a.id, a.is_active)}
                      disabled={isStaffPending}
                      style={{
                        flex: 1,
                        padding: "0.45rem 0.6rem",
                        borderRadius: "0.4rem",
                        backgroundColor: a.is_active ? "rgba(239, 68, 68, 0.15)" : "rgba(34, 197, 94, 0.15)",
                        border: `1px solid ${a.is_active ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"}`,
                        color: a.is_active ? "#ef4444" : "#22c55e",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.3rem"
                      }}
                    >
                      <Power size={13} /> {a.is_active ? "Bloquear Acceso" : "Reactivar Acceso"}
                    </button>

                    <button
                      onClick={() => handleRemoveStaff(a.id)}
                      disabled={isStaffPending}
                      title="Eliminar asignación"
                      style={{
                        padding: "0.45rem 0.6rem",
                        borderRadius: "0.4rem",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)",
                        cursor: "pointer"
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
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
              const tierCapacity = Number(tier.quantity_available) || 0;
              const remaining = Math.max(0, tierCapacity - soldInTier);
              const percentage = tierCapacity > 0 ? Math.min(100, (soldInTier / tierCapacity) * 100) : 0;
              
              return (
                <div key={tier.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                    <span style={{ fontWeight: 600, color: "white" }}>{tier.name}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{soldInTier} / {tierCapacity} vendidas</span>
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
                    Quedan: <span style={{ color: "white", fontWeight: 600 }}>{remaining}</span>
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
                        {order.payment_provider === 'courtesy' && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(168, 85, 247, 0.15)',
                              color: '#c084fc',
                              fontWeight: 700
                            }}>
                              👤 {order.shipping_address ? order.shipping_address.replace("Emitido por admin:", "Autorizado por:").trim() : "Autorizado por admin"}
                            </span>
                            {order.shipping_city && (
                              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontWeight: 500 }}>
                                • {order.shipping_city}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "1rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {order.payment_provider === 'courtesy' ? (
                          <span style={{
                            padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700,
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981', textTransform: "uppercase"
                          }}>
                            ENTREGADA
                          </span>
                        ) : (
                          <span style={{
                            padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600,
                            backgroundColor: order.status === 'paid' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: order.status === 'paid' ? '#22c55e' : '#f59e0b', textTransform: "uppercase"
                          }}>
                            {order.status === 'paid' ? 'PAGADO' : order.status}
                          </span>
                        )}
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

      {/* Courtesy Tickets Issue Modal */}
      <IssueCourtesyModal
        isOpen={isCourtesyModalOpen}
        onClose={() => setIsCourtesyModalOpen(false)}
        event={event}
        tiers={initialTiers}
      />
    </div>
  );
}
