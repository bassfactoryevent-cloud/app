import { createClient, SupabaseClient } from "@supabase/supabase-js";

let adminClientInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase client with the Service Role key.
 * This client bypasses RLS and should ONLY be used in secure server environments
 * (Server Actions, Route Handlers, Background Crons).
 * 
 * NEVER expose the Service Role key to the client/browser.
 */
export function getAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn("[Bassfactory Admin] Advertencia: SUPABASE_SERVICE_ROLE_KEY no está definida en las variables de entorno.");
    // Cliente de reserva seguro para evitar que Next.js falle durante 'next build' al colectar rutas
    return createClient(supabaseUrl, "placeholder-service-role-key-for-build", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClientInstance;
}

// Named alias for convenience
export const supabaseAdmin = {
  from: (table: string) => getAdminClient().from(table),
  auth: {
    admin: () => getAdminClient().auth.admin,
  },
  storage: {
    from: (bucket: string) => getAdminClient().storage.from(bucket),
  },
};
