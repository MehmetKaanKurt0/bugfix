import { createClient, RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

export function subscribeToTable(
  table: string,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const client = createBrowserClient();
  return client
    .channel(`realtime:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => callback(payload as unknown as Record<string, unknown>)
    )
    .subscribe();
}
