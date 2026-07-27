// Shared helpers for the ConnectHub functions (staff-login / admin-login / admin-action).
//
// Server-only. The two secrets that matter — the shared staff code and the admin
// password — are compared here and never leave the server, so neither one is ever
// present in the browser bundle the way the old ADMIN_PIN was.
//
// Pattern follows PacketHub's netlify/functions/_campaign.js.

import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || '';

export const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const json = (status, obj) =>
  new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export const supabaseUrl = () => SUPABASE_URL;
export const anonKey     = () => ANON_KEY;
export function haveService() { return !!SERVICE_KEY && !!SUPABASE_URL; }

// Supabase REST call with the service-role key. `path` is everything after /rest/v1/.
export function sb(path, init = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

// Call a security-definer RPC with the service-role key.
export function sbRpc(fn, args) {
  return fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args || {}),
  });
}

// Constant-time secret comparison.
//
// Both sides are hashed to a fixed 32 bytes FIRST. That isn't decoration:
// timingSafeEqual throws outright on a length mismatch, so comparing the raw
// strings would leak the secret's length through the error path — and would
// crash the function instead of returning a clean 401.
export function secretEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

// Failed logins all take about the same time regardless of why they failed,
// which takes the edge off rapid guessing against a single shared code.
export const slowFail = () => new Promise(r => setTimeout(r, 400));

// ── Admin tokens ───────────────────────────────────────────────────────────
// A short HMAC the server can verify but the browser cannot forge. Held in
// sessionStorage, so closing the tab drops admin.

export function mintAdminToken(ttlMs = 8 * 60 * 60 * 1000) {
  const exp = Date.now() + ttlMs;
  const sig = createHmac('sha256', ADMIN_TOKEN_SECRET).update(String(exp)).digest('hex');
  return { token: `${exp}.${sig}`, exp };
}

function verifyAdminToken(token) {
  if (!ADMIN_TOKEN_SECRET || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const exp = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d+$/.test(exp)) return false;
  const expected = createHmac('sha256', ADMIN_TOKEN_SECRET).update(exp).digest('hex');
  if (!secretEq(sig, expected)) return false;
  return Number(exp) > Date.now();
}

// Gate: the caller must hold a valid, unexpired admin token.
// Returns { ok:true } or { ok:false, res } where res is a ready Response.
export function requireAdmin(req) {
  if (!haveService()) {
    return { ok: false, res: json(503, { error: 'not_configured' }) };
  }
  if (!ADMIN_TOKEN_SECRET) {
    return { ok: false, res: json(503, { error: 'not_configured' }) };
  }
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { ok: false, res: json(401, { error: 'Not signed in as an admin.' }) };
  if (!verifyAdminToken(token)) {
    return { ok: false, res: json(401, { error: 'Your admin session expired. Please sign in again.' }) };
  }
  return { ok: true };
}

// Standard preamble: handle the preflight, reject non-POST, parse the body.
// Returns { body } or { res } — a ready Response to return immediately.
export async function readPost(request) {
  if (request.method === 'OPTIONS') return { res: new Response(null, { headers: CORS }) };
  if (request.method !== 'POST')    return { res: json(405, { error: 'Method not allowed.' }) };
  try {
    return { body: await request.json() };
  } catch {
    return { body: {} };
  }
}
