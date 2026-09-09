"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const validRoles = ["admin", "dj", "promoter", "customer"];
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
