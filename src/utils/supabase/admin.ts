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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Configuración crítica faltante: NEXT_PUBLIC_SUPABASE_URL no está definida.");
  }

  if (!serviceRoleKey) {
    throw new Error("Configuración crítica faltante: SUPABASE_SERVICE_ROLE_KEY no está definida en el entorno seguro.");
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
