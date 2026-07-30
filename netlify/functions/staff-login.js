// Staff sign-in: one code per person ("Connie-88"), checked server-side.
//
// The code does two jobs at once. It is the lock — it decides whether you get
// in at all — and it is the introduction: the answer carries the name of the
// person that code belongs to. The browser no longer gets to assert who it is.
// Before, everyone shared one code and then picked their own name off a list,
// so "these are Shannon's tasks" was a claim the client made about itself and
// anyone could make it about anyone.
//
// What comes back is still the single shared Supabase session. Identity is
// established here, not in Postgres, so RLS continues to see exactly one
// staffer and the grants in ctd-provision.sql §3 apply unchanged. Naming the
// person is an honesty improvement over self-selection, not a database
// boundary — the boundary that is enforced is still staff-vs-admin.

import { json, readPost, haveService, slowFail, supabaseUrl, anonKey, sb, sbRpc, mintAdminToken } from './_ctd.js';

const STAFF_EMAIL    = process.env.STAFF_AUTH_EMAIL || '';
const STAFF_PASSWORD = process.env.STAFF_AUTH_PASSWORD || '';

const WRONG_CODE = 'That code isn’t right. Check with the office.';

// The name half of "Connie-88". Guessing attacks walk the year, so this is the
// part that stays constant across an attempt run and therefore the thing worth
// counting. A code with no dash counts under itself.
function nameKeyOf(code) {
  const dash = code.indexOf('-');
  return (dash > 0 ? code.slice(0, dash) : code).trim().toLowerCase();
}

async function firstRow(res) {
  if (!res || !res.ok) return null;
  const rows = await res.json().catch(() => null);
  return Array.isArray(rows) ? rows[0] || null : rows || null;
}

export default async (request) => {
  const { res, body } = await readPost(request);
  if (res) return res;

  if (!haveService() || !STAFF_EMAIL || !STAFF_PASSWORD || !anonKey()) {
    return json(503, { error: 'not_configured' });
  }

  const code = String(body?.code || '').trim();
  if (!code) {
    await slowFail();
    return json(401, { error: WRONG_CODE });
  }

  const nameKey = nameKeyOf(code);

  // Locked out? Checked before the lookup, so a code under attack cannot be
  // confirmed or ruled out while the lock is on.
  const lock = await firstRow(
    await sb(`ctd_login_throttle?name_key=eq.${encodeURIComponent(nameKey)}&select=locked_until`)
  ).catch(() => null);

  if (lock?.locked_until && new Date(lock.locked_until).getTime() > Date.now()) {
    return json(429, {
      error: 'Too many tries with that name. Wait a few minutes and try again, or ask the office.',
    });
  }

  const member = await firstRow(await sbRpc('ctd_lookup_staff_code', { p_code: code }))
    .catch(() => null);

  if (!member?.member_id) {
    await sbRpc('ctd_note_login_failure', { p_name: nameKey }).catch(() => {});
    await slowFail();
    return json(401, { error: WRONG_CODE });
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

  // Right code: forgive the earlier fumbles rather than let them accumulate
  // toward a lockout on some unrelated day.
  await sbRpc('ctd_clear_login_failures', { p_name: nameKey }).catch(() => {});

  // An admin's own code is their admin credential. The roster decides this —
  // `is_admin` comes back from the lookup, which reads a column staff cannot
  // write — so the browser never gets a say in whether it is holding admin.
  // The token is the same unforgeable HMAC admin-login issues; the only thing
  // that changed is what proves you deserve one.
  const isAdmin = member.is_admin === true;
  const admin = isAdmin ? mintAdminToken() : null;

  return json(200, {
    ok: true,
    access_token:  session.access_token,
    refresh_token: session.refresh_token,
    expires_at:    session.expires_at,
    member: { id: member.member_id, name: member.member_name, isAdmin },
    ...(admin ? { admin_token: admin.token, admin_exp: admin.exp } : {}),
  });
};
