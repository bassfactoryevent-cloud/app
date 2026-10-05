"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  ArrowLeft, ShieldCheck, UserPlus, UserX, CheckCircle2, 
  XCircle, ScanLine, Smartphone, AlertTriangle, Trash2, Power, Copy, Check
} from "lucide-react";
import { toast } from "sonner";
import { 
  addStaffToEventAction, 
  toggleStaffStatusAction, 
  removeStaffAction 
} from "./actions";
import { StaffAssignment } from "@/utils/staffAssignments";

interface StaffManagementClientProps {
  eventId: string;
  eventTitle: string;
  initialAssignments: StaffAssignment[];
  availableUsers: { id: string; full_name: string; email: string; role: string }[];
}

export default function StaffManagementClient({
  eventId,
  eventTitle,
  initialAssignments,
  availableUsers,
}: StaffManagementClientProps) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [copiedLink, setCopiedLink] = useState(false);

  const scannerUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/scanner` 
    : "https://bassfactory.co/scanner";

  const handleAssign = () => {
    if (!selectedUserId) {
      toast.error("Selecciona un usuario para asignar");
      return;
    }

    startTransition(async () => {
      const res = await addStaffToEventAction(eventId, selectedUserId);
      if (res.success) {
        toast.success("Personal asignado a la puerta de este evento");
        const assignedUser = availableUsers.find(u => u.id === selectedUserId);
        if (assignedUser) {
          setAssignments(prev => [
            ...prev.filter(a => a.user_id !== selectedUserId),
            {
              id: crypto.randomUUID(),
              user_id: selectedUserId,
              user_name: assignedUser.full_name || "Personal de Puerta",
              user_email: assignedUser.email || "",
              event_id: eventId,
              event_title: eventTitle,
              is_active: true,
              assigned_at: new Date().toISOString(),
              assigned_by: "Admin",
            }
          ]);
        }
        setSelectedUserId("");
      } else {
        toast.error(res.error || "Error al asignar personal");
      }
    });
  };

  const handleToggleStatus = (assignmentId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    startTransition(async () => {
      const res = await toggleStaffStatusAction(assignmentId, nextStatus, eventId);
      if (res.success) {
        setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, is_active: nextStatus } : a));
        toast.success(nextStatus ? "Acceso de escaneo activado" : "Acceso de escaneo bloqueado inmediatamente");
      } else {
        toast.error(res.error || "Error al cambiar estado");
      }
    });
  };

  const handleRemove = (assignmentId: string) => {
    if (!confirm("¿Seguro que deseas desvincular a este usuario de la puerta de este evento?")) return;

    startTransition(async () => {
      const res = await removeStaffAction(assignmentId, eventId);
      if (res.success) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        toast.success("Asignación eliminada correctamente");
      } else {
        toast.error(res.error || "Error al eliminar asignación");
      }
    });
  };

  const copyScannerLink = () => {
    navigator.clipboard.writeText(scannerUrl);
    setCopiedLink(true);
    toast.success("Enlace del escáner móvil copiado al portapapeles");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            href={`/admin/events/${eventId}/dashboard`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "42px",
              height: "42px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              color: "white",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "white", margin: 0 }}>
              Control de Puertas & Personal de Escaneo
            </h1>
            <p style={{ color: "var(--color-magenta)", fontWeight: 600, fontSize: "0.95rem", margin: "0.25rem 0 0" }}>
              {eventTitle}
            </p>
          </div>
        </div>

        <Link
          href={`/admin/events/${eventId}/scan`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "white",
            padding: "0.6rem 1.2rem",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          <ScanLine size={18} /> Probar Escáner como Admin
        </Link>
      </div>

      {/* ADVERTENCIA DE SEGURIDAD Y CONTROL */}
      <div style={{
        backgroundColor: "rgba(6, 182, 212, 0.08)",
        border: "1px solid rgba(6, 182, 212, 0.3)",
        borderRadius: "1rem",
        padding: "1.25rem 1.5rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start"
      }}>
        <Smartphone size={26} style={{ color: "#06b6d4", flexShrink: 0, marginTop: "2px" }} />
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#06b6d4", margin: 0 }}>
            Seguridad Estricta de Puerta y Dispositivos Móviles
          </h3>
          <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.8)", margin: "0.35rem 0 0.75rem" }}>
            Los usuarios asignados aquí solo podrán escanear entradas para <strong>este evento específico</strong> desde su celular en el portal móvil <strong>bassfactory.co/scanner</strong>.
            Si un trabajador ya no labora o termina su turno, simplemente haz clic en <strong>&quot;Bloquear Acceso&quot;</strong> y quedará inhabilitado de inmediato.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)" }}>
              Enlace para el personal en puerta:
            </span>
            <button
              onClick={copyScannerLink}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "0.4rem",
                backgroundColor: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(6, 182, 212, 0.4)",
                color: "#06b6d4",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedLink ? "¡Copiado!" : "Copiar bassfactory.co/scanner"}
            </button>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE ASIGNACIÓN */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1rem",
        padding: "1.5rem"
      }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: "0 0 1rem" }}>
          Asignar Nuevo Personal a la Puerta
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {availableUsers && availableUsers.length > 0 ? (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isPending}
              style={{
                flex: 1,
                minWidth: "260px",
                padding: "0.75rem 1rem",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "0.5rem",
                color: "white",
                fontSize: "0.875rem",
                outline: "none"
              }}
            >
              <option value="">-- Seleccionar personal autorizado (Puerta o Admin) --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || "Sin nombre"} ({u.email || u.id.substring(0, 8)}) — [Rol: {u.role === 'scanner' ? '🚪 Personal de Puerta' : u.role === 'superadmin' ? '👑 Super Admin' : u.role === 'admin' ? 'Admin' : u.role}]
                </option>
              ))}
            </select>
          ) : (
            <div style={{ flex: 1, padding: "0.6rem 0", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
              No hay usuarios con rol de <strong>Puerta</strong> o <strong>Admin</strong> registrados. (Clientes comunes están excluidos).{" "}
              <Link href="/admin/users" style={{ color: "#06b6d4", fontWeight: 700, textDecoration: "underline" }}>
                + Crear o asignar rol en Usuarios &rarr;
              </Link>
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={isPending || !selectedUserId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              backgroundColor: "#06b6d4",
              border: "none",
              borderRadius: "0.5rem",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.875rem",
              cursor: isPending || !selectedUserId ? "not-allowed" : "pointer",
              opacity: isPending || !selectedUserId ? 0.6 : 1,
              transition: "opacity 0.2s"
            }}
          >
            <UserPlus size={18} />
            {isPending ? "Asignando..." : "Asignar a Puerta"}
          </button>
        </div>
      </div>

      {/* LISTA DE PERSONAL ASIGNADO */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1rem",
        overflow: "hidden"
      }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: 0 }}>
            Personal Asignado ({assignments.length})
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "0.25rem 0 0" }}>
            Usuarios con permiso de escanear credenciales y entradas en la puerta de este evento.
          </p>
        </div>

        {assignments.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            No hay personal asignado a la puerta de este evento todavía. Asigna un usuario arriba para que pueda leer los QRs con su celular.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", color: "rgba(255, 255, 255, 0.5)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "1rem 1.5rem" }}>Trabajador / Puerta</th>
                  <th style={{ padding: "1rem 1.5rem" }}>Fecha Asignación</th>
                  <th style={{ padding: "1rem 1.5rem" }}>Estado</th>
                  <th style={{ padding: "1rem 1.5rem", textAlign: "right" }}>Acciones de Control</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((staff) => (
                  <tr 
                    key={staff.id}
                    style={{ 
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                      backgroundColor: staff.is_active ? "transparent" : "rgba(239, 68, 68, 0.03)"
                    }}
                  >
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ fontWeight: 700, color: "white" }}>{staff.user_name}</div>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                        {staff.user_email || "Sin correo"}
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>
                      {new Date(staff.assigned_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        backgroundColor: staff.is_active ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        color: staff.is_active ? "#22c55e" : "#ef4444",
                        border: `1px solid ${staff.is_active ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                      }}>
                        {staff.is_active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {staff.is_active ? "HABILITADO EN PUERTA" : "BLOQUEADO / REVOCADO"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        {/* BOTÓN TOGGLE 1-CLICK LOCK */}
                        <button
                          onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                          disabled={isPending}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.4rem",
                            border: `1px solid ${staff.is_active ? "rgba(239, 68, 68, 0.4)" : "rgba(34, 197, 94, 0.4)"}`,
                            backgroundColor: staff.is_active ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                            color: staff.is_active ? "#ef4444" : "#22c55e",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: isPending ? "not-allowed" : "pointer"
                          }}
                        >
                          <Power size={13} />
                          {staff.is_active ? "Bloquear Acceso" : "Reactivar"}
                        </button>

                        {/* BOTÓN ELIMINAR ASIGNACIÓN */}
                        <button
                          onClick={() => handleRemove(staff.id)}
                          disabled={isPending}
                          title="Eliminar asignación por completo"
                          style={{
                            padding: "0.4rem 0.6rem",
                            borderRadius: "0.4rem",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backgroundColor: "rgba(0,0,0,0.3)",
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "0.75rem",
                            cursor: isPending ? "not-allowed" : "pointer"
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
