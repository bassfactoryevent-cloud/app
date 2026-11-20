import { createClient, getCachedUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsForm from "@/components/account/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const [supabase, user] = await Promise.all([createClient(), getCachedUser()]);

  if (!user) redirect("/login");

  const [profileRes, djsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("djs")
      .select("id, name, photo_url, genres")
      .order("name", { ascending: true })
      .limit(24),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "white" }}>
          Ajustes y Perfil Musical
        </h2>
        <p
          style={{
            color: "var(--color-text-secondary)",
            fontSize: "0.78rem",
            margin: "2px 0 0 0",
          }}
        >
          Personaliza tu identidad, tus géneros, DJs y seguridad para adaptar la cartelera a tu gusto.
        </p>
      </div>

      <SettingsForm
        user={user}
        profile={profileRes.data}
        availableDjs={djsRes.data || []}
      />
    </div>
  );
}
