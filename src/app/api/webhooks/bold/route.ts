import { NextResponse } from "next/server";
import { fulfillOrder } from "@/utils/orderFulfillment";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Bold Webhook Received:", body);

    // Bold usually sends something like:
    // { "order_id": "uuid", "status": "APPROVED", "signature": "..." }
    // You must adapt this to the exact structure Bold sends!

    const orderId = body.order_id || body.reference_id || body.reference;
    const status = body.status || body.payment_status;

    // Validate Signature if provided by Bold (highly recommended)
    // const secret_key = process.env.BOLD_SECRET_KEY!;
    // const expectedSignature = ...

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    if (status === "APPROVED" || status === "APPROVED" || status === "PAID") {
      await fulfillOrder(orderId);
      return NextResponse.json({ message: "Order fulfilled successfully" });
    } else {
      // Handle REJECTED, CANCELLED, etc.
      return NextResponse.json({ message: `Order status is ${status}, ignored.` });
    }

  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
