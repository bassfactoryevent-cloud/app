import { NextResponse } from "next/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { sendTicketEmail } from "@/utils/sendTicketEmail";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const supabase = getAdminClient();
    // 0. Authorization check
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isVercelCron = req.headers.get("x-vercel-cron") !== null;

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}` && !isVercelCron) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    } else if (!isVercelCron && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "No autorizado. CRON_SECRET requerido en producción." }, { status: 401 });
    }

    // 1. Obtener los eventos que suceden en las próximas 48 horas
    const now = new Date();
    const in48Hours = new Date();
    in48Hours.setHours(in48Hours.getHours() + 48);

    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("id, title")
      .gte("start_date", now.toISOString())
      .lte("start_date", in48Hours.toISOString());

    if (eventsError || !events || events.length === 0) {
      return NextResponse.json({ message: "No events upcoming in the next 48h" });
    }

    let ticketsDispatched = 0;

    for (const event of events) {
      // 2. Obtener los tiers del evento
      const { data: tiers } = await supabase
        .from("ticket_tiers")
        .select("id")
        .eq("event_id", event.id);

      const tierIds = tiers?.map(t => t.id) || [];
      if (tierIds.length === 0) continue;

      // 3. Obtener tickets válidos aún no despachados
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id")
        .in("tier_id", tierIds)
        .eq("status", "valid")
        .eq("qr_dispatched", false);

      if (!tickets || tickets.length === 0) continue;

      for (const t of tickets) {
        try {
          const sent = await sendTicketEmail(t.id);
          if (sent) ticketsDispatched++;
        } catch (dispatchErr) {
          console.error(`Error despachando ticket cron ${t.id}:`, dispatchErr);
        }
      }
    }

    return NextResponse.json({ success: true, dispatched: ticketsDispatched });
  } catch (error: any) {
    console.error("Cron Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
