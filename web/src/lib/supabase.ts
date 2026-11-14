import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if user has saved credentials in localStorage
const storedUrl = localStorage.getItem('mym_supabase_url') || envUrl;
const storedKey = localStorage.getItem('mym_supabase_anon_key') || envKey;

export const isSupabaseConfigured = Boolean(storedUrl && storedKey);

// Use a placeholder client if not configured so createClient doesn't throw
export const supabase = createClient(
  storedUrl || 'https://placeholder.supabase.co',
  storedKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem('mym_supabase_url', url);
  localStorage.setItem('mym_supabase_anon_key', key);
  window.location.reload();
}
