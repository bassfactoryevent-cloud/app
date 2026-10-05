import { createClient, SupabaseClient } from "@supabase/supabase-js";

let liveAdminClient: SupabaseClient | null = null;
let liveKeyUsed: string | null = null;

function getLiveAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tkbrnblnkmuopmffslzn.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // Return a safe placeholder client during build / static generation
    return createClient(supabaseUrl, "placeholder-service-role-key-for-build", {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  if (liveAdminClient && liveKeyUsed === serviceRoleKey) {
    return liveAdminClient;
  }

  liveAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  liveKeyUsed = serviceRoleKey;
  return liveAdminClient;
}

const adminProxy = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getLiveAdminClient() as any;
    const value = client[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Returns a Supabase client with the Service Role key.
 * Uses a dynamic proxy so that live environment variables are always
 * resolved at runtime even if called at module evaluation time.
 */
export function getAdminClient(): SupabaseClient {
  return adminProxy;
}

// Named alias for convenience
export const supabaseAdmin = adminProxy;
