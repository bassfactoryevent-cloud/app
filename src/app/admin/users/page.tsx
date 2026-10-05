import { getAdminClient } from "@/utils/supabase/admin";
import { UsersClient } from "./UsersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
  const adminDb = getAdminClient();
  // 1. Obtener perfiles
  const { data: profiles, error } = await adminDb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
  }

  // 2. Obtener correos y roles de auth.users para enriquecer la tabla
  let usersWithEmail = profiles || [];
  try {
    const { data: authUsers } = await adminDb.auth.admin.listUsers();
    if (authUsers?.users) {
      const emailMap = new Map(authUsers.users.map(u => [u.id, u.email]));
      const metaRoleMap = new Map(authUsers.users.map(u => [u.id, u.user_metadata?.role]));
      usersWithEmail = (profiles || []).map((p: any) => {
        const metaRole = metaRoleMap.get(p.id);
        const effectiveRole = metaRole === "scanner" ? "scanner" : (p.role || "customer");
        return {
          ...p,
          email: emailMap.get(p.id) || (p.role === "superadmin" || p.id === "afd1c477-11a5-4c47-b6f3-568556bfaa93" ? "admin@admin.com" : null),
          role: effectiveRole
        };
      });
    }
  } catch (authErr) {
    console.error("Error fetching auth users emails:", authErr);
    usersWithEmail = (profiles || []).map((p: any) => ({
      ...p,
      email: p.role === "superadmin" || p.id === "afd1c477-11a5-4c47-b6f3-568556bfaa93" ? "admin@admin.com" : null
    }));
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "4rem" }}>
      <UsersClient initialUsers={usersWithEmail} />
    </div>
  );
}
