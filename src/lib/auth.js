// Two separate sign-ins, deliberately.
//
// STAFF — one shared code, checked server-side, exchanged for a real Supabase
// session. Persisted, so staff stay signed in on their own device.
//
// ADMIN — a separate password, also checked server-side, exchanged for a short
// HMAC token held in sessionStorage. Closing the tab drops admin.
//
// Neither secret is ever in the bundle, and neither is ever stored in the
// browser. This replaces the old ADMIN_PIN = '1234', which shipped in plain
// text in the public JavaScript and could be bypassed by setting one
// localStorage key.

import { supabase } from './supabase';

const ADMIN_KEY = 'ctd_admin';

async function post(fn, payload) {
  let res;
  try {
    res = await fetch(`/.netlify/functions/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
  } catch {
    return { error: 'Couldn’t reach the server. Check your connection.' };
  }
  const data = await res.json().catch(() => ({}));
  // 404 means the functions aren't deployed (or you're on plain `vite dev`
  // instead of `netlify dev`) — a setup problem, not a wrong code.
  if (res.status === 503 || res.status === 404 || data.error === 'not_configured') {
    return { error: 'This hub isn’t connected yet. Ask the office to finish setup.' };
  }
  if (!res.ok) return { error: data.error || 'Something went wrong. Try again.' };
  return { data };
}

// ── Staff ──────────────────────────────────────────────────────────────────

export async function staffLogin(code) {
  const { data, error } = await post('staff-login', { code });
  if (error) return { error };

  const { error: sessErr } = await supabase.auth.setSession({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
  });
  if (sessErr) return { error: 'Couldn’t start your session. Try again.' };
  return { ok: true };
}

export async function hasStaffSession() {
  const { data } = await supabase.auth.getSession();
  return !!data?.session?.access_token;
}

export async function staffLogout() {
  adminLogout();
  await supabase.auth.signOut();
}

// ── Admin ──────────────────────────────────────────────────────────────────

export function adminToken() {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    const { token, exp } = JSON.parse(raw);
    // The server checks expiry too — this just avoids a pointless round trip
    // and lets the UI drop admin controls the moment they stop working.
    if (!token || !exp || exp <= Date.now()) {
      sessionStorage.removeItem(ADMIN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export async function adminLogin(password) {
  const { data, error } = await post('admin-login', { password });
  if (error) return { error };
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify({ token: data.token, exp: data.exp }));
  return { ok: true };
}

export function adminLogout() {
  sessionStorage.removeItem(ADMIN_KEY);
}

// Every privileged action goes through here. On a 401 we clear the local admin
// flag as well, so the UI can't keep showing controls the server won't honour.
export async function adminFetch(action, payload) {
  const token = adminToken();
  if (!token) return { error: 'Your admin session expired. Please sign in again.', unauthorized: true };

  let res;
  try {
    res = await fetch('/.netlify/functions/admin-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...(payload || {}) }),
    });
  } catch {
    return { error: 'Couldn’t reach the server. Check your connection.' };
  }

  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    adminLogout();
    return { error: data.error || 'Your admin session expired. Please sign in again.', unauthorized: true };
  }
  if (res.status === 503 || data.error === 'not_configured') {
    return { error: 'This hub isn’t connected yet. Ask the office to finish setup.' };
  }
  if (!res.ok) return { error: data.error || 'Something went wrong. Try again.' };
  return { data };
}
