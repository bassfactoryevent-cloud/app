import { createClient } from "@/utils/supabase/server";
import { UsersClient } from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const supabase = await createClient();

  // Fetch all profiles
  const { data: users, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return <div>Error loading users</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: "white" }}>
          Comunidad de Usuarios
        </h1>
        <p style={{ opacity: 0.7, fontSize: "1rem", color: "#e5e5e5" }}>
          Gestiona todos los clientes, djs y promotores registrados en la plataforma.
        </p>
      </div>

      <UsersClient initialUsers={users || []} />
    </div>
  );
}
