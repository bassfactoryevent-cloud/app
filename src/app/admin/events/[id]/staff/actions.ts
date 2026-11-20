"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { 
  assignUserToEvent, 
  toggleAssignmentStatus, 
  removeAssignment, 
} from "@/utils/staffAssignments";

const adminDb = getAdminClient();

async function verifyAdmin(): Promise<{
  allowed: boolean;
  user?: any;
  profile?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { allowed: false, error: "No autenticado. Inicia sesión nuevamente." };
    }

    const { data: profile } = await adminDb
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const metaRole = user.user_metadata?.role;
    const isAllowed =
      profile?.role === "admin" ||
      profile?.role === "superadmin" ||
      metaRole === "admin" ||
      metaRole === "superadmin" ||
      user.email === "admin@admin.com";

    if (!isAllowed) {
      return {
        allowed: false,
        error: "Acceso denegado: Se requieren permisos administrativos.",
      };
    }

    return { allowed: true, user, profile };
  } catch (err: any) {
    return {
      allowed: false,
      error: err?.message || "Error al verificar permisos de administrador.",
    };
  }
}

export async function addStaffToEventAction(eventId: string, userId: string) {
  try {
    const auth = await verifyAdmin();
    if (!auth.allowed || !auth.user) {
      return { success: false, error: auth.error || "No autorizado" };
    }
    const res = await assignUserToEvent(eventId, userId, auth.user.email || "Admin");
    revalidatePath(`/admin/events/${eventId}/staff`);
    revalidatePath(`/admin/events/${eventId}/dashboard`);
    revalidatePath("/scanner");
    return res;
  } catch (err: any) {
    console.error("Error in addStaffToEventAction:", err);
    return { success: false, error: err?.message || "Error al asignar personal a la puerta." };
  }
}

export async function toggleStaffStatusAction(assignmentId: string, isActive: boolean, eventId: string) {
  try {
    const auth = await verifyAdmin();
    if (!auth.allowed) {
      return { success: false, error: auth.error || "No autorizado" };
    }
    const res = await toggleAssignmentStatus(assignmentId, isActive);
    revalidatePath(`/admin/events/${eventId}/staff`);
    revalidatePath(`/admin/events/${eventId}/dashboard`);
    revalidatePath("/scanner");
    return res;
  } catch (err: any) {
    console.error("Error in toggleStaffStatusAction:", err);
    return { success: false, error: err?.message || "Error al cambiar estado del personal." };
  }
}

export async function removeStaffAction(assignmentId: string, eventId: string) {
  try {
    const auth = await verifyAdmin();
    if (!auth.allowed) {
      return { success: false, error: auth.error || "No autorizado" };
    }
    const res = await removeAssignment(assignmentId);
    revalidatePath(`/admin/events/${eventId}/staff`);
    revalidatePath(`/admin/events/${eventId}/dashboard`);
    revalidatePath("/scanner");
    return res;
  } catch (err: any) {
    console.error("Error in removeStaffAction:", err);
    return { success: false, error: err?.message || "Error al eliminar asignación." };
  }
}
