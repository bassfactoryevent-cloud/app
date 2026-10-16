"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getHeroSettings() {
  const adminDb = getAdminClient();
  const { data, error } = await adminDb
    .from("hero_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching hero settings:", error);
    return null;
  }
  return data;
}

export async function updateHeroSettings(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "No autorizado" };
  }

  const adminDb = getAdminClient();
  const { data: profile } = await adminDb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
    return { error: "No tienes permisos para modificar el banner principal" };
  }
  
  const tagsJson = formData.get("tags") as string;
  let tags = [];
  if (tagsJson) {
    try {
      tags = JSON.parse(tagsJson);
    } catch (e) {
      console.error("Invalid tags JSON");
    }
  }

  const payload = {
    id: 1,
    media_type: (formData.get("media_type") as string) || "image",
    media_url: (formData.get("media_url") as string || "").trim(),
    title: (formData.get("title") as string || "").trim(),
    subtitle: (formData.get("subtitle") as string || "").trim() || null,
    primary_button_text: (formData.get("primary_button_text") as string || "").trim() || null,
    primary_button_url: (formData.get("primary_button_url") as string || "").trim() || null,
    secondary_button_text: (formData.get("secondary_button_text") as string || "").trim() || null,
    secondary_button_url: (formData.get("secondary_button_url") as string || "").trim() || null,
    tags: tags,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminDb
    .from("hero_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Error updating hero settings:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { success: true };
}
