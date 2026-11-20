import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { error: "Por favor ingresa tu correo y contraseña." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      const msg = (error?.message || "").toLowerCase();
      if (msg.includes("email not confirmed")) {
        return NextResponse.json(
          { error: "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada o spam." },
          { status: 401 }
        );
      }
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return NextResponse.json(
          { error: "Demasiados intentos seguidos. Espera unos segundos e inténtalo de nuevo." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "No se pudo iniciar sesión. Verifica tu correo y contraseña." },
        { status: 401 }
      );
    }

    // Ensure profile exists and check role for appropriate landing redirect
    const adminDb = getAdminClient();
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile) {
      await adminDb.from("profiles").insert({
        id: data.user.id,
        full_name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          cleanEmail.split("@")[0],
        role: "customer",
      });
    }

    const metaRole = data.user.user_metadata?.role;
    const effectiveRole =
      metaRole === "scanner" ? "scanner" : profile?.role || metaRole;

    let redirectUrl = "/account";
    if (effectiveRole === "admin" || effectiveRole === "superadmin") {
      redirectUrl = "/admin";
    } else if (effectiveRole === "scanner") {
      redirectUrl = "/scanner";
    }

    return NextResponse.json({ success: true, redirectUrl });
  } catch (err: any) {
    console.error("Error in login API route:", err);
    return NextResponse.json(
      { error: err?.message || "Ocurrió un error inesperado al iniciar sesión." },
      { status: 500 }
    );
  }
}
