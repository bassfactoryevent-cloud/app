import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, full_name } = body;

    if (!email || !password || !full_name) {
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
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: full_name.trim(),
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Error al crear la cuenta. Inténtalo de nuevo." },
        { status: 400 }
      );
    }

    const hasSession = Boolean(data?.session);

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
