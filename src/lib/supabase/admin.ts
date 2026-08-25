import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client for B.A.N. Read-Only Intelligence
// Uses SUPABASE_SERVICE_ROLE_KEY if valid, otherwise falls back to ANON KEY
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isPlaceholderKey =
    !rawServiceKey ||
    rawServiceKey.trim() === '' ||
    rawServiceKey.includes('your-service-role-key') ||
    rawServiceKey === 'placeholder-key';

  const supabaseKey = !isPlaceholderKey
    ? rawServiceKey
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key');

  return createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
