import { createClient } from '@supabase/supabase-js';

// Both of these are safe in the browser bundle. The publishable key on its own
// reaches nothing: ctd-provision.sql grants no policies to `anon`, so every read
// and write requires the session that staff-login mints after checking the
// shared staff code server-side.
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  // Keep staff signed in across reloads on their own device, and refresh the
  // token automatically so a session doesn't quietly expire mid-edit.
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }
);
