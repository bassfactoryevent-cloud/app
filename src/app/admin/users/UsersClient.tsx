"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Eye } from "lucide-react";

export function UsersClient({ initialUsers }: { initialUsers: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = initialUsers.filter((u) => {
    const search = searchTerm.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(search)) ||
      (u.id && u.id.toLowerCase().includes(search)) ||
      (u.role && u.role.toLowerCase().includes(search))
    );
  });

  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
        <div style={{
          position: "relative",
          flex: 1,
          maxWidth: "400px"
        }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-secondary)" }} />
          <input
            type="text"
            placeholder="Buscar por nombre, ID o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "var(--radius-md)",
              color: "white",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: "var(--color-surface, #111)",
        border: "1px solid var(--color-border, #333)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border, #333)" }}>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Usuario</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Rol</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Estado</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem" }}>Registro</th>
                <th style={{ padding: "1rem", color: "var(--color-text-secondary)", fontWeight: 600, fontSize: "0.875rem", textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--color-border, #333)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          backgroundColor: "var(--color-magenta, #ff00ff)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: "bold", overflow: "hidden"
                        }}>
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            (user.full_name || "U")[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "white" }}>{user.full_name || "Sin Nombre"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>ID: {user.id.substring(0,8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: user.role === 'admin' || user.role === 'superadmin' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255,255,255,0.1)',
                        color: user.role === 'admin' || user.role === 'superadmin' ? '#ec4899' : 'white',
                        textTransform: "capitalize"
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.375rem",
                        fontSize: "0.875rem", color: user.is_active ? "#22c55e" : "#ef4444"
                      }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: user.is_active ? "#22c55e" : "#ef4444" }}></span>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--color-text-secondary)", fontSize: "0.875rem" }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <Link href={`/admin/users/${user.id}`} style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.5rem 1rem", backgroundColor: "rgba(255,255,255,0.05)",
                        borderRadius: "var(--radius-md)", color: "white", textDecoration: "none",
                        fontSize: "0.875rem", transition: "background-color 0.2s"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}>
                        <Eye size={16} /> Ver Perfil
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
