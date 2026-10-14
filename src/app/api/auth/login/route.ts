import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Por favor ingresa tu correo y contraseña." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "No se pudo iniciar sesión. Verifica tu correo y contraseña." },
        { status: 401 }
      );
    }

    // Role check for appropriate landing redirect
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    let redirectUrl = "/account";
    if (profile && (profile.role === "admin" || profile.role === "superadmin")) {
      redirectUrl = "/admin";
    } else if (profile && profile.role === "scanner") {
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
