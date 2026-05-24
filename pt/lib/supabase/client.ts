import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser-side singleton — prevents multiple GoTrueClient instances fighting
// over the same localStorage key and causing auth state races.
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // Server context (API routes, RSC): always a fresh instance per call
    return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON);
  }
  if (!_client) {
    _client = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _client;
}
