"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { PlatformSettingsData, defaultSettings } from "./types";

const adminDb = getAdminClient();

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
      dev_fee_per_ticket: formData.get("dev_fee_per_ticket") !== null ? Number(formData.get("dev_fee_per_ticket")) : current.dev_fee_per_ticket,
      dev_fee_merch_percent: formData.get("dev_fee_merch_percent") !== null ? Number(formData.get("dev_fee_merch_percent")) : current.dev_fee_merch_percent,
      dev_fee_ads_percent: formData.get("dev_fee_ads_percent") !== null ? Number(formData.get("dev_fee_ads_percent")) : current.dev_fee_ads_percent,
      vercel_bandwidth_alert_gb: formData.get("vercel_bandwidth_alert_gb") !== null ? Number(formData.get("vercel_bandwidth_alert_gb")) : current.vercel_bandwidth_alert_gb,
      supabase_storage_alert_mb: formData.get("supabase_storage_alert_mb") !== null ? Number(formData.get("supabase_storage_alert_mb")) : current.supabase_storage_alert_mb,
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
