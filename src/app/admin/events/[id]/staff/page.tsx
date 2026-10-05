import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { notFound, redirect } from "next/navigation";
import { getAssignmentsForEvent } from "@/utils/staffAssignments";
import StaffManagementClient from "./StaffManagementClient";

export const dynamic = "force-dynamic";

export default async function EventStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminDb = getAdminClient();

  const { data: profile } = await adminDb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
    redirect("/account");
  }

  const [
    { data: event },
    assignments,
    { data: profiles },
    { data: authUsers }
  ] = await Promise.all([
    adminDb.from("events").select("id, title").eq("id", id).single(),
    getAssignmentsForEvent(id),
    adminDb.from("profiles").select("id, full_name, role").order("created_at", { ascending: false }),
    adminDb.auth.admin.listUsers()
  ]);

  if (!event) {
    notFound();
  }

  const emailMap = new Map((authUsers?.users || []).map((u) => [u.id, u.email]));
  const metaRoleMap = new Map((authUsers?.users || []).map((u) => [u.id, u.user_metadata?.role]));

  // Solo incluir usuarios con rol de puerta, admin o superadmin (NUNCA clientes normales)
  const availableUsers = (profiles || [])
    .map((p: any) => {
      const metaRole = metaRoleMap.get(p.id);
      const effectiveRole = metaRole === "scanner" ? "scanner" : (p.role || "customer");
      return {
        id: p.id,
        full_name: p.full_name,
        email: emailMap.get(p.id) || "",
        role: effectiveRole,
      };
    })
    .filter((u: any) => u.role !== "customer");

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <StaffManagementClient
        eventId={id}
        eventTitle={event.title}
        initialAssignments={assignments}
        availableUsers={availableUsers}
      />
    </div>
  );
}
