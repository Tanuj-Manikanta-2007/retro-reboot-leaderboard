import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anon &&
    !url.includes("placeholder-app") &&
    !anon.includes("placeholder-anon")
  );
}

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-app.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Can be ignored if called from Server Component
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Can be ignored if called from Server Component
        }
      },
    },
    global: {
      fetch: (url: any, options: any = {}) => {
        return fetch(url, {
          ...options,
          cache: "no-store",
        });
      },
    },
  });
}

/**
 * Service Role Client - Strictly for server-side trusted operations
 * NEVER export or use in Client Components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-app.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (url: any, options: any = {}) => {
        return fetch(url, {
          ...options,
          cache: "no-store",
        });
      },
    },
  });
}
