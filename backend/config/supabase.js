import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('http'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

if (isSupabaseConfigured) {
  console.log('[AccessRoute Database] Connected to Supabase PostgreSQL at:', supabaseUrl);
} else {
  console.log('[AccessRoute Database] Running with Chennai Seeded Data Store (Local In-Memory / Supabase-ready adapter)');
}
