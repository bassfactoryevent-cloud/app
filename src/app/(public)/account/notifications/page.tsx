import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";
import { getUserNotifications } from "@/utils/notifications";

export const dynamic = "force-dynamic";

export default async function AccountNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || "user";

  // Generate actionable notifications from user database activity
  const notifications = await getUserNotifications({
    id: user.id,
    email: user.email,
    role: userRole
  });

  return (
    <div style={{ paddingBottom: "4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ 
          fontSize: "clamp(1.75rem, 3vw, 2.25rem)", 
          fontWeight: 800, 
          marginBottom: "0.5rem", 
          fontFamily: "Outfit, sans-serif",
          color: "white"
        }}>
          Centro de Notificaciones
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "1rem", margin: 0 }}>
          Avisos inmediatos sobre tus compras, facturas oficiales, logística de envíos y boletas de eventos.
        </p>
      </div>

      <NotificationsClient 
        notifications={notifications} 
        userRole={userRole} 
      />
    </div>
  );
}
