"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

const adminDb = getAdminClient();

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const validRoles = ["superadmin", "admin", "dj", "promoter", "customer"];
    if (!validRoles.includes(newRole)) {
      return { success: false, error: "Rol no válido" };
    }

    const { error } = await adminDb
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating user role:", err);
    return { success: false, error: err.message || "Error al actualizar el rol" };
  }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
  try {
    const { error } = await adminDb
      .from("profiles")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    console.error("Error toggling user status:", err);
    return { success: false, error: err.message || "Error al actualizar estado" };
  }
}
