"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { PlatformSettingsData, defaultSettings } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function getPlatformSettings(): Promise<PlatformSettingsData> {
  try {
    const { data } = await adminDb
      .from("ad_placements")
      .select("description")
      .eq("name", "platform_settings")
      .maybeSingle();

    if (data?.description) {
      const parsed = JSON.parse(data.description);
      return { ...defaultSettings, ...parsed };
    }
  } catch (e) {
    console.error("Error reading platform settings:", e);
  }
  return defaultSettings;
}

export async function updatePlatformSettings(formData: FormData) {
  try {
    const current = await getPlatformSettings();

    const updated: PlatformSettingsData = {
      company_name: (formData.get("company_name") as string) || current.company_name,
      company_nit: (formData.get("company_nit") as string) || current.company_nit,
      company_email: (formData.get("company_email") as string) || current.company_email,
      support_email: (formData.get("support_email") as string) || current.support_email,
      support_phone: (formData.get("support_phone") as string) || current.support_phone,
      address: (formData.get("address") as string) || current.address,
      invoice_prefix: (formData.get("invoice_prefix") as string) || current.invoice_prefix,
      shipping_cost: Number(formData.get("shipping_cost")) || 0,
      free_shipping_threshold: Number(formData.get("free_shipping_threshold")) || 0,
      delivery_time_text: (formData.get("delivery_time_text") as string) || current.delivery_time_text,
      is_merch_enabled: formData.get("is_merch_enabled") === "on",
      ticket_activation_hours: Number(formData.get("ticket_activation_hours")) || 24,
      transfer_limit_hours: Number(formData.get("transfer_limit_hours")) || 48,
      max_tickets_per_order: Number(formData.get("max_tickets_per_order")) || 6,
      is_tickets_enabled: formData.get("is_tickets_enabled") === "on",
      social_instagram: (formData.get("social_instagram") as string) || current.social_instagram,
      social_tiktok: (formData.get("social_tiktok") as string) || current.social_tiktok,
      social_youtube: (formData.get("social_youtube") as string) || current.social_youtube,
      social_twitter: (formData.get("social_twitter") as string) || current.social_twitter,
      social_whatsapp: (formData.get("social_whatsapp") as string) || current.social_whatsapp,
      site_title: (formData.get("site_title") as string) || current.site_title,
      site_description: (formData.get("site_description") as string) || current.site_description,
      site_keywords: (formData.get("site_keywords") as string) || current.site_keywords,
    };

    const jsonString = JSON.stringify(updated);

    // Check if row exists
    const { data: existing } = await adminDb
      .from("ad_placements")
      .select("id")
      .eq("name", "platform_settings")
      .maybeSingle();

    if (existing) {
      await adminDb
        .from("ad_placements")
        .update({ description: jsonString, is_active: true })
        .eq("name", "platform_settings");
    } else {
      await adminDb
        .from("ad_placements")
        .insert([{ name: "platform_settings", description: jsonString, is_active: true }]);
    }

    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true, message: "Ajustes actualizados correctamente" };
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return { success: false, error: error.message || "Error al guardar ajustes" };
  }
}
