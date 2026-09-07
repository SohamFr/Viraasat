import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 *
 * Uses the publishable key for standard API access.
 * The DATABASE_PASSWORD is available via process.env for direct
 * Postgres connections (e.g. migrations, admin scripts) but is
 * intentionally NOT used here to keep this client scoped.
 */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
