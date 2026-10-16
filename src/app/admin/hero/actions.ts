"use server";

import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { HeroSlide, HeroV2Payload } from "@/types/hero";

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

export async function getHeroCatalog() {
  const adminDb = getAdminClient();

  const [eventsRes, merchRes, postsRes, adsRes] = await Promise.all([
    adminDb
      .from("events")
      .select("*")
      .eq("status", "published")
      .order("start_date", { ascending: true })
      .limit(30),
    adminDb
      .from("merch_products")
      .select("*, merch_product_images(image_url, is_primary, sort_order)")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30),
    adminDb
      .from("posts")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(30),
    adminDb
      .from("ads")
      .select("*, ad_campaigns(name, client_name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (eventsRes.error) console.error("Catalog events error:", eventsRes.error);
  if (merchRes.error) console.error("Catalog merch error:", merchRes.error);
  if (postsRes.error) console.error("Catalog posts error:", postsRes.error);
  if (adsRes.error) console.error("Catalog ads error:", adsRes.error);

  return {
    events: eventsRes.data || [],
    merch: merchRes.data || [],
    posts: postsRes.data || [],
    ads: adsRes.data || [],
  };
}

export async function saveHeroSlidesAction(input: {
  autoplayMs: number;
  slides: HeroSlide[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const validSlides = Array.isArray(input.slides) ? input.slides : [];
  if (validSlides.length === 0) {
    return { error: "Debes mantener al menos 1 slide en el banner principal." };
  }

  // Primary slide (first active slide, or first slide overall) mirrors to root columns
  const primarySlide =
    validSlides.find((s) => s.active && s.media_url?.trim()) || validSlides[0];

  const v2Payload: HeroV2Payload = {
    __hero_v2: true,
    autoplay_ms: Number(input.autoplayMs) || 6500,
    slides: validSlides,
  };

  const payload = {
    id: 1,
    media_type: primarySlide.media_type === "video" ? "video" : "image",
    media_url: (primarySlide.media_url || "").trim(),
    title: (primarySlide.title || "BASSFACTORY").trim(),
    subtitle: (primarySlide.subtitle || "").trim() || null,
    primary_button_text: (primarySlide.primary_button_text || "").trim() || null,
    primary_button_url: (primarySlide.primary_button_url || "").trim() || null,
    secondary_button_text: (primarySlide.secondary_button_text || "").trim() || null,
    secondary_button_url: (primarySlide.secondary_button_url || "").trim() || null,
    tags: v2Payload as any,
    updated_at: new Date().toISOString(),
  };

  const { error } = await adminDb
    .from("hero_settings")
    .upsert(payload, { onConflict: "id" });

  if (error) {
    console.error("Error saving hero slides:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/hero");
  return { success: true };
}

export async function updateHeroSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    media_url: ((formData.get("media_url") as string) || "").trim(),
    title: ((formData.get("title") as string) || "").trim(),
    subtitle: ((formData.get("subtitle") as string) || "").trim() || null,
    primary_button_text:
      ((formData.get("primary_button_text") as string) || "").trim() || null,
    primary_button_url:
      ((formData.get("primary_button_url") as string) || "").trim() || null,
    secondary_button_text:
      ((formData.get("secondary_button_text") as string) || "").trim() || null,
    secondary_button_url:
      ((formData.get("secondary_button_url") as string) || "").trim() || null,
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
