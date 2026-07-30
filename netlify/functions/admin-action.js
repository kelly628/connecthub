// Every action a staffer is NOT allowed to do. One endpoint, service-role key,
// admin token verified first.
//
// The database backs this up independently: ctd-provision.sql §3 revokes these
// exact writes from `authenticated`, so even a staffer who bypasses the UI and
// hits PostgREST directly with a valid staff session gets refused. This
// function is the only path that can perform them.

import { json, readPost, sb, sbRpc, requireAdmin } from './_ctd.js';

const REPRESENT = { Prefer: 'return=representation' };

const nowIso = () => new Date().toISOString();

// Returns a ready Response if removing this person's approval rights would
// leave nobody able to approve, or null if it is safe to proceed.
async function lastAdminGuard(memberId) {
  const r = await sb('ctd_members?is_admin=eq.true&archived=eq.false&select=id');
  if (!r.ok) return json(502, { error: 'Couldn’t check who can approve. Try again.' });
  const admins = await r.json().catch(() => []);
  if (!Array.isArray(admins)) return null;
  const isTheLastOne = admins.length <= 1 && admins.some(a => a.id === memberId);
  if (!isTheLastOne) return null;
  return json(409, {
    error: 'Someone has to be able to approve projects. Give approval to another person first, then remove it here.',
  });
}

