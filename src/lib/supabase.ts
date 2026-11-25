import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getStoredConfig = () => {
  try {
    const stored = localStorage.getItem('vonchat_supabase_config');
    if (stored) return JSON.parse(stored);
  } catch (e) {
    // ignore
  }
  return {
    url: import.meta.env.VITE_SUPABASE_URL || 'https://foqsoghrfavskuyjxckc.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvcXNvZ2hyZmF2c2t1anhja2MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0MDM3OTcyMywiZXhwIjoyMDU1OTU1NzIzfQ.placeholder',
  };
};

const config = getStoredConfig();

export const SUPABASE_URL = config.url;
export const SUPABASE_ANON_KEY = config.anonKey;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let currentAuthToken: string | null = null;
let cachedSupabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: currentAuthToken ? { Authorization: `Bearer ${currentAuthToken}` } : {}
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );
  }
  return cachedSupabaseClient;
}

export const supabase = getSupabase();

export function setSupabaseAuthToken(token: string | null) {
  currentAuthToken = token;
  cachedSupabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  localStorage.setItem('vonchat_supabase_config', JSON.stringify({ url, anonKey }));
  window.location.reload();
}
