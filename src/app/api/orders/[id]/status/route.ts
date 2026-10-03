import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    if (!orderId || orderId.length < 10) {
      return NextResponse.json({ error: "ID de orden inválido" }, { status: 400 });
    }

    const db = getAdminClient();
    const { data: order, error } = await db
      .from("merch_orders")
      .select("id, status, updated_at")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      status: order.status,
      updatedAt: order.updated_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
