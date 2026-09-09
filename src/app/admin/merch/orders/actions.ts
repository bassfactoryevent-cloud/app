"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYnJuYmxua211b3BtZmZzbHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTgyODI5MCwiZXhwIjoyMDk3NDA0MjkwfQ.Hrtb8b9vXue5iViHapphzb1kqkEu-DaDBp-D-uHmzKA";
const adminDb = createAdminClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const { error } = await adminDb
      .from("merch_orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/admin/merch/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating order status:", err);
    return { success: false, error: err.message || "Error al actualizar el estado" };
  }
}

export async function updateOrderTracking(orderId: string, trackingNumber: string) {
  try {
    const { error } = await adminDb
      .from("merch_orders")
      .update({ 
        tracking_number: trackingNumber.trim(), 
        status: "shipped", 
        updated_at: new Date().toISOString() 
      })
      .eq("id", orderId);

    if (error) throw error;

    revalidatePath("/admin/merch/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating tracking number:", err);
    return { success: false, error: err.message || "Error al guardar la guía de rastreo" };
  }
}