export default async (request) => {
  const { res, body } = await readPost(request);
  if (res) return res;

  const gate = requireAdmin(request);
  if (!gate.ok) return gate.res;

  const action = String(body?.action || '');
  const by     = String(body?.by || '').slice(0, 120) || null;

  try {
    switch (action) {
      case 'approve': {
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, {
          method: 'PATCH',
          headers: REPRESENT,
          body: JSON.stringify({ blessed: true, blessed_at: nowIso(), blessed_by: by }),
        });
        if (!r.ok) return json(502, { error: 'Couldn’t approve that project.' });
        return json(200, { ok: true, project: (await r.json())?.[0] || null });
      }

      case 'revoke': {
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, {
          method: 'PATCH',
          headers: REPRESENT,
          body: JSON.stringify({ blessed: false, blessed_at: null, blessed_by: null }),
        });
        if (!r.ok) return json(502, { error: 'Couldn’t change that project.' });
        return json(200, { ok: true, project: (await r.json())?.[0] || null });
      }

      case 'unsubmit': {
        // "Back to Draft" — pull a project out of the approval queue.
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, {
          method: 'PATCH',
          headers: REPRESENT,
          body: JSON.stringify({ submitted: false, submitted_at: null, blessed: false, blessed_at: null, blessed_by: null }),
        });
        if (!r.ok) return json(502, { error: 'Couldn’t change that project.' });
        return json(200, { ok: true, project: (await r.json())?.[0] || null });
      }

      case 'delete_project': {
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        // Dots and tasks go with it via on delete cascade.
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
        if (!r.ok) return json(502, { error: 'Couldn’t delete that project.' });
        return json(200, { ok: true });
      }

      case 'save_member': {
        const m = body?.member || {};
        const name = String(m.name || '').trim();
        if (!name) return json(400, { error: 'A team member needs a name.' });
        const row = {
          name,
          title:      String(m.title || '').trim(),
          photo_url:  m.photoUrl || null,
          sort_order: Number.isFinite(m.sortOrder) ? m.sortOrder : 0,
        };
        // Look travels with the rest when an admin saves, so their edit does
        // not quietly revert an icon or colour the person chose themselves.
        if ('iconName' in m) row.icon_name = m.iconName || null;
        if ('color'    in m) row.color     = m.color || null;
        // Only touched when the form actually offered the control, so a save
        // from a screen that never showed it cannot silently demote anyone.
        if (typeof m.isAdmin === 'boolean') row.is_admin = m.isAdmin;

        // Approving is now a property of a person, which means it is possible
        // to switch off the last one and leave every future project stuck in
        // the queue with nobody able to bless it — recoverable only by hand in
        // SQL. Refuse instead.
        if (m.id && m.isAdmin === false) {
          const gate = await lastAdminGuard(m.id);
          if (gate) return gate;
        }

        // A rename has to cascade to dots and project leads, or the person's
        // work silently detaches from them. The RPC does all three together.
        if (m.id) {
          const prevRes = await sb(`ctd_members?id=eq.${encodeURIComponent(m.id)}&select=name`);
          const prev = (await prevRes.json().catch(() => []))?.[0];
          if (prev && prev.name.trim().toLowerCase() !== name.toLowerCase()) {
            const rn = await sbRpc('ctd_rename_member', { p_old: prev.name, p_new: name });
            if (!rn.ok) return json(409, { error: 'That name is already taken by someone else on the team.' });
          }
          const r = await sb(`ctd_members?id=eq.${encodeURIComponent(m.id)}`, {
            method: 'PATCH', headers: REPRESENT, body: JSON.stringify(row),
          });
          if (!r.ok) return json(502, { error: 'Couldn’t save that team member.' });
          return json(200, { ok: true, member: (await r.json())?.[0] || null });
        }

        const r = await sb('ctd_members', {
          method: 'POST', headers: REPRESENT, body: JSON.stringify(row),
        });
        if (r.status === 409) return json(409, { error: 'Someone with that name is already on the team.' });
        if (!r.ok) return json(502, { error: 'Couldn’t add that team member.' });
        return json(200, { ok: true, member: (await r.json())?.[0] || null });
      }

      // The office has to be able to answer "what's Rayne's code again?", so
      // codes are readable — but only here, behind the admin token. The table
      // itself is revoked from the Data API, so a signed-in staffer asking
      // Supabase directly gets nothing.
      case 'list_codes': {
        const r = await sb('ctd_staff_codes?select=member_id,code');
        if (!r.ok) return json(502, { error: 'Couldn’t load the sign-in codes.' });
        const rows = await r.json().catch(() => []);
        return json(200, { ok: true, codes: Array.isArray(rows) ? rows : [] });
      }

      case 'set_member_code': {
        if (!body?.id) return json(400, { error: 'Missing member id.' });
        const code = String(body?.code || '').trim();

        // An empty code removes it, which is how you take someone's access
        // away without removing them from the roster and detaching their work.
        if (!code) {
          const r = await sb(`ctd_staff_codes?member_id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
          if (!r.ok) return json(502, { error: 'Couldn’t clear that code.' });
          return json(200, { ok: true, code: '' });
        }

        if (code.length < 4) {
          return json(400, { error: 'A code needs at least 4 characters.' });
        }

        const r = await sb('ctd_staff_codes?on_conflict=member_id', {
          method: 'POST',
          headers: { ...REPRESENT, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ member_id: body.id, code, updated_at: nowIso() }),
        });
        // The unique index is on lower(trim(code)), so this catches "Kelly-99"
        // colliding with an existing "kelly-99" — which would otherwise hand
        // one person's code to two people.
        if (r.status === 409) return json(409, { error: 'Someone else already uses that code. Pick a different one.' });
        if (!r.ok) return json(502, { error: 'Couldn’t save that code.' });
        return json(200, { ok: true, code });
      }

      case 'delete_member': {
        if (!body?.id) return json(400, { error: 'Missing member id.' });
        // Same trap as demoting the last approver, reached a different way.
        const gate = await lastAdminGuard(body.id);
        if (gate) return gate;
        // Dots keep member_name, so a deleted person's assignments stay
        // readable ("who was doing this?") instead of silently emptying.
        const r = await sb(`ctd_members?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
        if (!r.ok) return json(502, { error: 'Couldn’t remove that team member.' });
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: 'Unknown action.' });
    }
  } catch {
    return json(502, { error: 'Something went wrong. Try again.' });
  }
};
