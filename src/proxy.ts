import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          supabaseResponse.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedAccount = pathname.startsWith("/account");
  const isProtectedAdmin = pathname.startsWith("/admin");

  // Solo consultar Auth/BD en el proxy para rutas protegidas (/account y /admin)
  // o si el usuario tiene cookies de sesión activas que puedan requerir refresco
  const hasAuthCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));

  if (!isProtectedAccount && !isProtectedAdmin && !hasAuthCookie) {
    return supabaseResponse;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger rutas de /account
  if (isProtectedAccount && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Proteger rutas de /admin
  if (isProtectedAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Verificar rol
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "superadmin")) {
      // Redirigir a account si es un usuario normal que intenta entrar al admin
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
