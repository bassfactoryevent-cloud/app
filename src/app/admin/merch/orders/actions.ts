"use server";

import { getAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

const adminDb = getAdminClient();

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
