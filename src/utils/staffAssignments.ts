import { getAdminClient } from "./supabase/admin";

export interface StaffAssignment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  event_id: string;
  event_title: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by: string;
}

const adminDb = getAdminClient();
const PLACEMENT_NAME = "event_staff_assignments";

export async function getAllStaffAssignments(): Promise<StaffAssignment[]> {
  try {
    const { data } = await adminDb
      .from("ad_placements")
      .select("description")
      .eq("name", PLACEMENT_NAME)
      .maybeSingle();

    if (data?.description) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading staff assignments:", err);
  }
  return [];
}

export async function saveStaffAssignments(assignments: StaffAssignment[]) {
  const jsonString = JSON.stringify(assignments);

  const { data: existing } = await adminDb
    .from("ad_placements")
    .select("id")
    .eq("name", PLACEMENT_NAME)
    .maybeSingle();

  if (existing) {
    await adminDb
      .from("ad_placements")
      .update({ description: jsonString, is_active: true })
      .eq("name", PLACEMENT_NAME);
  } else {
    await adminDb
      .from("ad_placements")
      .insert([{ name: PLACEMENT_NAME, description: jsonString, is_active: true }]);
  }
}

export async function getAssignmentsForEvent(eventId: string): Promise<StaffAssignment[]> {
  const all = await getAllStaffAssignments();
  return all.filter((a) => a.event_id === eventId);
}

export async function getAssignmentsForUser(userId: string): Promise<StaffAssignment[]> {
  const all = await getAllStaffAssignments();
  return all.filter((a) => a.user_id === userId);
}

export async function assignUserToEvent(eventId: string, userId: string, assignedBy = "Admin"): Promise<{ success: boolean; error?: string }> {
  try {
    const [all, { data: userProfile }, { data: event }] = await Promise.all([
      getAllStaffAssignments(),
      adminDb.from("profiles").select("id, full_name, role").eq("id", userId).single(),
      adminDb.from("events").select("id, title").eq("id", eventId).single(),
    ]);

    if (!userProfile) return { success: false, error: "Usuario no encontrado" };
    if (!event) return { success: false, error: "Evento no encontrado" };

    // Get email from auth.users
    let userEmail = "";
    try {
      const { data: authData } = await adminDb.auth.admin.getUserById(userId);
      userEmail = authData?.user?.email || "";
    } catch {
      userEmail = "";
    }

    // Check if already assigned
    const exists = all.find((a) => a.event_id === eventId && a.user_id === userId);
    if (exists) {
      // If it exists, reactivate it if inactive
      if (!exists.is_active) {
        exists.is_active = true;
        await saveStaffAssignments(all);
      }
      return { success: true };
    }

    // Add new assignment
    const newAssignment: StaffAssignment = {
      id: crypto.randomUUID(),
      user_id: userId,
      user_name: userProfile.full_name || "Personal de Puerta",
      user_email: userEmail,
      event_id: eventId,
      event_title: event.title,
      is_active: true,
      assigned_at: new Date().toISOString(),
      assigned_by: assignedBy,
    };

    all.push(newAssignment);
    await saveStaffAssignments(all);

    // Also ensure user has at least 'scanner' role in auth metadata & profile
    if (userProfile.role === "customer" || !userProfile.role) {
      try {
        await adminDb.auth.admin.updateUserById(userId, { user_metadata: { role: "scanner" } });
        await adminDb.from("profiles").update({ role: "scanner" }).eq("id", userId);
      } catch {
        // Safe fallback if enum restricts it
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error assigning staff to event:", err);
    return { success: false, error: err.message };
  }
}

export async function toggleAssignmentStatus(assignmentId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await getAllStaffAssignments();
    const target = all.find((a) => a.id === assignmentId);
    if (target) {
      target.is_active = isActive;
      await saveStaffAssignments(all);
      return { success: true };
    }
    return { success: false, error: "Asignación no encontrada" };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function removeAssignment(assignmentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await getAllStaffAssignments();
    const filtered = all.filter((a) => a.id !== assignmentId);
    await saveStaffAssignments(filtered);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function isUserAllowedToScanEvent(userId: string, userRole: string, eventId: string): Promise<boolean> {
  // Superadmin and Admin have universal access
  if (userRole === "superadmin" || userRole === "admin") {
    return true;
  }

  // Scanner or Promoter must have an ACTIVE explicit assignment
  const assignments = await getAssignmentsForUser(userId);
  const activeAssignment = assignments.find((a) => a.event_id === eventId && a.is_active === true);

  return Boolean(activeAssignment);
}
