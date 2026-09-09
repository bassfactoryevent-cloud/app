"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Search, Eye, ShieldCheck, UserCheck, UserX, ChevronLeft, 
  ChevronRight, Sparkles, Filter, MoreVertical, Edit2
} from "lucide-react";
import { updateUserRole, toggleUserStatus } from "./actions";
import { toast } from "sonner";

interface UsersClientProps {
  initialUsers: any[];
}

export function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const PAGE_SIZE = 8;

  // Counts by role
  const roleCounts = {
    all: users.length,
    admin: users.filter(u => u.role === "admin" || u.role === "superadmin").length,
    customer: users.filter(u => u.role === "customer" || !u.role).length,
    dj: users.filter(u => u.role === "dj").length,
    promoter: users.filter(u => u.role === "promoter").length,
  };

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.id && u.id.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (roleFilter !== "all") {
      if (roleFilter === "admin" && u.role !== "admin" && u.role !== "superadmin") return false;
      if (roleFilter === "customer" && u.role !== "customer" && u.role) return false;
      if (roleFilter === "dj" && u.role !== "dj") return false;
      if (roleFilter === "promoter" && u.role !== "promoter") return false;
    }

    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "inactive" && u.is_active) return false;

    return true;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const res = await updateUserRole(userId, newRole);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setEditingUserId(null);
        toast.success(`Rol de usuario actualizado a: ${newRole.toUpperCase()}`);
      } else {
        toast.error(res.error || "Error al actualizar el rol");
      }
    });
  };

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    startTransition(async () => {
      const res = await toggleUserStatus(userId, nextStatus);
      if (res.success) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: nextStatus } : u));
        toast.success(`Usuario ${nextStatus ? "activado" : "desactivado"} correctamente`);
      } else {
        toast.error(res.error || "Error al cambiar estado");
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* FILTER CONTROLS BAR */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        {/* Search */}
        <div style={{ position: "relative", width: "100%", maxWidth: "380px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, rol o ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.6rem",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "0.6rem",
              color: "white",
              fontSize: "0.875rem",
              outline: "none"
            }}
          />
        </div>

        {/* Role Filters Tabs */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: `Todos (${roleCounts.all})` },
            { id: "admin", label: `Admin (${roleCounts.admin})` },
            { id: "customer", label: `Clientes (${roleCounts.customer})` },
            { id: "dj", label: `DJs (${roleCounts.dj})` },
            { id: "promoter", label: `Promotores (${roleCounts.promoter})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRoleFilter(tab.id);
                setCurrentPage(1);
              }}
              style={{
                padding: "0.55rem 0.95rem",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                backgroundColor: roleFilter === tab.id ? "var(--color-magenta)" : "rgba(255,255,255,0.06)",
                color: roleFilter === tab.id ? "white" : "rgba(255,255,255,0.7)",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div style={{
        backgroundColor: "rgba(18, 18, 24, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "1.25rem",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <th style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontWeight: 700, fontSize: "0.825rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usuario / Contacto</th>
                <th style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontWeight: 700, fontSize: "0.825rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rol Asignado</th>
                <th style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontWeight: 700, fontSize: "0.825rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                <th style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontWeight: 700, fontSize: "0.825rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha Registro</th>
                <th style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontWeight: 700, fontSize: "0.825rem", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No se encontraron usuarios para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isAdmin = user.role === "admin" || user.role === "superadmin";
                  const isDJ = user.role === "dj";
                  const isPromoter = user.role === "promoter";
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: isEditing ? "rgba(255,255,255,0.04)" : "transparent",
                        transition: "background-color 0.2s"
                      }}
                    >
                      {/* Column 1: User Info */}
                      <td style={{ padding: "1.1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{
                            width: "42px", height: "42px", borderRadius: "50%",
                            backgroundColor: isAdmin ? "var(--color-magenta)" : isDJ ? "#8b5cf6" : "#22c55e",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, color: "white", overflow: "hidden", flexShrink: 0
                          }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              (user.full_name || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem" }}>
                              {user.full_name || "Sin Nombre"}
                            </div>
                            {user.email && (
                              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                                {user.email}
                              </div>
                            )}
                            <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", marginTop: "2px" }}>
                              ID: {user.id.substring(0, 10)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Role + Quick Changer */}
                      <td style={{ padding: "1.1rem 1.25rem" }}>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <select
                              defaultValue={user.role || "customer"}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={isPending}
                              style={{
                                padding: "0.4rem 0.6rem",
                                borderRadius: "0.4rem",
                                backgroundColor: "rgba(0,0,0,0.7)",
                                border: "1px solid var(--color-magenta)",
                                color: "white",
                                fontSize: "0.8rem",
                                outline: "none"
                              }}
                            >
                              <option value="customer">Customer (Cliente)</option>
                              <option value="admin">Admin</option>
                              <option value="dj">DJ</option>
                              <option value="promoter">Promotor</option>
                            </select>
                            <button 
                              onClick={() => setEditingUserId(null)}
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", cursor: "pointer" }}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{
                              padding: "0.3rem 0.75rem",
                              borderRadius: "999px",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              backgroundColor: 
                                isAdmin ? "rgba(229, 9, 20, 0.15)" :
                                isDJ ? "rgba(139, 92, 246, 0.15)" :
                                isPromoter ? "rgba(245, 158, 11, 0.15)" : "rgba(255,255,255,0.08)",
                              color: 
                                isAdmin ? "#ff4d5a" :
                                isDJ ? "#c084fc" :
                                isPromoter ? "#fde68a" : "rgba(255,255,255,0.85)",
                              border: `1px solid ${
                                isAdmin ? "rgba(229, 9, 20, 0.3)" :
                                isDJ ? "rgba(139, 92, 246, 0.3)" :
                                isPromoter ? "rgba(245, 158, 11, 0.3)" : "rgba(255,255,255,0.15)"
                              }`
                            }}>
                              {user.role || "customer"}
                            </span>
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              title="Cambiar rol"
                              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px" }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Status */}
                      <td style={{ padding: "1.1rem 1.25rem" }}>
                        <button
                          onClick={() => handleToggleStatus(user.id, Boolean(user.is_active))}
                          disabled={isPending}
                          title="Hacer clic para cambiar estado"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            padding: "0.25rem 0.65rem",
                            borderRadius: "999px",
                            backgroundColor: user.is_active ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                            border: `1px solid ${user.is_active ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                            color: user.is_active ? "#22c55e" : "#ef4444",
                            cursor: "pointer"
                          }}
                        >
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: user.is_active ? "#22c55e" : "#ef4444" }} />
                          {user.is_active ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      {/* Column 4: Created At */}
                      <td style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                        {new Date(user.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" })}
                      </td>

                      {/* Column 5: Actions */}
                      <td style={{ padding: "1.1rem 1.25rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                          <Link 
                            href={`/admin/users/${user.id}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.5rem 0.85rem",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: "0.5rem",
                              color: "white",
                              textDecoration: "none",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              transition: "all 0.2s"
                            }}
                          >
                            <Eye size={14} /> Ver Perfil
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAR */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          backgroundColor: "rgba(0,0,0,0.3)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: "0.85rem",
          color: "var(--color-text-secondary)"
        }}>
          <div>
            Mostrando <strong>{filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}</strong> a <strong>{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)}</strong> de <strong>{filteredUsers.length}</strong> usuarios
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "0.4rem 0.75rem",
                borderRadius: "0.4rem",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: currentPage === 1 ? "rgba(255,255,255,0.3)" : "white",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              <ChevronLeft size={16} /> Anterior
            </button>

            <span style={{ padding: "0 0.5rem", fontWeight: 700, color: "white" }}>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "0.4rem 0.75rem",
                borderRadius: "0.4rem",
                border: "1px solid rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.05)",
                color: currentPage === totalPages ? "rgba(255,255,255,0.3)" : "white",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "0.8rem",
                fontWeight: 600
              }}
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
