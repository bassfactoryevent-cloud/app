"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCampaign(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const client_name = formData.get("client_name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string || null;

  const { data, error } = await supabase.from("ad_campaigns").insert([{
    name,
    client_name,
    start_date,
    end_date: end_date ? end_date : null,
    is_active: true
  }]).select("id").single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/ads");
  redirect(`/admin/ads/${data.id}`);
}

export async function updateCampaign(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const client_name = formData.get("client_name") as string;
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string || null;
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase.from("ad_campaigns").update({
    name,
    client_name,
    start_date,
    end_date: end_date ? end_date : null,
    is_active
  }).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/ads");
  revalidatePath(`/admin/ads/${id}`);
}

export async function deleteCampaign(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ad_campaigns").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ads");
  redirect("/admin/ads");
}

export async function addAdToCampaign(campaignId: string, formData: FormData) {
  const supabase = await createClient();
  
  const placement_name = formData.get("placement_name") as string;
  const image_url = formData.get("image_url") as string;
  const target_url = formData.get("target_url") as string || null;

  // Find or create placement
  let placement_id;
  const { data: existingPlacement } = await supabase.from("ad_placements").select("id").eq("name", placement_name).single();
  
  if (existingPlacement) {
    placement_id = existingPlacement.id;
  } else {
    const { data: newPlacement, error: pError } = await supabase.from("ad_placements").insert([{ name: placement_name }]).select("id").single();
    if (pError) throw new Error(pError.message);
    placement_id = newPlacement.id;
  }

  const { error } = await supabase.from("ads").insert([{
    campaign_id: campaignId,
    placement_id,
    image_url,
    target_url,
    is_active: true
  }]);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/ads/${campaignId}`);
}

export async function deleteAd(adId: string, campaignId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").delete().eq("id", adId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/ads/${campaignId}`);
}

export async function updateAd(adId: string, campaignId: string, formData: FormData) {
  const supabase = await createClient();
  
  const placement_name = formData.get("placement_name") as string;
  const image_url = formData.get("image_url") as string;
  const target_url = formData.get("target_url") as string || null;

  // Find or create placement
  let placement_id;
  const { data: existingPlacement } = await supabase.from("ad_placements").select("id").eq("name", placement_name).single();
  
  if (existingPlacement) {
    placement_id = existingPlacement.id;
  } else {
    const { data: newPlacement, error: pError } = await supabase.from("ad_placements").insert([{ name: placement_name }]).select("id").single();
    if (pError) throw new Error(pError.message);
    placement_id = newPlacement.id;
  }

  const { error } = await supabase.from("ads").update({
    placement_id,
    image_url,
    target_url
  }).eq("id", adId);

  if (error) throw new Error(error.message);
  
  // Revalidate and redirect back to normal view
  revalidatePath(`/admin/ads/${campaignId}`);
  redirect(`/admin/ads/${campaignId}`);
}

export async function togglePlacementVip(placementName: string, isVip: boolean) {
  const supabase = await createClient();
  
  // Find or create placement (in case it doesn't exist yet but was hardcoded)
  let placement_id;
  const { data: existingPlacement } = await supabase.from("ad_placements").select("id").eq("name", placementName).single();
  
  if (existingPlacement) {
    const { error } = await supabase.from("ad_placements").update({ is_vip: isVip }).eq("id", existingPlacement.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ad_placements").insert([{ name: placementName, is_vip: isVip }]);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/ads");
}

export async function togglePlacementActive(placementName: string, isActive: boolean) {
  const supabase = await createClient();
  
  let placement_id;
  const { data: existingPlacement } = await supabase.from("ad_placements").select("id").eq("name", placementName).single();
  
  if (existingPlacement) {
    const { error } = await supabase.from("ad_placements").update({ is_active: isActive }).eq("id", existingPlacement.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("ad_placements").insert([{ name: placementName, is_active: isActive }]);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/ads");
}

export async function updateAdsOrder(orderedAds: { id: string, order_index: number }[]) {
  const supabase = await createClient();
  
  // Update each ad's order_index
  for (const ad of orderedAds) {
    const { error } = await supabase.from("ads").update({ order_index: ad.order_index }).eq("id", ad.id);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/ads");
}

export async function removeAdFromPlacement(adId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ads").delete().eq("id", adId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/ads");
}
