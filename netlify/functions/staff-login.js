// Staff sign-in: one shared code for the whole staff.
//
// The code is checked here, server-side, and never reaches the browser. On a
// match we hand back a Supabase session for the single shared staff identity —
// that session is what RLS recognises as "a signed-in staffer", and it grants
// exactly what a staffer may do (work on projects; not approve, not delete,
// not edit the roster — those are revoked in ctd-provision.sql §3).

import { json, readPost, haveService, secretEq, slowFail, supabaseUrl, anonKey } from './_ctd.js';

const STAFF_CODE     = process.env.STAFF_CODE || '';
const STAFF_EMAIL    = process.env.STAFF_AUTH_EMAIL || '';
const STAFF_PASSWORD = process.env.STAFF_AUTH_PASSWORD || '';

export default async (request) => {
  const { res, body } = await readPost(request);
  if (res) return res;

  if (!haveService() || !STAFF_CODE || !STAFF_EMAIL || !STAFF_PASSWORD || !anonKey()) {
    return json(503, { error: 'not_configured' });
  }

  const code = String(body?.code || '').trim();
  if (!secretEq(code, STAFF_CODE.trim())) {
    await slowFail();
    return json(401, { error: 'That code isn’t right. Check with the office.' });
  }

  // Exchange the shared staff credentials for a real Supabase session.
  const tokenRes = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: STAFF_EMAIL, password: STAFF_PASSWORD }),
  }).catch(() => null);

  if (!tokenRes || !tokenRes.ok) {
    // The code was right but the shared account is missing or its password
    // doesn't match — a setup problem, not the staffer's fault. Say so.
    return json(503, { error: 'not_configured' });
  }

  const session = await tokenRes.json().catch(() => null);
  if (!session?.access_token) return json(503, { error: 'not_configured' });

  return json(200, {
    ok: true,
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    expires_at:    session.expires_at,
  });
};
