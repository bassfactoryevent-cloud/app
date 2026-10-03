import { getAdminClient } from "@/utils/supabase/admin";
import { UsersClient } from "./UsersClient";

export const dynamic = "force-dynamic";

const adminDb = getAdminClient();

export default async function UsersPage() {
  // 1. Obtener perfiles
  const { data: profiles, error } = await adminDb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
  }

  // 2. Obtener correos de auth.users para enriquecer la tabla
  let usersWithEmail = profiles || [];
  try {
    const { data: authUsers } = await adminDb.auth.admin.listUsers();
    if (authUsers?.users) {
      const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));
      usersWithEmail = (profiles || []).map((p: any) => ({
        ...p,
        email: emailMap.get(p.id) || null
      }));
    }
  } catch (authErr) {
    console.error("Error fetching auth users emails:", authErr);
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem", color: "white", fontFamily: "Outfit, sans-serif" }}>
          Comunidad de Usuarios & Roles
        </h1>
        <p style={{ opacity: 0.7, fontSize: "1rem", color: "var(--color-text-secondary)" }}>
          Gestiona permisos, roles (Admin, DJ, Promotor, Cliente) y estados de acceso en la plataforma.
        </p>
      </div>

      <UsersClient initialUsers={usersWithEmail} />
    </div>
  );
}
