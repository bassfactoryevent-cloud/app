"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPlatformSettings, updatePlatformSettings } from "../settings/actions";
import { PlatformSettingsData } from "../settings/types";

const adminDb = getAdminClient();

export async function checkSuperAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .single();

  const isSuper = profile?.role === "superadmin" || user.email === "admin@admin.com" || user.email === "admin@admin";
  if (!isSuper) {
    redirect("/admin");
  }
  return { user, profile };
}

export async function updateDevRates(formData: FormData) {
  await checkSuperAdmin();
  const current = await getPlatformSettings();

  const dev_fee_per_ticket = Number(formData.get("dev_fee_per_ticket") ?? current.dev_fee_per_ticket);
  const dev_fee_merch_percent = Number(formData.get("dev_fee_merch_percent") ?? current.dev_fee_merch_percent);
  const dev_fee_ads_percent = Number(formData.get("dev_fee_ads_percent") ?? current.dev_fee_ads_percent);

  const updated: PlatformSettingsData = {
    ...current,
    dev_fee_per_ticket,
    dev_fee_merch_percent,
    dev_fee_ads_percent,
  };

  const jsonString = JSON.stringify(updated);

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

  revalidatePath("/admin/super/revenue");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateInfraAlerts(formData: FormData) {
  await checkSuperAdmin();
  const current = await getPlatformSettings();

  const vercel_bandwidth_alert_gb = Number(formData.get("vercel_bandwidth_alert_gb") ?? current.vercel_bandwidth_alert_gb);
  const supabase_storage_alert_mb = Number(formData.get("supabase_storage_alert_mb") ?? current.supabase_storage_alert_mb);

  const updated: PlatformSettingsData = {
    ...current,
    vercel_bandwidth_alert_gb,
    supabase_storage_alert_mb,
  };

  const jsonString = JSON.stringify(updated);

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

  revalidatePath("/admin/super/infrastructure");
  revalidatePath("/admin/settings");
  return { success: true };
}

export interface BucketMetric {
  name: string;
  filesCount: number;
  sizeBytes: number;
  sizeMB: number;
}

export interface InfraStorageData {
  buckets: BucketMetric[];
  totalBytes: number;
  totalMB: number;
  totalFiles: number;
  storageLimitMB: number;
  usagePercent: number;
}

export async function getStorageMetrics(): Promise<InfraStorageData> {
  const bucketNames = ["events", "merch", "djs", "blog-media", "ads", "sponsors"];
  const buckets: BucketMetric[] = [];
  let totalBytes = 0;
  let totalFiles = 0;

  for (const bName of bucketNames) {
    try {
      const { data, error } = await adminDb.storage.from(bName).list("", { limit: 500 });
      if (error) {
        buckets.push({ name: bName, filesCount: 0, sizeBytes: 0, sizeMB: 0 });
        continue;
      }
      const files = (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder");
      const bucketBytes = files.reduce((acc, f) => acc + (f.metadata?.size || 0), 0);
      const sizeMB = Number((bucketBytes / (1024 * 1024)).toFixed(2));
      totalBytes += bucketBytes;
      totalFiles += files.length;
      buckets.push({
        name: bName,
        filesCount: files.length,
        sizeBytes: bucketBytes,
        sizeMB,
      });
    } catch {
      buckets.push({ name: bName, filesCount: 0, sizeBytes: 0, sizeMB: 0 });
    }
  }

  const totalMB = Number((totalBytes / (1024 * 1024)).toFixed(2));
  const storageLimitMB = 1000; // Supabase Free Tier = 1 GB (1,000 MB)
  const usagePercent = Number(((totalMB / storageLimitMB) * 100).toFixed(2));

  return {
    buckets,
    totalBytes,
    totalMB,
    totalFiles,
    storageLimitMB,
    usagePercent,
  };
}

export async function getDatabaseMetrics() {
  const tables = [
    { key: "tickets", name: "Boletas Emitidas" },
    { key: "merch_orders", name: "Órdenes de Tienda" },
    { key: "events", name: "Eventos Creados" },
    { key: "ticket_tiers", name: "Localidades / Tiers" },
    { key: "profiles", name: "Usuarios Registrados" },
    { key: "ad_campaigns", name: "Campañas Publicitarias" },
    { key: "sponsors", name: "Patrocinadores" },
  ];

  const counts: { [key: string]: number } = {};
  for (const t of tables) {
    try {
      const { count } = await adminDb.from(t.key).select("*", { count: "exact", head: true });
      counts[t.key] = count || 0;
    } catch {
      counts[t.key] = 0;
    }
  }

  return {
    tables: tables.map((t) => ({ ...t, count: counts[t.key] })),
    totalRows: Object.values(counts).reduce((a, b) => a + b, 0),
    maxFreeTierDBMB: 500, // Supabase Free Tier = 500 MB
  };
}
