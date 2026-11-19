import { createClient } from "@/utils/supabase/server";
import { getAdminClient } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, full_name } = body;

    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanName = (full_name || "").trim();

    if (!cleanEmail || !password || !cleanName) {
      return NextResponse.json(
        { error: "Por favor completa todos los campos requeridos." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("exists")) {
        return NextResponse.json(
          { error: "Este correo electrónico ya está registrado en Bassfactory. Por favor inicia sesión con tu contraseña." },
          { status: 400 }
        );
      }
      if (msg.includes("password")) {
        return NextResponse.json(
          { error: "La contraseña no es válida. Debe tener al menos 6 caracteres." },
          { status: 400 }
        );
      }
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return NextResponse.json(
          { error: "Demasiados intentos seguidos. Espera unos segundos e inténtalo de nuevo." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Error al crear la cuenta. Inténtalo de nuevo." },
        { status: 400 }
      );
    }

    // Supabase returns a user with empty identities array when email already exists and email confirmations are enabled
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return NextResponse.json(
        { error: "Este correo electrónico ya tiene una cuenta en Bassfactory. Inicia sesión para continuar." },
        { status: 400 }
      );
    }

    let hasSession = Boolean(data?.session);

    // Ensure profile exists in `profiles` table
    if (data?.user?.id) {
      try {
        const adminDb = getAdminClient();
        const { data: existingProfile } = await adminDb
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (!existingProfile) {
          await adminDb.from("profiles").insert({
            id: data.user.id,
            full_name: cleanName,
            role: "customer",
          });
        }
      } catch (profErr) {
        console.warn("Could not ensure profile row on register:", profErr);
      }
    }

    // Fallback: if signUp succeeded and email is auto-confirmed, ensure session cookies are set
    if (!hasSession && data?.user?.email_confirmed_at) {
      const signInRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInRes.data?.session) {
        hasSession = true;
      }
    }

    return NextResponse.json({
      success: true,
      hasSession,
      redirectUrl: hasSession
        ? "/account"
        : "/login?message=Cuenta+creada+exitosamente.+Inicia+sesión+para+continuar.",
      message: hasSession
        ? "¡Bienvenido a Bassfactory! Ingresando a tu cuenta..."
        : "Cuenta creada exitosamente. Inicia sesión para continuar.",
    });
  } catch (err: any) {
    console.error("Error in register API route:", err);
    return NextResponse.json(
      { error: err?.message || "Ocurrió un error inesperado al registrar la cuenta." },
      { status: 500 }
    );
  }
}
