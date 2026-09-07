import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client.
 *
 * Uses the public URL and publishable key — both are safe to expose
 * in client bundles. Row Level Security (RLS) on Supabase ensures
 * that even with the publishable key, users can only access data
 * they're authorized to see.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
      'Check your .env.local file.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
