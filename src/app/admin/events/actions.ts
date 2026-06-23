"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDj(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const soundcloud_url = formData.get("soundcloud_url") as string;
  const photo_url = formData.get("photo_url") as string;

  const { error } = await supabase.from("djs").insert([{ name, soundcloud_url, photo_url }]);

  if (error) {
    console.error("Error creating DJ:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/djs");
}

export async function deleteDj(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("djs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/djs");
}

export async function createSponsor(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const logo_url = formData.get("logo_url") as string;
  const website_url = formData.get("website_url") as string;

  const { error } = await supabase.from("sponsors").insert([{ name, logo_url, website_url }]);

  if (error) {
    console.error("Error creating Sponsor:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/sponsors");
}

export async function deleteSponsor(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/sponsors");
}

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const cover_image = formData.get("cover_image") as string;
  
  const location_name = formData.get("location_name") as string;
  const location_address = formData.get("location_address") as string;
  
  const start_date = formData.get("start_date") ? new Date(formData.get("start_date") as string).toISOString() : null;
  const end_date = formData.get("end_date") ? new Date(formData.get("end_date") as string).toISOString() : null;
  
  const is_free = formData.get("is_free") === "on";
  const total_capacity = formData.get("total_capacity") ? parseInt(formData.get("total_capacity") as string, 10) : null;
  const status = formData.get("status") as string || "draft";

  const { data: event, error } = await supabase.from("events").insert([
    {
      title,
      slug,
      description,
      cover_image: cover_image || null,
      start_date,
      end_date,
      location_name,
      location_address,
      is_free,
      total_capacity,
      status
    }
  ]).select("id").single();

  if (error) {
    console.error("Error creating Event:", error);
    throw new Error(error.message);
  }

  // Si se crearon tickets (lo hacemos por JSON escondido o inputs múltiples en el front)
  const ticketsJson = formData.get("tickets_json") as string;
  if (ticketsJson && event) {
    try {
      const tickets = JSON.parse(ticketsJson);
      if (tickets.length > 0) {
        const ticketInserts = tickets.map((t: any) => ({
          event_id: event.id,
          name: t.name,
          price: parseFloat(t.price),
          quantity_available: parseInt(t.quantity, 10),
        }));
        await supabase.from("ticket_tiers").insert(ticketInserts);
      }
    } catch (e) {
      console.error("Error parsing tickets JSON", e);
    }
  }

  // DJs (Lineup)
  const djsJson = formData.get("djs_json") as string;
  if (djsJson && event) {
    try {
      const djs = JSON.parse(djsJson);
      if (djs.length > 0) {
        const djInserts = djs.map((djId: string, index: number) => ({
          event_id: event.id,
          dj_id: djId,
          sort_order: index
        }));
        await supabase.from("event_djs").insert(djInserts);
      }
    } catch (e) {
      console.error("Error parsing DJs JSON", e);
    }
  }

  // Sponsors
  const sponsorsJson = formData.get("sponsors_json") as string;
  if (sponsorsJson && event) {
    try {
      const sponsors = JSON.parse(sponsorsJson);
      if (sponsors.length > 0) {
        const sponsorInserts = sponsors.map((sId: string) => ({
          event_id: event.id,
          sponsor_id: sId
        }));
        await supabase.from("event_sponsors").insert(sponsorInserts);
      }
    } catch (e) {
      console.error("Error parsing Sponsors JSON", e);
    }
  }

  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/events");
  revalidatePath("/events");
}
