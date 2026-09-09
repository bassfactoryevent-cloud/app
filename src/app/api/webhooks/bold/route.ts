import { NextResponse } from "next/server";
import { fulfillOrder } from "@/utils/orderFulfillment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Bold Webhook Received Payload:", JSON.stringify(body));

    // Handle nested Bold payloads or flat payloads
    const payload = body?.data || body?.payload || body;
    const orderId = payload?.order_id || payload?.reference_id || payload?.reference || body?.order_id || body?.reference_id || body?.reference;
    
    // Status can be in payment_status, status, transaction_status, etc.
    const rawStatus = (payload?.status || payload?.payment_status || payload?.transaction_status || body?.status || body?.payment_status || body?.event || "")
      .toString()
      .toUpperCase();

    if (!orderId) {
      console.warn("Bold Webhook received without orderId:", body);
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // Bold successful statuses: APPROVED, PAID, SUCCESS, SUCCESSFUL, payment.successful
    const isApproved = 
      rawStatus === "APPROVED" || 
      rawStatus === "PAID" || 
      rawStatus === "SUCCESSFUL" || 
      rawStatus.includes("APPROVED") || 
      rawStatus.includes("SUCCESS") ||
      rawStatus === "PAYMENT.SUCCESSFUL";

    if (isApproved) {
      console.log(`Fulfilling order ${orderId} via Bold Webhook...`);
      await fulfillOrder(orderId);
      return NextResponse.json({ success: true, message: `Order ${orderId} fulfilled successfully` });
    } else {
      console.log(`Order ${orderId} status is '${rawStatus}', skipping fulfillment.`);
      return NextResponse.json({ success: true, message: `Status is ${rawStatus}, no action taken` });
    }

  } catch (error: any) {
    console.error("Bold Webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
