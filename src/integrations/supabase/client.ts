// Supabase client initialization with graceful fallback
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export function isSupabaseConfigured(): boolean {
  const SUPABASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env["VITE_SUPABASE_URL"]
      : undefined) || (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : undefined);
  const SUPABASE_PUBLISHABLE_KEY =
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]
      : undefined) ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_PUBLISHABLE_KEY"] : undefined);

  return Boolean(
    SUPABASE_URL &&
    SUPABASE_PUBLISHABLE_KEY &&
    !SUPABASE_URL.includes("placeholder") &&
    !SUPABASE_PUBLISHABLE_KEY.includes("dummy") &&
    SUPABASE_PUBLISHABLE_KEY.length > 10,
  );
}

function createSupabaseClient() {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  const SUPABASE_URL =
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env["VITE_SUPABASE_URL"]
      : undefined) ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_URL"] : undefined) ||
    "https://placeholder.supabase.co";

  const SUPABASE_PUBLISHABLE_KEY =
    (typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]
      : undefined) ||
    (typeof process !== "undefined" ? process.env?.["SUPABASE_PUBLISHABLE_KEY"] : undefined) ||
    "dummy-publishable-key";

  if (!isSupabaseConfigured()) {
    console.warn(
      "[Supabase] Note: Supabase environment variables (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) are not configured. The app will operate in offline/preview mode.",
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
