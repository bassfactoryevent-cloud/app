"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  assignUserToEvent, 
  toggleAssignmentStatus, 
  removeAssignment, 
  getAssignmentsForEvent 
} from "@/utils/staffAssignments";

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single();

  const isAllowed = profile?.role === "admin" || profile?.role === "superadmin" || user.email === "admin@admin.com";
  if (!isAllowed) throw new Error("Acceso denegado: Se requieren permisos administrativos.");

  return { user, profile };
}

export async function addStaffToEventAction(eventId: string, userId: string) {
  const { user } = await verifyAdmin();
  const res = await assignUserToEvent(eventId, userId, user.email || "Admin");
  revalidatePath(`/admin/events/${eventId}/staff`);
  revalidatePath(`/admin/events/${eventId}/dashboard`);
  revalidatePath("/scanner");
  return res;
}

export async function toggleStaffStatusAction(assignmentId: string, isActive: boolean, eventId: string) {
  await verifyAdmin();
  const res = await toggleAssignmentStatus(assignmentId, isActive);
  revalidatePath(`/admin/events/${eventId}/staff`);
  revalidatePath(`/admin/events/${eventId}/dashboard`);
  revalidatePath("/scanner");
  return res;
}

export async function removeStaffAction(assignmentId: string, eventId: string) {
  await verifyAdmin();
  const res = await removeAssignment(assignmentId);
  revalidatePath(`/admin/events/${eventId}/staff`);
  revalidatePath(`/admin/events/${eventId}/dashboard`);
  revalidatePath("/scanner");
  return res;
}
