"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  Search, Eye, ShieldCheck, UserCheck, UserX, ChevronLeft, 
  ChevronRight, Sparkles, Filter, MoreVertical, Edit2, UserPlus, X, Lock, Mail, User
} from "lucide-react";
import { updateUserRole, toggleUserStatus, createUserAction } from "./actions";
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

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("scanner");
  const [isCreating, setIsCreating] = useState(false);

  const PAGE_SIZE = 8;

  // Counts by role
  const roleCounts = {
    all: users.length,
    superadmin: users.filter(u => u.role === "superadmin").length,
    admin: users.filter(u => u.role === "admin").length,
    scanner: users.filter(u => u.role === "scanner").length,
    customer: users.filter(u => u.role === "customer" || !u.role).length,
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
      if (roleFilter === "superadmin" && u.role !== "superadmin") return false;
      if (roleFilter === "admin" && u.role !== "admin") return false;
      if (roleFilter === "scanner" && u.role !== "scanner") return false;
      if (roleFilter === "customer" && u.role !== "customer" && u.role) return false;
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) {
      toast.error("Por favor completa todos los campos.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createUserAction({
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      if (res.success && res.user) {
        setUsers(prev => [res.user, ...prev]);
        toast.success(`¡Usuario ${res.user.full_name} creado con éxito!`);
        setIsCreateModalOpen(false);
        setNewFullName("");
        setNewEmail("");
        setNewPassword("");
        if (newRole === "scanner") {
          setRoleFilter("scanner");
        }
      } else {
        toast.error(res.error || "Error al crear usuario.");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al procesar la solicitud.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* HEADER WITH TITLE & CREATE USER BUTTON */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.4rem", color: "white", fontFamily: "Outfit, sans-serif" }}>
            Comunidad de Usuarios & Roles
          </h1>
          <p style={{ opacity: 0.7, fontSize: "0.95rem", color: "var(--color-text-secondary)", margin: 0 }}>
            Gestiona permisos, roles (Super Admin, Admin, Personal de Puerta, Cliente) y crea accesos de equipo.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.4rem",
            borderRadius: "0.6rem",
            backgroundColor: "var(--color-magenta, #ec4899)",
            color: "white",
            fontWeight: 800,
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(236, 72, 153, 0.35)",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
        >
          <UserPlus size={18} /> + Crear Usuario / Personal
        </button>
      </div>

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
            ...(roleCounts.superadmin > 0 ? [{ id: "superadmin", label: `👑 Super Admin (${roleCounts.superadmin})` }] : []),
            { id: "admin", label: `Admin (${roleCounts.admin})` },
            { id: "scanner", label: `🚪 Puerta (${roleCounts.scanner})` },
            { id: "customer", label: `Clientes (${roleCounts.customer})` },
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
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "680px" }}>
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
                  const isSuperAdmin = user.role === "superadmin";
                  const isAdmin = user.role === "admin";
                  const isScanner = user.role === "scanner";
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr 
                      key={user.id} 
                      style={{ 
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        transition: "background-color 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.02)"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      {/* Column 1: User Info */}
                      <td style={{ padding: "1.1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{
                            width: "42px", height: "42px", borderRadius: "50%",
                            backgroundColor: isSuperAdmin ? "#eab308" : isAdmin ? "var(--color-magenta)" : isScanner ? "#06b6d4" : "rgba(255,255,255,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 800, color: isSuperAdmin ? "#000" : "white", overflow: "hidden", flexShrink: 0
                          }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              isSuperAdmin ? "👑" : isScanner ? "🚪" : (user.full_name || "U")[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "white", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              {user.full_name || "Sin Nombre"}
                              {isSuperAdmin && <span style={{ fontSize: "0.75rem", color: "#eab308" }}>👑</span>}
                              {isScanner && <span style={{ fontSize: "0.75rem", color: "#06b6d4" }}>🚪</span>}
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
                              <option value="superadmin">👑 Super Admin</option>
                              <option value="admin">Admin</option>
                              <option value="scanner">🚪 Puerta / Escáner</option>
                              <option value="customer">Customer (Cliente)</option>
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
                              letterSpacing: "0.05em",
                              backgroundColor: isSuperAdmin ? "rgba(234, 179, 8, 0.15)" :
                                              isAdmin ? "rgba(236, 72, 153, 0.15)" :
                                              isScanner ? "rgba(6, 182, 212, 0.15)" :
                                              "rgba(255, 255, 255, 0.08)",
                              color: isSuperAdmin ? "#eab308" :
                                     isAdmin ? "#ec4899" :
                                     isScanner ? "#06b6d4" :
                                     "rgba(255,255,255,0.7)",
                              border: `1px solid ${
                                isSuperAdmin ? "rgba(234, 179, 8, 0.3)" :
                                isAdmin ? "rgba(236, 72, 153, 0.3)" :
                                isScanner ? "rgba(6, 182, 212, 0.3)" :
                                "rgba(255, 255, 255, 0.1)"
                              }`
                            }}>
                              {isSuperAdmin && "👑 "}
                              {isScanner && "🚪 "}
                              {user.role ? (user.role === "scanner" ? "PUERTA" : user.role) : "CUSTOMER"}
                            </span>
                            <button
                              onClick={() => setEditingUserId(user.id)}
                              title="Cambiar rol"
                              style={{
                                background: "none",
                                border: "none",
                                color: "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                padding: "4px",
                                display: "flex",
                                alignItems: "center"
                              }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Active Status */}
                      <td style={{ padding: "1.1rem 1.25rem" }}>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.is_active)}
                          disabled={isPending}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: user.is_active ? "#22c55e" : "#ef4444"
                          }}
                        >
                          <span style={{
                            width: "8px", height: "8px", borderRadius: "50%",
                            backgroundColor: user.is_active ? "#22c55e" : "#ef4444",
                            boxShadow: `0 0 6px ${user.is_active ? "#22c55e" : "#ef4444"}`
                          }} />
                          {user.is_active ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      {/* Column 4: Date */}
                      <td style={{ padding: "1.1rem 1.25rem", color: "var(--color-text-secondary)", fontSize: "0.825rem" }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>

                      {/* Column 5: Actions */}
                      <td style={{ padding: "1.1rem 1.25rem", textAlign: "right" }}>
                        <Link
                          href={`/admin/users/${user.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.4rem 0.75rem",
                            borderRadius: "0.5rem",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "white",
                            textDecoration: "none",
                            fontSize: "0.78rem",
                            fontWeight: 700
                          }}
                        >
                          <Eye size={14} /> Ver Perfil
                        </Link>
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
          borderTop: "1px solid rgba(255,255,255,0.06)",
          color: "var(--color-text-secondary)",
          fontSize: "0.85rem"
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

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "520px",
            backgroundColor: "#111116",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)",
            overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ padding: "0.5rem", borderRadius: "0.5rem", backgroundColor: "rgba(236, 72, 153, 0.15)", color: "var(--color-magenta)" }}>
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "white" }}>
                    Crear Nuevo Usuario / Personal
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                    Acceso directo confirmado para staff de puerta, admins o clientes
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  padding: "0.25rem"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "0.4rem" }}>
                  Nombre Completo *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Puerta / Staff Taquilla"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "0.5rem",
                      color: "white",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "0.4rem" }}>
                  Correo Electrónico *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@bassfactory.co"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "0.5rem",
                      color: "white",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "0.4rem" }}>
                  Contraseña de Acceso * (Mínimo 6 caracteres)
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Contraseña segura"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.7rem 0.9rem 0.7rem 2.4rem",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: "0.5rem",
                      color: "white",
                      fontSize: "0.875rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", marginBottom: "0.4rem" }}>
                  Rol en la Plataforma *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 0.9rem",
                    backgroundColor: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "0.5rem",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    outline: "none"
                  }}
                >
                  <option value="scanner">🚪 Personal de Puerta / Escáner (Para recepción y lectura de QRs en eventos)</option>
                  <option value="admin">Admin (Acceso a eventos, ventas y configuración)</option>
                  <option value="superadmin">👑 Super Admin (Acceso total al sistema)</option>
                  <option value="customer">Cliente (Comprador común de boletas)</option>
                </select>
                <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>
                  {newRole === "scanner" 
                    ? "💡 Este usuario podrá ser seleccionado para escanear en la puerta de cualquier evento y no se mezclará con clientes." 
                    : newRole === "customer" 
                    ? "⚠️ Los usuarios con rol Cliente no podrán ser asignados a la puerta de los eventos." 
                    : "Acceso con privilegios de gestión en Bassfactory."}
                </p>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreating}
                  style={{
                    padding: "0.65rem 1.1rem",
                    borderRadius: "0.5rem",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isCreating}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.65rem 1.35rem",
                    borderRadius: "0.5rem",
                    backgroundColor: isCreating ? "rgba(236, 72, 153, 0.4)" : "var(--color-magenta)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    border: "none",
                    cursor: isCreating ? "not-allowed" : "pointer"
                  }}
                >
                  <UserPlus size={16} /> {isCreating ? "Creando..." : "Crear y Activar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
