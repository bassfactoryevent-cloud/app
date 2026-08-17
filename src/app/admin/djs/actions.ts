"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDj(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const photo_url = formData.get("photo_url") as string;
  const soundcloud_url = formData.get("soundcloud_url") as string;
  const type = formData.get("type") as string;
  const collective_name = formData.get("collective_name") as string;
  
  const payload: any = {
    name,
    photo_url,
    soundcloud_url,
    type
  };

  if (type === 'invitado') {
    payload.collective_name = collective_name;
  } else {
    // Para colectivo, generamos el slug a partir del nombre
    payload.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  const { data, error } = await supabase.from("djs").insert([payload]).select().single();

  if (error) {
    console.error("Error creating DJ:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/djs");
  
  if (type === 'colectivo' && data?.id) {
    redirect(`/admin/djs/${data.id}`);
  }
}

export async function updateDjEPK(id: string, formData: FormData) {
  const supabase = await createClient();
  
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const photo_url = formData.get("photo_url") as string;
  const cover_image = formData.get("cover_image") as string;
  const bio_short = formData.get("bio_short") as string;
  const bio_full = formData.get("bio_full") as string;
  const tech_rider_url = formData.get("tech_rider_url") as string;
  const contact_email = formData.get("contact_email") as string;
  const contact_phone = formData.get("contact_phone") as string;
  
  const social_instagram = formData.get("social_instagram") as string;
  const social_tiktok = formData.get("social_tiktok") as string;
  const social_facebook = formData.get("social_facebook") as string;
  const social_x = formData.get("social_x") as string;
  
  const music_spotify = formData.get("music_spotify") as string;
  const soundcloud_url = formData.get("soundcloud_url") as string;
  const music_beatport = formData.get("music_beatport") as string;
  const music_apple = formData.get("music_apple") as string;
  const music_youtube = formData.get("music_youtube") as string;

  const press_photos_json = formData.get("press_photos") as string;
  let press_photos: string[] = [];
  try {
    if (press_photos_json) {
      press_photos = JSON.parse(press_photos_json);
    }
  } catch(e) {}

  const external_bookings_json = formData.get("external_bookings") as string;
  let external_bookings: any[] = [];
  try {
    if (external_bookings_json) {
      external_bookings = JSON.parse(external_bookings_json);
    }
  } catch(e) {}

  const payload = {
    name,
    slug,
    photo_url,
    cover_image,
    bio_short,
    bio_full,
    tech_rider_url,
    contact_email,
    contact_phone,
    social_instagram,
    social_tiktok,
    social_facebook,
    social_x,
    music_spotify,
    soundcloud_url,
    music_beatport,
    music_apple,
    music_youtube,
    press_photos,
    external_bookings
  };

  const { error } = await supabase.from("djs").update(payload).eq("id", id);

  if (error) {
    console.error("Error updating DJ:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/djs");
  revalidatePath(`/admin/djs/${id}`);
  revalidatePath(`/djs/${slug}`);
  revalidatePath("/djs");
}

export async function deleteDj(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("djs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/djs");
}
