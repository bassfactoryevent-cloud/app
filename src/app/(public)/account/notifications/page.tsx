import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";
import { getUserNotifications } from "@/utils/notifications";

export const dynamic = "force-dynamic";

export default async function AccountNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role || "user";

  const notifications = await getUserNotifications({
    id: user.id,
    email: user.email,
    role: userRole,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "white" }}>
          Avisos y Notificaciones
        </h2>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "0.78rem",
            margin: "2px 0 0 0",
          }}
        >
          Actividad reciente de tus boletas, facturas y envíos.
        </p>
      </div>

      <NotificationsClient notifications={notifications} userRole={userRole} />
    </div>
  );
}
