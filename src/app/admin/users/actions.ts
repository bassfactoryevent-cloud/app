"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

const adminDb = getAdminClient();

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const validRoles = ["superadmin", "admin", "scanner", "customer"];
    if (!validRoles.includes(newRole)) {
      return { success: false, error: "Rol no válido" };
    }

    // 1. Guardar rol en metadata de auth
    try {
      await adminDb.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      });
    } catch (authErr) {
      console.warn("Notice: could not update auth metadata:", authErr);
    }

    // 2. Actualizar en profiles
    if (newRole === "scanner") {
      const { error: scannerErr } = await adminDb
        .from("profiles")
        .update({ role: "scanner", updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (scannerErr) {
        // Fallback a 'customer' en la columna enum de Postgres si no admite 'scanner'
        await adminDb
          .from("profiles")
          .update({ role: "customer", updated_at: new Date().toISOString() })
          .eq("id", userId);
      }
    } else {
      const { error } = await adminDb
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;
    }

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

export async function createUserAction(formData: {
  full_name: string;
  email: string;
  password: string;
  role: string;
}) {
  try {
    const { full_name, email, password, role } = formData;
    if (!email || !password || !full_name) {
      return { success: false, error: "Nombre, correo y contraseña son obligatorios." };
    }
    if (password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres." };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = full_name.trim();

    // 1. Crear usuario en Auth de Supabase con confirmación automática
    const { data: authData, error: authError } = await adminDb.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: role
      }
    });

    if (authError || !authData?.user) {
      return { success: false, error: authError?.message || "Error al crear usuario en Supabase Auth." };
    }

    const newUserId = authData.user.id;

    // 2. Insertar o actualizar en tabla profiles
    try {
      if (role === "scanner") {
        const { error: testErr } = await adminDb.from("profiles").upsert({
          id: newUserId,
          full_name: cleanName,
          role: "scanner",
          is_active: true,
          updated_at: new Date().toISOString()
        });

        if (testErr) {
          // Fallback a 'customer' en la columna enum de Postgres si no admite 'scanner'
          await adminDb.from("profiles").upsert({
            id: newUserId,
            full_name: cleanName,
            role: "customer",
            is_active: true,
            updated_at: new Date().toISOString()
          });
        }
      } else {
        await adminDb.from("profiles").upsert({
          id: newUserId,
          full_name: cleanName,
          role: role,
          is_active: true,
          updated_at: new Date().toISOString()
        });
      }
    } catch (profErr) {
      console.warn("Profile upsert notice:", profErr);
    }

    revalidatePath("/admin/users");
    return {
      success: true,
      user: {
        id: newUserId,
        full_name: cleanName,
        email: cleanEmail,
        role: role,
        is_active: true,
        created_at: new Date().toISOString()
      }
    };
  } catch (err: any) {
    console.error("Error creating user:", err);
    return { success: false, error: err.message || "Error interno al crear usuario." };
  }
}
