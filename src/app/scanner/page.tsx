import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { getAssignmentsForUser } from "@/utils/staffAssignments";
import MobileScannerClient from "./MobileScannerClient";
import { Lock, LogOut } from "lucide-react";
import { signOut } from "../(auth)/actions";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ScannerPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/scanner");
  }

  const adminDb = getAdminClient();

  const { data: profile } = await adminDb
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  const { data: authUserData } = await adminDb.auth.admin.getUserById(user.id);
  const metaRole = authUserData?.user?.user_metadata?.role;
  const effectiveRole = metaRole === "scanner" ? "scanner" : (profile?.role || "customer");

  // ÚNICAMENTE los admin y el super admin pueden tener todas las puertas.
  // El personal de puerta (scanner) sólo tiene acceso a las puertas que se le asignaron.
  const isSuperOrAdmin = (effectiveRole === "superadmin" || effectiveRole === "admin" || user.email === "admin@admin.com") && effectiveRole !== "scanner";

  let assignedEvents: any[] = [];

  if (isSuperOrAdmin) {
    // Admins y Superadmins tienen acceso a todos los eventos
    const { data: allEvents } = await adminDb
      .from("events")
      .select("id, title, cover_image, location_name, start_date, total_capacity")
      .order("start_date", { ascending: false });

    assignedEvents = allEvents || [];
  } else {
    // Personal de puerta obtiene únicamente sus eventos activos asignados
    const userAssignments = await getAssignmentsForUser(user.id);
    const activeAssignments = userAssignments.filter((a) => a.is_active === true);

    if (activeAssignments.length > 0) {
      const eventIds = activeAssignments.map((a) => a.event_id);
      const { data: eventsData } = await adminDb
        .from("events")
        .select("id, title, cover_image, location_name, start_date, total_capacity")
        .in("id", eventIds);

      assignedEvents = eventsData || [];
    }
  }

  // Si no tiene turnos activos asignados, mostrar pantalla de bloqueo brandeada
  if (assignedEvents.length === 0) {
    return (
      <div style={{
        maxWidth: "460px",
        margin: "0 auto",
        minHeight: "100vh",
        backgroundColor: "#050508",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "2rem" }}>
          <Image
            src="/Bass-Factory-Blanco-Sin-Letras.png"
            alt="Bass Factory"
            width={140}
            height={50}
            style={{ objectFit: "contain", width: "140px", height: "auto" }}
            priority
          />
        </div>

        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "2px solid rgba(239, 68, 68, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          marginBottom: "1.5rem"
        }}>
          <Lock size={36} />
        </div>

        <h1 style={{ fontSize: "1.45rem", fontWeight: 900, marginBottom: "0.5rem" }}>
          Acceso a Puerta No Disponible
        </h1>

        <p style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5, marginBottom: "2rem" }}>
          Hola <strong>{profile?.full_name || user.email}</strong>. No tienes ningún turno o evento asignado activamente en este momento.
          <br /><br />
          Si estás contratado para el control de acceso de hoy, solicita al <strong>administrador de Bassfactory</strong> que active tu asignación de puerta en el panel de eventos.
        </p>

        <form action={signOut} style={{ width: "100%" }}>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "white",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </form>
      </div>
    );
  }

  // Obtener conteo de boletas escaneadas para los eventos asignados
  const eventIds = assignedEvents.map((e) => e.id);
  const { data: tiers } = await adminDb
    .from("ticket_tiers")
    .select("id, event_id, name")
    .in("event_id", eventIds);

  const tierEventMap = new Map((tiers || []).map((t: any) => [t.id, t.event_id]));
  const tierNameMap = new Map((tiers || []).map((t: any) => [t.id, t.name]));
  const allTierIds = (tiers || []).map((t: any) => t.id);

  let scannedCountMap: { [eventId: string]: number } = {};
  let myScannedCountMap: { [eventId: string]: number } = {};
  let myRecentScansMap: { [eventId: string]: any[] } = {};

  if (allTierIds.length > 0) {
    const { data: scannedTickets } = await adminDb
      .from("tickets")
      .select("id, tier_id, status, scanned_at, scanned_by, assigned_name")
      .in("tier_id", allTierIds)
      .eq("status", "scanned");

    (scannedTickets || []).forEach((t: any) => {
      const eId = tierEventMap.get(t.tier_id);
      if (eId) {
        scannedCountMap[eId] = (scannedCountMap[eId] || 0) + 1;
        if (t.scanned_by === user.id) {
          myScannedCountMap[eId] = (myScannedCountMap[eId] || 0) + 1;
          if (!myRecentScansMap[eId]) myRecentScansMap[eId] = [];
          myRecentScansMap[eId].push({
            id: t.id,
            attendee_name: t.assigned_name || "Asistente Oficial",
            tier_name: tierNameMap.get(t.tier_id) || "Localidad Oficial",
            scanned_at: t.scanned_at
          });
        }
      }
    });

    // Ordenar los más recientes primero (hasta 20)
    for (const eId of Object.keys(myRecentScansMap)) {
      myRecentScansMap[eId].sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
      myRecentScansMap[eId] = myRecentScansMap[eId].slice(0, 20);
    }
  }

  const enrichedEvents = assignedEvents.map((ev) => ({
    id: ev.id,
    title: ev.title,
    cover_image: ev.cover_image,
    location_name: ev.location_name,
    start_date: ev.start_date,
    total_capacity: Number(ev.total_capacity) || 0,
    scanned_count: scannedCountMap[ev.id] || 0,
    my_scanned_count: myScannedCountMap[ev.id] || 0,
    my_recent_scans: myRecentScansMap[ev.id] || []
  }));

  return (
    <MobileScannerClient
      user={{
        id: user.id,
        email: user.email || "",
        full_name: profile?.full_name || "Personal de Puerta",
        role: effectiveRole,
      }}
      events={enrichedEvents}
    />
  );
}
